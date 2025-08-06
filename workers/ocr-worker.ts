/**
 * OCR Worker - обработчик задач OCR из очереди pg-boss
 * Интегрирует существующую логику OCR с системой очередей и монетизацией кредитов
 * Задача 2.1: Обновить OCR Worker для списания кредитов
 */

const PgBoss = require('pg-boss');
import { createPgBoss, QUEUE_NAMES, OcrJobData, OcrJobResult } from '../lib/pg-boss-config';
import { processS3File } from '../lib/ocr';
import { CreditsService, creditsService } from '../lib/credits-service';
import { prisma } from '../lib/prisma';
import { metricsCollector } from '../lib/metrics';
import { workerLogger } from '../lib/structured-logger';

export interface WorkerConfig {
  concurrency: number;
  pollInterval: number;
  maxRetries: number;
}

export interface JobProgress {
  stage: 'starting' | 'downloading' | 'processing' | 'saving' | 'completed';
  progress: number;
  message: string;
}

/**
 * OCR Worker класс для обработки задач из очереди
 */
export class OcrWorker {
  private boss: any = null;
  private isRunning: boolean = false;
  private config: WorkerConfig;
  private creditsService: CreditsService;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      concurrency: config.concurrency || parseInt(process.env.BULLMQ_CONCURRENCY || '5'),
      pollInterval: config.pollInterval || 5000, // 5 секунд
      maxRetries: config.maxRetries || 3
    };
    
    this.creditsService = creditsService;
    
    console.log('🔧 OCR Worker инициализирован с конфигурацией:', this.config);
  }

  /**
   * Запуск worker процесса
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      await workerLogger.warn('OCR Worker already running');
      return;
    }

    try {
      await workerLogger.info('Starting OCR Worker...');
      
      // Создаем подключение к pg-boss
      this.boss = await createPgBoss();
      
      // Настраиваем обработчик задач OCR
      await this.boss.work(
        QUEUE_NAMES.OCR,
        { teamSize: this.config.concurrency },
        this.processOcrJob.bind(this)
      );

      this.isRunning = true;
      await workerLogger.workerStarted('ocr-worker', QUEUE_NAMES.OCR);
      await workerLogger.info('OCR Worker started successfully', { 
        concurrency: this.config.concurrency,
        queueName: QUEUE_NAMES.OCR
      });
      
      // Настраиваем graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      await workerLogger.error('Failed to start OCR Worker', 
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Остановка worker процесса
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      await workerLogger.warn('OCR Worker already stopped');
      return;
    }

    try {
      await workerLogger.info('Stopping OCR Worker...');
      
      this.isRunning = false;
      
      if (this.boss) {
        await this.boss.stop();
        this.boss = null;
      }
      
      await workerLogger.workerStopped('ocr-worker', QUEUE_NAMES.OCR, 'Manual stop');
    } catch (error) {
      await workerLogger.error('Failed to stop OCR Worker', 
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Основная функция обработки OCR задачи
   */
  private async processOcrJob(job: any): Promise<OcrJobResult> {
    const jobData: OcrJobData = job.data;
    const jobId = job.id;
    const startTime = Date.now();
    
    await workerLogger.jobStarted(jobId, 'OCR', {
      documentId: jobData.documentId,
      fileKey: jobData.fileKey,
      fileName: jobData.fileName,
      fileSize: jobData.fileSize,
      userId: jobData.userId,
      organizationId: jobData.organizationId
    });

    try {
      const organizationId = jobData.organizationId || jobData.userId;
      
      // Этап 1: Расчет стоимости операции OCR
      await this.updateProgress(job, {
        stage: 'starting',
        progress: 5,
        message: 'Расчет стоимости операции OCR'
      });

      const operationCost = await this.creditsService.getOperationCost('ocr');
      const requiredCredits = operationCost.finalCost;

      // Этап 2: Проверка баланса кредитов
      await this.updateProgress(job, {
        stage: 'starting',
        progress: 10,
        message: 'Проверка баланса кредитов'
      });

      const hasCredits = await this.creditsService.hasCredits(organizationId, requiredCredits);
      
      if (!hasCredits) {
        const balance = await this.creditsService.checkBalance(organizationId);
        throw new Error(
          `INSUFFICIENT_CREDITS: Недостаточно кредитов для обработки. ` +
          `Требуется: ${requiredCredits} т CO₂, доступно: ${balance.balance} т CO₂`
        );
      }

      // Этап 3: Загрузка файла
      await this.updateProgress(job, {
        stage: 'downloading',
        progress: 30,
        message: 'Загрузка файла из хранилища'
      });

      // Этап 4: OCR обработка
      await this.updateProgress(job, {
        stage: 'processing',
        progress: 50,
        message: 'Распознавание текста'
      });

      const ocrText = await processS3File(jobData.fileKey);
      
      if (!ocrText || ocrText.length < 10) {
        throw new Error('OCR_FAILED: Не удалось извлечь текст из документа');
      }

      // Этап 5: Сохранение результатов
      await this.updateProgress(job, {
        stage: 'saving',
        progress: 70,
        message: 'Сохранение результатов'
      });

      await this.saveOcrResults(jobData.documentId, ocrText);

      // Этап 6: Списание кредитов за успешную обработку
      await this.updateProgress(job, {
        stage: 'saving',
        progress: 90,
        message: 'Списание кредитов за обработку'
      });

      const debitResult = await this.creditsService.debitCredits(
        organizationId, 
        requiredCredits, 
        `OCR обработка документа: ${jobData.fileName} (${jobData.documentId})`,
        {
          documentId: jobData.documentId,
          fileName: jobData.fileName,
          fileSize: jobData.fileSize,
          operationType: 'ocr',
          textLength: ocrText.length
        }
      );

      if (!debitResult.success) {
        // Если списание не удалось, откатываем операцию
        await this.rollbackOcrResults(jobData.documentId);
        throw new Error(`DEBIT_FAILED: ${debitResult.error}`);
      }

      // Завершение
      await this.updateProgress(job, {
        stage: 'completed',
        progress: 100,
        message: 'Обработка завершена успешно'
      });

      const result: OcrJobResult = {
        documentId: jobData.documentId,
        text: ocrText,
        textLength: ocrText.length,
        confidence: 0.95, // Примерная точность
        processedAt: new Date().toISOString()
      };

      // Записываем метрики производительности
      const processingTime = Date.now() - startTime;
      await metricsCollector.recordProcessingTime(jobId, processingTime);

      console.log(`✅ OCR задача ${jobId} завершена успешно:`, {
        documentId: result.documentId,
        textLength: result.textLength,
        creditsDebited: requiredCredits,
        newBalance: debitResult.newBalance,
        processingTime: `${processingTime}ms`
      });

      return result;

    } catch (error: any) {
      console.error(`❌ Ошибка обработки OCR задачи ${jobId}:`, error.message);
      
      // Записываем метрику ошибки
      const processingTime = Date.now() - startTime;
      await metricsCollector.recordError(jobId, error.name || 'UNKNOWN_ERROR', error.message);
      
      // Обновляем статус документа на ошибку
      await this.handleJobError(jobData.documentId, error);
      
      throw error;
    }
  }

  /**
   * Обновление прогресса выполнения задачи
   */
  private async updateProgress(job: any, progress: JobProgress): Promise<void> {
    try {
      console.log(`📊 ${job.id} [${progress.progress}%] ${progress.stage}: ${progress.message}`);
      
      // Обновляем прогресс в pg-boss (если поддерживается)
      if (this.boss && typeof this.boss.publish === 'function') {
        await this.boss.publish('job-progress', {
          jobId: job.id,
          ...progress
        });
      }
      
    } catch (error) {
      console.error('⚠️ Ошибка обновления прогресса:', error);
      // Не прерываем выполнение задачи из-за ошибки прогресса
    }
  }

  /**
   * Сохранение результатов OCR в базу данных
   */
  private async saveOcrResults(documentId: string, ocrText: string): Promise<void> {
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PROCESSED',
          ocrProcessed: true,
          ocrData: {
            fullText: ocrText,
            textPreview: ocrText.substring(0, 200),
            textLength: ocrText.length,
            processedAt: new Date().toISOString()
          },
          ocrConfidence: 0.95
        }
      });
      
      console.log(`💾 OCR результаты сохранены для документа ${documentId}`);
    } catch (error) {
      console.error(`❌ Ошибка сохранения OCR результатов для ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Откат результатов OCR при ошибке списания кредитов
   */
  private async rollbackOcrResults(documentId: string): Promise<void> {
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PROCESSING', // Возвращаем в состояние обработки
          ocrProcessed: false,
          ocrData: undefined,
          ocrConfidence: null,
          processingCompletedAt: null
        }
      });
      
      console.log(`🔄 Откат результатов OCR для документа: ${documentId}`);
    } catch (error) {
      console.error(`❌ Ошибка отката OCR результатов для ${documentId}:`, error);
      // Не прерываем выполнение - это не критическая ошибка
    }
  }

  /**
   * Обработка ошибок задачи
   */
  private async handleJobError(documentId: string, error: Error): Promise<void> {
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          ocrData: {
            error: error.message,
            processedAt: new Date().toISOString()
          }
        }
      });
      
      await workerLogger.info('OCR error saved to database', {
        documentId,
        errorMessage: error.message
      });
    } catch (saveError) {
      await workerLogger.error('Failed to save OCR error to database', 
        saveError instanceof Error ? saveError : new Error(String(saveError)), 
        { documentId, originalError: error.message }
      );
    }
  }

  /**
   * Настройка graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      await workerLogger.info(`Received shutdown signal: ${signal}`, { signal });
      await workerLogger.workerStopped('ocr-worker', QUEUE_NAMES.OCR, `Signal: ${signal}`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Получение статистики worker'а
   */
  async getWorkerStats(): Promise<{
    isRunning: boolean;
    config: WorkerConfig;
    queueSize?: number;
  }> {
    const stats = {
      isRunning: this.isRunning,
      config: this.config,
      queueSize: undefined as number | undefined
    };

    if (this.boss) {
      try {
        stats.queueSize = await this.boss.getQueueSize(QUEUE_NAMES.OCR);
      } catch (error) {
        console.error('⚠️ Ошибка получения размера очереди:', error);
      }
    }

    return stats;
  }
}

/**
 * Singleton instance для использования в приложении
 */
let workerInstance: OcrWorker | null = null;

/**
 * Получение singleton экземпляра OCR Worker
 */
export function getOcrWorker(config?: Partial<WorkerConfig>): OcrWorker {
  if (!workerInstance) {
    workerInstance = new OcrWorker(config);
  }
  return workerInstance;
}

/**
 * Запуск OCR Worker (для использования в отдельном процессе)
 */
export async function startOcrWorker(config?: Partial<WorkerConfig>): Promise<OcrWorker> {
  const worker = getOcrWorker(config);
  await worker.start();
  return worker;
}

/**
 * Остановка OCR Worker
 */
export async function stopOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.stop();
    workerInstance = null;
  }
}