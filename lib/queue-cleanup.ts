/**
 * Cleanup процедуры для PostgreSQL очередей
 * Задача 8.3: Создать таблицы для PostgreSQL очередей
 * Требования: 5.2, 6.3
 */

import { prisma } from './prisma';

export interface CleanupOptions {
  completedJobsOlderThanHours?: number;
  failedJobsOlderThanHours?: number;
  logsOlderThanHours?: number;
  batchSize?: number;
  dryRun?: boolean;
}

export interface CleanupResult {
  deletedJobs: number;
  deletedLogs: number;
  duration: number;
  errors: string[];
}

export class QueueCleanup {
  private static instance: QueueCleanup;

  private constructor() {}

  public static getInstance(): QueueCleanup {
    if (!QueueCleanup.instance) {
      QueueCleanup.instance = new QueueCleanup();
    }
    return QueueCleanup.instance;
  }

  /**
   * Основная процедура очистки старых задач
   */
  async cleanupOldJobs(options: CleanupOptions = {}): Promise<CleanupResult> {
    const startTime = Date.now();
    const {
      completedJobsOlderThanHours = 24 * 7, // 7 дней по умолчанию
      failedJobsOlderThanHours = 24 * 30,   // 30 дней для failed
      logsOlderThanHours = 24 * 3,          // 3 дня для логов
      batchSize = 1000,
      dryRun = false
    } = options;

    console.log('🧹 Начинаем очистку старых задач очереди...');
    console.log(`📊 Параметры: completed=${completedJobsOlderThanHours}h, failed=${failedJobsOlderThanHours}h, logs=${logsOlderThanHours}h`);
    console.log(`📦 Размер батча: ${batchSize}, dry run: ${dryRun}`);

    const result: CleanupResult = {
      deletedJobs: 0,
      deletedLogs: 0,
      duration: 0,
      errors: []
    };

    try {
      // 1. Очистка завершенных задач
      const completedCutoff = new Date(Date.now() - completedJobsOlderThanHours * 60 * 60 * 1000);
      const completedDeleted = await this.cleanupJobsByState(
        'COMPLETED', 
        completedCutoff, 
        batchSize, 
        dryRun
      );
      result.deletedJobs += completedDeleted;

      // 2. Очистка неудачных задач
      const failedCutoff = new Date(Date.now() - failedJobsOlderThanHours * 60 * 60 * 1000);
      const failedDeleted = await this.cleanupJobsByState(
        'FAILED', 
        failedCutoff, 
        batchSize, 
        dryRun
      );
      result.deletedJobs += failedDeleted;

      // 3. Очистка отмененных задач
      const cancelledDeleted = await this.cleanupJobsByState(
        'CANCELLED', 
        completedCutoff, 
        batchSize, 
        dryRun
      );
      result.deletedJobs += cancelledDeleted;

      // 4. Очистка просроченных задач
      const expiredDeleted = await this.cleanupJobsByState(
        'EXPIRED', 
        completedCutoff, 
        batchSize, 
        dryRun
      );
      result.deletedJobs += expiredDeleted;

      // 5. Очистка старых логов
      const logsCutoff = new Date(Date.now() - logsOlderThanHours * 60 * 60 * 1000);
      const logsDeleted = await this.cleanupOldLogs(logsCutoff, batchSize, dryRun);
      result.deletedLogs = logsDeleted;

      // 6. Очистка задач с истекшим keepUntil
      const keepUntilDeleted = await this.cleanupExpiredKeepUntil(batchSize, dryRun);
      result.deletedJobs += keepUntilDeleted;

      result.duration = Date.now() - startTime;

      console.log(`✅ Очистка завершена за ${result.duration}ms`);
      console.log(`📊 Удалено задач: ${result.deletedJobs}, логов: ${result.deletedLogs}`);

      return result;

    } catch (error: any) {
      result.errors.push(error.message);
      result.duration = Date.now() - startTime;
      console.error('❌ Ошибка при очистке:', error.message);
      return result;
    }
  }

  /**
   * Очистка задач по состоянию
   */
  private async cleanupJobsByState(
    state: string, 
    cutoffDate: Date, 
    batchSize: number, 
    dryRun: boolean
  ): Promise<number> {
    console.log(`🔍 Очистка задач в состоянии ${state} старше ${cutoffDate.toISOString()}`);

    try {
      // Сначала подсчитываем количество задач для удаления
      const countResult = await prisma.queueJob.count({
        where: {
          state: state as any,
          completedOn: {
            lt: cutoffDate
          }
        }
      });

      console.log(`📊 Найдено ${countResult} задач ${state} для удаления`);

      if (countResult === 0) {
        return 0;
      }

      if (dryRun) {
        console.log(`🔍 DRY RUN: Было бы удалено ${countResult} задач ${state}`);
        return countResult;
      }

      // Удаляем батчами для избежания блокировок
      let totalDeleted = 0;
      let batchCount = 0;

      while (totalDeleted < countResult) {
        batchCount++;
        console.log(`📦 Обработка батча ${batchCount} для ${state}...`);

        const deleteResult = await prisma.queueJob.deleteMany({
          where: {
            state: state as any,
            completedOn: {
              lt: cutoffDate
            }
          }
        });

        totalDeleted += deleteResult.count;
        console.log(`✅ Батч ${batchCount}: удалено ${deleteResult.count} задач ${state}`);

        // Если удалили меньше чем размер батча, значит закончили
        if (deleteResult.count < batchSize) {
          break;
        }

        // Небольшая пауза между батчами
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Всего удалено задач ${state}: ${totalDeleted}`);
      return totalDeleted;

    } catch (error: any) {
      console.error(`❌ Ошибка очистки задач ${state}:`, error.message);
      throw error;
    }
  }

  /**
   * Очистка старых логов
   */
  private async cleanupOldLogs(cutoffDate: Date, batchSize: number, dryRun: boolean): Promise<number> {
    console.log(`🔍 Очистка логов старше ${cutoffDate.toISOString()}`);

    try {
      const countResult = await prisma.queueJobLog.count({
        where: {
          createdOn: {
            lt: cutoffDate
          }
        }
      });

      console.log(`📊 Найдено ${countResult} логов для удаления`);

      if (countResult === 0) {
        return 0;
      }

      if (dryRun) {
        console.log(`🔍 DRY RUN: Было бы удалено ${countResult} логов`);
        return countResult;
      }

      const deleteResult = await prisma.queueJobLog.deleteMany({
        where: {
          createdOn: {
            lt: cutoffDate
          }
        }
      });

      console.log(`✅ Удалено логов: ${deleteResult.count}`);
      return deleteResult.count;

    } catch (error: any) {
      console.error('❌ Ошибка очистки логов:', error.message);
      throw error;
    }
  }

  /**
   * Очистка задач с истекшим keepUntil
   */
  private async cleanupExpiredKeepUntil(batchSize: number, dryRun: boolean): Promise<number> {
    console.log('🔍 Очистка задач с истекшим keepUntil');

    try {
      const now = new Date();
      const countResult = await prisma.queueJob.count({
        where: {
          keepUntil: {
            lt: now
          }
        }
      });

      console.log(`📊 Найдено ${countResult} задач с истекшим keepUntil`);

      if (countResult === 0) {
        return 0;
      }

      if (dryRun) {
        console.log(`🔍 DRY RUN: Было бы удалено ${countResult} задач с истекшим keepUntil`);
        return countResult;
      }

      const deleteResult = await prisma.queueJob.deleteMany({
        where: {
          keepUntil: {
            lt: now
          }
        }
      });

      console.log(`✅ Удалено задач с истекшим keepUntil: ${deleteResult.count}`);
      return deleteResult.count;

    } catch (error: any) {
      console.error('❌ Ошибка очистки задач с истекшим keepUntil:', error.message);
      throw error;
    }
  }

  /**
   * Получение статистики очереди
   */
  async getQueueStatistics(): Promise<{
    totalJobs: number;
    jobsByState: Record<string, number>;
    totalLogs: number;
    logsByLevel: Record<string, number>;
    oldestJob: Date | null;
    newestJob: Date | null;
  }> {
    console.log('📊 Получение статистики очереди...');

    try {
      // Общее количество задач
      const totalJobs = await prisma.queueJob.count();

      // Задачи по состояниям
      const jobsByStateRaw = await prisma.queueJob.groupBy({
        by: ['state'],
        _count: {
          id: true
        }
      });

      const jobsByState: Record<string, number> = {};
      jobsByStateRaw.forEach(item => {
        jobsByState[item.state] = item._count.id;
      });

      // Общее количество логов
      const totalLogs = await prisma.queueJobLog.count();

      // Логи по уровням
      const logsByLevelRaw = await prisma.queueJobLog.groupBy({
        by: ['level'],
        _count: {
          id: true
        }
      });

      const logsByLevel: Record<string, number> = {};
      logsByLevelRaw.forEach(item => {
        logsByLevel[item.level] = item._count.id;
      });

      // Самая старая и новая задача
      const oldestJob = await prisma.queueJob.findFirst({
        orderBy: { createdOn: 'asc' },
        select: { createdOn: true }
      });

      const newestJob = await prisma.queueJob.findFirst({
        orderBy: { createdOn: 'desc' },
        select: { createdOn: true }
      });

      const stats = {
        totalJobs,
        jobsByState,
        totalLogs,
        logsByLevel,
        oldestJob: oldestJob?.createdOn || null,
        newestJob: newestJob?.createdOn || null
      };

      console.log('📊 Статистика очереди:', stats);
      return stats;

    } catch (error: any) {
      console.error('❌ Ошибка получения статистики:', error.message);
      throw error;
    }
  }

  /**
   * Автоматическая очистка (для cron job)
   */
  async autoCleanup(): Promise<CleanupResult> {
    console.log('🤖 Запуск автоматической очистки...');

    const options: CleanupOptions = {
      completedJobsOlderThanHours: 24 * 7,  // 7 дней для завершенных
      failedJobsOlderThanHours: 24 * 30,    // 30 дней для неудачных
      logsOlderThanHours: 24 * 3,           // 3 дня для логов
      batchSize: 500,                       // Меньший батч для автоматической очистки
      dryRun: false
    };

    return await this.cleanupOldJobs(options);
  }
}

// Экспортируем singleton instance
export const queueCleanup = QueueCleanup.getInstance();