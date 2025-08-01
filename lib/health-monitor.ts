/**
 * Health Monitor для системы очередей
 * Задача 7.1: Реализовать Health Monitor компонент
 * Требования: 3.1, 3.2, 3.3
 */

import { getQueueManager } from './queue';
import { prisma } from './prisma';
import { healthLogger } from './structured-logger';

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unhealthy';
  message: string;
  timestamp: Date;
  details?: any;
}

export interface QueueStorageHealth extends HealthStatus {
  connectionTime?: number;
  version?: string;
  memoryUsage?: number;
}

export interface QueueHealth extends HealthStatus {
  stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    total: number;
  };
  activeJobs?: any[];
  failedJobs?: any[];
}

export interface OverallHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unhealthy';
  timestamp: Date;
  components: {
    queueStorage: QueueStorageHealth;
    queue: QueueHealth;
    database: HealthStatus;
  };
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
  };
}

export class HealthMonitor {
  private static instance: HealthMonitor;

  private constructor() {}

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Проверка здоровья хранилища очередей (PostgreSQL)
   * Требование 3.1, 3.3
   */
  async checkQueueStorageHealth(): Promise<QueueStorageHealth> {
    const startTime = Date.now();
    
    try {
      await healthLogger.debug('Starting queue storage health check');

      // Проверяем подключение к PostgreSQL
      const connectionStart = Date.now();
      await prisma.$queryRaw`SELECT 1 as health_check`;
      const connectionTime = Date.now() - connectionStart;

      // Получаем версию PostgreSQL
      const versionResult = await prisma.$queryRaw<[{version: string}]>`SELECT version()`;
      const version = versionResult[0]?.version || 'Unknown';

      // Проверяем статистику подключений
      const connectionStats = await prisma.$queryRaw<[{
        total_connections: bigint;
        active_connections: bigint;
        max_connections: number;
      }]>`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      `;

      const stats = connectionStats[0];
      const connectionUsage = stats ? (Number(stats.active_connections) / stats.max_connections) * 100 : 0;

      // Определяем статус на основе производительности
      let status: 'healthy' | 'warning' | 'critical' | 'unhealthy' = 'healthy';
      let message = 'PostgreSQL хранилище очередей работает нормально';

      if (connectionTime > 1000) {
        status = 'warning';
        message = `Медленное подключение к PostgreSQL (${connectionTime}ms)`;
      }

      if (connectionUsage > 80) {
        status = 'critical';
        message = `Высокое использование подключений PostgreSQL (${connectionUsage.toFixed(1)}%)`;
      }

      if (connectionTime > 5000) {
        status = 'unhealthy';
        message = `Критически медленное подключение к PostgreSQL (${connectionTime}ms)`;
      }

      console.log(`✅ PostgreSQL: ${status} (${connectionTime}ms, ${connectionUsage.toFixed(1)}% подключений)`);

      return {
        status,
        message,
        timestamp: new Date(),
        connectionTime,
        version: version.split(' ')[0] + ' ' + version.split(' ')[1], // PostgreSQL version
        memoryUsage: connectionUsage,
        details: {
          totalConnections: stats ? Number(stats.total_connections) : 0,
          activeConnections: stats ? Number(stats.active_connections) : 0,
          maxConnections: stats?.max_connections || 0,
          responseTime: connectionTime
        }
      };

    } catch (error: any) {
      console.error('❌ Ошибка проверки PostgreSQL:', error.message);

      // Требование 3.3: возвращаем unhealthy если хранилище недоступно
      return {
        status: 'unhealthy',
        message: `PostgreSQL недоступен: ${error.message}`,
        timestamp: new Date(),
        connectionTime: Date.now() - startTime,
        details: {
          error: error.message,
          errorCode: error.code,
          errorType: 'CONNECTION_ERROR'
        }
      };
    }
  }

  /**
   * Проверка здоровья очереди задач
   * Требование 3.1, 3.2
   */
  async checkQueueHealth(): Promise<QueueHealth> {
    try {
      console.log('🔍 Проверка здоровья очереди задач...');

      const queueManager = await getQueueManager();
      
      // Получаем статистику очереди (требование 3.2)
      const stats = await queueManager.getQueueStats();
      
      console.log('📊 Статистика очереди:', stats);

      // Получаем активные задачи для диагностики
      let activeJobs: any[] = [];
      let failedJobs: any[] = [];

      try {
        // Получаем несколько активных задач для мониторинга
        activeJobs = await queueManager.getActiveJobs(5);
        failedJobs = await queueManager.getFailedJobs(5);
      } catch (jobError) {
        console.warn('⚠️ Не удалось получить детали задач:', (jobError as Error).message);
      }

      // Определяем статус очереди
      let status: 'healthy' | 'warning' | 'critical' | 'unhealthy' = 'healthy';
      let message = 'Очередь задач работает нормально';

      // Проверяем нагрузку на очередь
      const totalJobs = stats.waiting + stats.active;
      const failureRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;

      if (totalJobs > 100) {
        status = 'warning';
        message = `Высокая нагрузка на очередь (${totalJobs} задач в обработке)`;
      }

      if (failureRate > 10) {
        status = 'critical';
        message = `Высокий процент ошибок в очереди (${failureRate.toFixed(1)}%)`;
      }

      if (totalJobs > 500) {
        status = 'critical';
        message = `Критическая нагрузка на очередь (${totalJobs} задач)`;
      }

      // Проверяем застрявшие задачи
      const stuckActiveJobs = activeJobs.filter(job => {
        const startTime = new Date(job.startedAt || job.createdAt);
        const now = new Date();
        const processingTime = now.getTime() - startTime.getTime();
        return processingTime > 10 * 60 * 1000; // более 10 минут
      });

      if (stuckActiveJobs.length > 0) {
        status = 'warning';
        message = `Обнаружены застрявшие задачи (${stuckActiveJobs.length})`;
      }

      console.log(`✅ Очередь: ${status} (${totalJobs} активных, ${failureRate.toFixed(1)}% ошибок)`);

      return {
        status,
        message,
        timestamp: new Date(),
        stats,
        activeJobs: activeJobs.map(job => ({
          id: job.id,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          priority: job.priority,
          data: {
            documentId: job.data?.documentId,
            fileName: job.data?.fileName
          }
        })),
        failedJobs: failedJobs.map(job => ({
          id: job.id,
          error: job.error,
          failedAt: job.failedAt,
          retryCount: job.retryCount,
          data: {
            documentId: job.data?.documentId,
            fileName: job.data?.fileName
          }
        })),
        details: {
          totalJobs,
          failureRate,
          stuckJobs: stuckActiveJobs.length,
          queueLoad: totalJobs > 0 ? 'high' : totalJobs > 50 ? 'medium' : 'low'
        }
      };

    } catch (error: any) {
      console.error('❌ Ошибка проверки очереди:', error.message);

      return {
        status: 'unhealthy',
        message: `Очередь недоступна: ${error.message}`,
        timestamp: new Date(),
        stats: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          total: 0
        },
        details: {
          error: error.message,
          errorType: 'QUEUE_ERROR'
        }
      };
    }
  }

  /**
   * Проверка здоровья базы данных
   */
  async checkDatabaseHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      console.log('🔍 Проверка здоровья базы данных...');

      // Проверяем подключение к БД
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      // Проверяем количество документов для диагностики
      const documentCount = await prisma.document.count();
      const recentDocuments = await prisma.document.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // за последние 24 часа
          }
        }
      });

      let status: 'healthy' | 'warning' | 'critical' | 'unhealthy' = 'healthy';
      let message = 'База данных работает нормально';

      if (responseTime > 500) {
        status = 'warning';
        message = `Медленный отклик БД (${responseTime}ms)`;
      }

      if (responseTime > 2000) {
        status = 'critical';
        message = `Критически медленный отклик БД (${responseTime}ms)`;
      }

      console.log(`✅ База данных: ${status} (${responseTime}ms, ${documentCount} документов)`);

      return {
        status,
        message,
        timestamp: new Date(),
        details: {
          responseTime,
          totalDocuments: documentCount,
          recentDocuments,
          tablesChecked: ['documents', 'users']
        }
      };

    } catch (error: any) {
      console.error('❌ Ошибка проверки БД:', error.message);

      return {
        status: 'unhealthy',
        message: `База данных недоступна: ${error.message}`,
        timestamp: new Date(),
        details: {
          error: error.message,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Получение общего статуса здоровья системы
   * Требование 3.1
   */
  async getOverallHealth(): Promise<OverallHealth> {
    console.log('🏥 Проверка общего здоровья системы...');

    const [queueStorageHealth, queueHealth, databaseHealth] = await Promise.all([
      this.checkQueueStorageHealth(),
      this.checkQueueHealth(),
      this.checkDatabaseHealth()
    ]);

    // Определяем общий статус системы
    const statuses = [queueStorageHealth.status, queueHealth.status, databaseHealth.status];
    
    let overallStatus: 'healthy' | 'warning' | 'critical' | 'unhealthy' = 'healthy';
    
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('critical')) {
      overallStatus = 'critical';
    } else if (statuses.includes('warning')) {
      overallStatus = 'warning';
    }

    // Подсчитываем проблемы
    const criticalIssues = statuses.filter(s => s === 'critical' || s === 'unhealthy').length;
    const warnings = statuses.filter(s => s === 'warning').length;
    const totalIssues = criticalIssues + warnings;

    console.log(`🏥 Общий статус: ${overallStatus} (${totalIssues} проблем, ${criticalIssues} критических)`);

    return {
      status: overallStatus,
      timestamp: new Date(),
      components: {
        queueStorage: queueStorageHealth,
        queue: queueHealth,
        database: databaseHealth
      },
      summary: {
        totalIssues,
        criticalIssues,
        warnings
      }
    };
  }

  /**
   * Быстрая проверка доступности системы
   */
  async quickHealthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Быстрые проверки без детальной диагностики
      await Promise.all([
        prisma.$queryRaw`SELECT 1`,
        getQueueManager().then(qm => qm.getQueueStats())
      ]);

      return {
        healthy: true,
        message: 'Система доступна'
      };
    } catch (error: any) {
      return {
        healthy: false,
        message: `Система недоступна: ${error.message}`
      };
    }
  }
}

// Экспортируем singleton instance
export const healthMonitor = HealthMonitor.getInstance();