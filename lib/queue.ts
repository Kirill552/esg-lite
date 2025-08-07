/**
 * Queue Manager для системы очередей на основе pg-boss
 * Интегрирован с системой монетизации кредитов
 * Задача 2.2: Обновить Queue Manager для проверки кредитов
 */

const PgBoss = require('pg-boss');
import { createPgBoss, QUEUE_NAMES, JOB_PRIORITIES, OcrJobData, OcrJobResult } from './pg-boss-config';
import { CreditsService } from './credits-service';
import { metricsCollector } from './metrics';
import { queueLogger } from './structured-logger';

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export interface DetailedQueueStats extends QueueStats {
  byStatus: Record<string, number>;
}

export interface ActiveJob {
  id: string;
  data: OcrJobData;
  createdAt: Date;
  startedAt?: Date;
  priority: number;
}

export interface FailedJob {
  id: string;
  data: OcrJobData;
  error: string;
  failedAt: Date;
  retryCount: number;
}

export interface PerformanceMetrics {
  averageProcessingTime: number;
  throughputPerHour: number;
  errorRate: number;
  queueHealth: 'healthy' | 'warning' | 'critical';
}

export interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress?: number;
  result?: OcrJobResult;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  priority: number;
}

export interface AddJobOptions {
  priority?: 'normal' | 'high' | 'urgent';
  retryLimit?: number;
  expireInHours?: number;
}

// Заглушки удалены - используем отдельные сервисы

/**
 * Основной класс Queue Manager
 */
export class QueueManager {
  private boss: any | null = null;
  private creditsService: CreditsService;

  constructor() {
    this.creditsService = new CreditsService();
  }

  /**
   * Инициализация pg-boss
   */
  async initialize(): Promise<void> {
    if (this.boss) {
      console.log('⚠️ Queue Manager уже инициализирован');
      return;
    }

    try {
      this.boss = await createPgBoss();
      
      // Создаем необходимые очереди
      await this.boss.createQueue(QUEUE_NAMES.OCR, {
        retryLimit: 3,
        retryDelay: 2000,
        expireInHours: 1
      });
      
      await this.boss.createQueue(QUEUE_NAMES.PDF_GENERATION, {
        retryLimit: 2,
        retryDelay: 5000,
        expireInHours: 2
      });
      
      await this.boss.createQueue(QUEUE_NAMES.CLEANUP, {
        retryLimit: 1,
        retryDelay: 10000,
        expireInHours: 23
      });
      
      console.log('✅ Queue Manager инициализирован успешно');
      console.log('✅ Очереди созданы:', Object.values(QUEUE_NAMES));
    } catch (error) {
      console.error('❌ Ошибка инициализации Queue Manager:', error);
      throw error;
    }
  }

  /**
   * Остановка pg-boss
   */
  async stop(): Promise<void> {
    if (this.boss) {
      await this.boss.stop();
      this.boss = null;
      console.log('🛑 Queue Manager остановлен');
    }
  }

  /**
   * Добавление задачи OCR в очередь с проверкой и блокировкой кредитов
   */
  async addOcrJob(data: OcrJobData, options: AddJobOptions = {}): Promise<string | null> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    const organizationId = data.organizationId || data.userId;

    await queueLogger.debug('Starting OCR job addition', {
      documentId: data.documentId,
      organizationId,
      options
    });

    // Этап 1: Расчет стоимости операции
    const operationCost = await this.creditsService.getOperationCost('ocr');
    const requiredCredits = operationCost.finalCost;

    await queueLogger.info('Calculated operation cost', {
      documentId: data.documentId,
      requiredCredits,
      baseCost: operationCost.baseCost,
      surgePricingMultiplier: operationCost.surgePricingMultiplier
    });

    // Этап 2: Проверка баланса кредитов
    const hasCredits = await this.creditsService.hasCredits(organizationId, requiredCredits);
    
    if (!hasCredits) {
      const balance = await this.creditsService.checkBalance(organizationId);
      
      await queueLogger.warn('Insufficient credits for organization', {
        organizationId,
        documentId: data.documentId,
        requiredCredits,
        availableCredits: balance.balance
      }, { organizationId });
      
      throw new Error(
        `INSUFFICIENT_CREDITS: Недостаточно кредитов для добавления задачи в очередь. ` +
        `Требуется: ${requiredCredits} т CO₂, доступно: ${balance.balance} т CO₂`
      );
    }

    // Этап 3: Предварительная блокировка кредитов
    const blockingResult = await this.blockCreditsForJob(organizationId, requiredCredits, data.documentId);
    
    if (!blockingResult.success) {
      throw new Error(`CREDITS_BLOCKING_FAILED: ${blockingResult.error}`);
    }

    // Определяем приоритет
    let priority: number = JOB_PRIORITIES.NORMAL;
    
    if (options.priority === 'urgent') {
      priority = JOB_PRIORITIES.URGENT;
    } else if (options.priority === 'high') {
      priority = JOB_PRIORITIES.HIGH;
    }

    const jobOptions = {
      priority,
      retryLimit: options.retryLimit || 3,
      expireInHours: options.expireInHours || 1
    };

    // Добавляем информацию о заблокированных кредитах в данные задачи
    const enrichedJobData = {
      ...data,
      _credits: {
        organizationId,
        blockedAmount: requiredCredits,
        blockingTransactionId: blockingResult.transactionId,
        operationCost
      }
    };

    await queueLogger.info('Adding OCR job to queue', {
      documentId: data.documentId,
      priority,
      requiredCredits,
      blockingTransactionId: blockingResult.transactionId,
      jobOptions
    }, { organizationId });

    try {
      const jobId = await this.boss.send(QUEUE_NAMES.OCR, enrichedJobData, jobOptions);
      
      await queueLogger.info('OCR job created', {
        jobId,
        documentId: data.documentId,
        jobIdType: typeof jobId,
        jobIdLength: jobId ? String(jobId).length : 0
      }, { organizationId });
      
      if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        throw new Error(`Invalid job ID returned: ${JSON.stringify(jobId)}`);
      }
      
      await queueLogger.jobStarted(jobId, 'OCR', {
        documentId: data.documentId,
        priority,
        organizationId,
        blockedCredits: requiredCredits
      });
      
      return jobId;
      
    } catch (error) {
      // Если не удалось добавить задачу в очередь, разблокируем кредиты
      if (blockingResult.transactionId) {
        await this.unblockCreditsForJob(organizationId, blockingResult.transactionId, 'Job queue addition failed');
      }
      
      await queueLogger.error('Failed to add OCR job to queue', error instanceof Error ? error : new Error(String(error)), {
        documentId: data.documentId,
        options: jobOptions,
        unblockedTransactionId: blockingResult.transactionId
      }, { organizationId });
      
      throw error;
    }
  }

  /**
   * Получение статуса задачи
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      const job = await this.boss.getJobById(QUEUE_NAMES.OCR, jobId);
      
      if (!job) {
        return null;
      }

      // Исправляем типы и названия полей согласно pg-boss API
      return {
        id: job.id,
        status: this.mapJobState(job.state),
        progress: (job.data as any)?.progress,
        result: job.output as OcrJobResult | undefined,
        error: (job.output as any)?.error,
        createdAt: job.createdOn,
        processedAt: job.completedOn || (job as any).failedOn,
        priority: job.priority || JOB_PRIORITIES.NORMAL
      };
    } catch (error) {
      console.error(`❌ Ошибка получения статуса задачи ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Получение статистики очередей
   */
  async getQueueStats(): Promise<QueueStats> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      // Упрощенная версия - получаем общий размер очереди
      const totalSize = await this.boss.getQueueSize(QUEUE_NAMES.OCR);
      
      // Заглушка для детальной статистики (в будущем можно улучшить)
      const stats = {
        waiting: totalSize,
        active: 0,
        completed: 0,
        failed: 0,
        total: totalSize
      };

      console.log('📊 Статистика очередей:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Ошибка получения статистики очередей:', error);
      throw error;
    }
  }

  /**
   * Очистка завершенных задач в PostgreSQL
   */
  async cleanCompletedJobs(olderThanHours: number = 24): Promise<number> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      console.log(`🧹 Запуск очистки задач старше ${olderThanHours} часов`);
      
      // Получаем доступ к базе данных через pg-boss
      const db = (this.boss as any).db;
      
      if (!db) {
        console.log('⚠️ Нет доступа к БД, используем автоочистку pg-boss');
        return 0;
      }

      // Очищаем завершенные задачи старше указанного времени
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      const result = await db.query(`
        DELETE FROM pgboss.job 
        WHERE name = $1 
        AND state IN ('completed', 'failed') 
        AND completedon < $2
      `, [QUEUE_NAMES.OCR, cutoffTime]);
      
      const cleanedCount = result.rowCount || 0;
      console.log(`✅ Очищено ${cleanedCount} завершенных задач`);
      
      return cleanedCount;
    } catch (error) {
      console.error('❌ Ошибка очистки завершенных задач:', error);
      // Fallback: pg-boss делает автоочистку
      return 0;
    }
  }

  /**
   * Получение детальной статистики по статусам задач
   */
  async getDetailedQueueStats(): Promise<QueueStats & { byStatus: Record<string, number> }> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      const db = (this.boss as any).db;
      
      if (!db) {
        // Fallback к простой статистике
        const basicStats = await this.getQueueStats();
        return {
          ...basicStats,
          byStatus: { created: basicStats.waiting }
        };
      }

      // Получаем детальную статистику из БД
      const result = await db.query(`
        SELECT 
          state,
          COUNT(*) as count
        FROM pgboss.job 
        WHERE name = $1 
        GROUP BY state
      `, [QUEUE_NAMES.OCR]);

      const byStatus: Record<string, number> = {};
      let waiting = 0, active = 0, completed = 0, failed = 0;

      result.rows.forEach((row: any) => {
        const count = parseInt(row.count);
        byStatus[row.state] = count;

        switch (row.state) {
          case 'created':
          case 'retry':
            waiting += count;
            break;
          case 'active':
            active += count;
            break;
          case 'completed':
            completed += count;
            break;
          case 'failed':
          case 'cancelled':
            failed += count;
            break;
        }
      });

      const stats = {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed,
        byStatus
      };

      console.log('📊 Детальная статистика очередей:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Ошибка получения детальной статистики:', error);
      // Fallback к простой статистике
      const basicStats = await this.getQueueStats();
      return {
        ...basicStats,
        byStatus: { unknown: basicStats.total }
      };
    }
  }

  /**
   * Получение списка активных задач
   */
  async getActiveJobs(limit: number = 10): Promise<Array<{
    id: string;
    data: OcrJobData;
    createdAt: Date;
    startedAt?: Date;
    priority: number;
  }>> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      const db = (this.boss as any).db;
      
      if (!db) {
        console.log('⚠️ Нет доступа к БД для получения активных задач');
        return [];
      }

      const result = await db.query(`
        SELECT 
          id,
          data,
          createdon,
          startedon,
          priority
        FROM pgboss.job 
        WHERE name = $1 
        AND state = 'active'
        ORDER BY startedon DESC
        LIMIT $2
      `, [QUEUE_NAMES.OCR, limit]);

      return result.rows.map((row: any) => ({
        id: row.id,
        data: row.data,
        createdAt: row.createdon,
        startedAt: row.startedon,
        priority: row.priority || JOB_PRIORITIES.NORMAL
      }));
    } catch (error) {
      console.error('❌ Ошибка получения активных задач:', error);
      return [];
    }
  }

  /**
   * Получение списка неудачных задач для анализа
   */
  async getFailedJobs(limit: number = 10): Promise<Array<{
    id: string;
    data: OcrJobData;
    error: string;
    failedAt: Date;
    retryCount: number;
  }>> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      const db = (this.boss as any).db;
      
      if (!db) {
        console.log('⚠️ Нет доступа к БД для получения неудачных задач');
        return [];
      }

      const result = await db.query(`
        SELECT 
          id,
          data,
          output,
          completedon as failed_at,
          retrycount
        FROM pgboss.job 
        WHERE name = $1 
        AND state = 'failed'
        ORDER BY completedon DESC
        LIMIT $2
      `, [QUEUE_NAMES.OCR, limit]);

      return result.rows.map((row: any) => ({
        id: row.id,
        data: row.data,
        error: row.output?.error || 'Unknown error',
        failedAt: row.failed_at,
        retryCount: row.retrycount || 0
      }));
    } catch (error) {
      console.error('❌ Ошибка получения неудачных задач:', error);
      return [];
    }
  }

  /**
   * Повторная обработка неудачной задачи
   */
  async retryFailedJob(jobId: string): Promise<string | null> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      // Получаем данные неудачной задачи
      const job = await this.boss.getJobById(QUEUE_NAMES.OCR, jobId);
      
      if (!job || job.state !== 'failed') {
        console.log(`⚠️ Задача ${jobId} не найдена или не в статусе failed`);
        return null;
      }

      // Создаем новую задачу с теми же данными
      const newJobId = await this.addOcrJob(job.data as OcrJobData, {
        priority: 'high' // Повторные задачи получают высокий приоритет
      });

      console.log(`🔄 Задача ${jobId} перезапущена как ${newJobId}`);
      return newJobId;
    } catch (error) {
      console.error(`❌ Ошибка повторной обработки задачи ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Отмена задачи (если она еще не начала выполняться)
   */
  async cancelJob(jobId: string): Promise<boolean> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      const result = await this.boss.cancel(jobId);
      
      if (result) {
        console.log(`❌ Задача ${jobId} отменена`);
      } else {
        console.log(`⚠️ Не удалось отменить задачу ${jobId} (возможно, уже выполняется)`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Ошибка отмены задачи ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Получение метрик производительности очереди
   */
  async getPerformanceMetrics(): Promise<{
    averageProcessingTime: number;
    throughputPerHour: number;
    errorRate: number;
    queueHealth: 'healthy' | 'warning' | 'critical';
  }> {
    if (!this.boss) {
      throw new Error('Queue Manager не инициализирован');
    }

    try {
      // Используем новый MetricsCollector для получения метрик
      const metrics = await metricsCollector.getPerformanceMetrics(24);
      
      // Преобразуем в формат, ожидаемый API
      const throughputPerHour = metrics.throughputPerMinute * 60;
      
      // Определяем здоровье очереди
      let queueHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (metrics.errorRate > 10) queueHealth = 'warning';
      if (metrics.errorRate > 30) queueHealth = 'critical';

      const result = {
        averageProcessingTime: metrics.averageProcessingTime,
        throughputPerHour,
        errorRate: metrics.errorRate,
        queueHealth
      };

      console.log('📈 Метрики производительности:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка получения метрик производительности:', error);
      return {
        averageProcessingTime: 0,
        throughputPerHour: 0,
        errorRate: 0,
        queueHealth: 'warning' as const
      };
    }
  }

  /**
   * Обработка успешного завершения задачи (для списания кредитов)
   */
  async onJobCompleted(jobId: string, result: OcrJobResult, processingTimeMs?: number): Promise<void> {
    console.log(`✅ Задача ${jobId} завершена успешно`);
    
    // Записываем метрику времени обработки
    if (processingTimeMs) {
      await metricsCollector.recordProcessingTime(jobId, processingTimeMs);
    }
    
    // Списываем кредиты через новую систему
    const organizationId = result.documentId; // временно используем documentId
    const operationCost = await this.creditsService.getOperationCost('ocr');
    
    const debitResult = await this.creditsService.debitCredits(
      organizationId, 
      operationCost.finalCost, 
      'OCR processing completed'
    );
    
    if (debitResult.success) {
      console.log(`💳 Списано ${operationCost.finalCost} т CO₂ для ${organizationId}`);
    } else {
      console.error(`❌ Ошибка списания кредитов: ${debitResult.error}`);
    }
  }

  /**
   * Обработка ошибки задачи (для записи метрик)
   */
  async onJobFailed(jobId: string, error: string, errorType: string = 'PROCESSING_ERROR'): Promise<void> {
    console.log(`❌ Задача ${jobId} завершилась с ошибкой: ${error}`);
    
    // Записываем метрику ошибки
    await metricsCollector.recordError(jobId, errorType, error);
  }

  /**
   * Получение информации о surge-pricing
   */
  async getSurgePricingInfo(): Promise<{ isSurge: boolean; multiplier: number }> {
    const operationCost = await this.creditsService.getOperationCost('ocr');
    return {
      isSurge: operationCost.surgePricingMultiplier > 1,
      multiplier: operationCost.surgePricingMultiplier
    };
  }

  /**
   * Маппинг состояний pg-boss в наши статусы
   */
  private mapJobState(state: string): 'waiting' | 'active' | 'completed' | 'failed' {
    switch (state) {
      case 'created':
      case 'retry':
        return 'waiting';
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'failed':
      case 'cancelled':
        return 'failed';
      default:
        return 'waiting';
    }
  }

  /**
   * Блокирует кредиты для задачи
   */
  private async blockCreditsForJob(
    organizationId: string, 
    amount: number, 
    reference: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const result = await this.creditsService.debitCredits(
        organizationId,
        amount,
        `Credits blocked for OCR job: ${reference}`
      );
      
      if (result.success) {
        return { 
          success: true, 
          transactionId: result.transactionId 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Unknown error during credits blocking' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during credits blocking' 
      };
    }
  }

  /**
   * Разблокирует кредиты для задачи
   */
  private async unblockCreditsForJob(
    organizationId: string, 
    transactionId: string, 
    reason: string
  ): Promise<void> {
    try {
      // Просто логируем - реальный возврат кредитов будет реализован позже
      await queueLogger.info('Credits unblock requested', {
        organizationId,
        transactionId,
        reason
      });
      
      // TODO: Реализовать логику возврата кредитов после блокировки
      // Это потребует расширения CreditsService новым методом
    } catch (error) {
      await queueLogger.error('Failed to unblock credits', error instanceof Error ? error : new Error(String(error)), {
        organizationId,
        transactionId,
        reason
      });
    }
  }
}

// Singleton instance
let queueManagerInstance: QueueManager | null = null;

/**
 * Получение singleton экземпляра Queue Manager
 */
export async function getQueueManager(): Promise<QueueManager> {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager();
    await queueManagerInstance.initialize();
  }
  return queueManagerInstance;
}

/**
 * Остановка Queue Manager (для graceful shutdown)
 */
export async function stopQueueManager(): Promise<void> {
  if (queueManagerInstance) {
    await queueManagerInstance.stop();
    queueManagerInstance = null;
  }
}