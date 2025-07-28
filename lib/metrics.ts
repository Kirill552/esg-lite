import { prisma } from './prisma'
import { yandexMonitoring } from './yandex-monitoring'

export interface QueueMetrics {
  // Производительность
  averageProcessingTime: number
  throughputPerMinute: number
  
  // Ошибки
  errorRate: number
  failedJobsCount: number
  
  // Ресурсы
  activeWorkersCount: number
  
  // Очереди
  queueSizes: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
  
  // Временные метки
  timestamp: Date
  periodStart: Date
  periodEnd: Date
}

export interface MetricEntry {
  id: string
  metric_type: string
  metric_value: number
  metadata?: Record<string, any>
  timestamp: Date
  expires_at: Date
}

export class MetricsCollector {
  private readonly TTL_HOURS = 24 * 7 // 7 дней
  
  constructor() {}

  /**
   * Записать метрику производительности
   */
  async recordProcessingTime(jobId: string, processingTimeMs: number): Promise<void> {
    const expiresAt = new Date(Date.now() + this.TTL_HOURS * 60 * 60 * 1000)
    
    try {
      // Сохраняем в PostgreSQL с TTL
      await prisma.$executeRaw`
        INSERT INTO queue_metrics (id, metric_type, metric_value, metadata, timestamp, expires_at)
        VALUES (${jobId + '_processing_time'}, 'processing_time', ${processingTimeMs}, 
                ${JSON.stringify({ jobId })}, NOW(), ${expiresAt})
        ON CONFLICT (id) DO UPDATE SET 
          metric_value = ${processingTimeMs},
          timestamp = NOW(),
          expires_at = ${expiresAt}
      `
    } catch (error) {
      console.error('Failed to record processing time metric:', error)
    }
  }

  /**
   * Записать метрику throughput
   */
  async recordThroughput(jobsCompleted: number, timeWindowMinutes: number = 1): Promise<void> {
    const throughputPerMinute = jobsCompleted / timeWindowMinutes
    const expiresAt = new Date(Date.now() + this.TTL_HOURS * 60 * 60 * 1000)
    const id = `throughput_${Date.now()}`
    
    try {
      await prisma.$executeRaw`
        INSERT INTO queue_metrics (id, metric_type, metric_value, metadata, timestamp, expires_at)
        VALUES (${id}, 'throughput', ${throughputPerMinute}, 
                ${JSON.stringify({ jobsCompleted, timeWindowMinutes })}, NOW(), ${expiresAt})
      `
    } catch (error) {
      console.error('Failed to record throughput metric:', error)
    }
  }

  /**
   * Записать метрику ошибки
   */
  async recordError(jobId: string, errorType: string, errorMessage: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.TTL_HOURS * 60 * 60 * 1000)
    const id = `error_${jobId}_${Date.now()}`
    
    try {
      await prisma.$executeRaw`
        INSERT INTO queue_metrics (id, metric_type, metric_value, metadata, timestamp, expires_at)
        VALUES (${id}, 'error', 1, 
                ${JSON.stringify({ jobId, errorType, errorMessage })}, NOW(), ${expiresAt})
      `
    } catch (error) {
      console.error('Failed to record error metric:', error)
    }
  }

  /**
   * Получить метрики производительности за период
   */
  async getPerformanceMetrics(periodHours: number = 24): Promise<QueueMetrics> {
    const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000)
    const periodEnd = new Date()

    try {
      // Получаем среднее время обработки
      const avgProcessingTime = await prisma.$queryRaw<Array<{ avg: number }>>`
        SELECT AVG(metric_value) as avg
        FROM queue_metrics 
        WHERE metric_type = 'processing_time' 
        AND timestamp >= ${periodStart}
        AND timestamp <= ${periodEnd}
      `

      // Получаем throughput
      const throughputData = await prisma.$queryRaw<Array<{ avg: number }>>`
        SELECT AVG(metric_value) as avg
        FROM queue_metrics 
        WHERE metric_type = 'throughput' 
        AND timestamp >= ${periodStart}
        AND timestamp <= ${periodEnd}
      `

      // Получаем количество ошибок
      const errorCount = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM queue_metrics 
        WHERE metric_type = 'error' 
        AND timestamp >= ${periodStart}
        AND timestamp <= ${periodEnd}
      `

      // Получаем общее количество задач
      const totalJobs = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM queue_metrics 
        WHERE metric_type IN ('processing_time', 'error') 
        AND timestamp >= ${periodStart}
        AND timestamp <= ${periodEnd}
      `

      // Получаем статистику очередей из pg-boss
      const queueStats = await this.getQueueSizes()

      const totalJobsCount = Number(totalJobs[0]?.count || 0)
      const errorJobsCount = Number(errorCount[0]?.count || 0)
      const errorRate = totalJobsCount > 0 ? (errorJobsCount / totalJobsCount) * 100 : 0

      return {
        averageProcessingTime: Number(avgProcessingTime[0]?.avg || 0),
        throughputPerMinute: Number(throughputData[0]?.avg || 0),
        errorRate,
        failedJobsCount: errorJobsCount,
        activeWorkersCount: await this.getActiveWorkersCount(),
        queueSizes: queueStats,
        timestamp: new Date(),
        periodStart,
        periodEnd
      }
    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      
      // Возвращаем базовые метрики при ошибке
      return {
        averageProcessingTime: 0,
        throughputPerMinute: 0,
        errorRate: 0,
        failedJobsCount: 0,
        activeWorkersCount: 0,
        queueSizes: await this.getQueueSizes(),
        timestamp: new Date(),
        periodStart,
        periodEnd
      }
    }
  }

  /**
   * Получить размеры очередей из pg-boss
   */
  private async getQueueSizes(): Promise<QueueMetrics['queueSizes']> {
    try {
      // Получаем статистику из pg-boss таблиц
      const stats = await prisma.$queryRaw<Array<{
        state: string
        count: number
      }>>`
        SELECT state, COUNT(*) as count
        FROM pgboss.job 
        WHERE name = 'ocr-processing'
        GROUP BY state
      `

      const queueSizes = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
      }

      stats.forEach(stat => {
        switch (stat.state) {
          case 'created':
          case 'retry':
            queueSizes.waiting += Number(stat.count)
            break
          case 'active':
            queueSizes.active += Number(stat.count)
            break
          case 'completed':
            queueSizes.completed += Number(stat.count)
            break
          case 'failed':
            queueSizes.failed += Number(stat.count)
            break
        }
      })

      return queueSizes
    } catch (error) {
      console.error('Failed to get queue sizes:', error)
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
      }
    }
  }

  /**
   * Получить количество активных воркеров
   */
  private async getActiveWorkersCount(): Promise<number> {
    try {
      // Проверяем активные воркеры через pg-boss
      const activeWorkers = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT data->>'workerId') as count
        FROM pgboss.job 
        WHERE state = 'active' 
        AND name = 'ocr-processing'
        AND data->>'workerId' IS NOT NULL
      `

      return Number(activeWorkers[0]?.count || 0)
    } catch (error) {
      console.error('Failed to get active workers count:', error)
      return 0
    }
  }

  /**
   * Очистить устаревшие метрики
   */
  async cleanupExpiredMetrics(): Promise<void> {
    try {
      const result = await prisma.$executeRaw`
        DELETE FROM queue_metrics 
        WHERE expires_at < NOW()
      `
      
      console.log(`Cleaned up ${result} expired metrics`)
    } catch (error) {
      console.error('Failed to cleanup expired metrics:', error)
    }
  }

  /**
   * Получить метрики по типу за период
   */
  async getMetricsByType(
    metricType: string, 
    periodHours: number = 24,
    limit: number = 100
  ): Promise<MetricEntry[]> {
    const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000)
    
    try {
      const metrics = await prisma.$queryRaw<MetricEntry[]>`
        SELECT id, metric_type, metric_value, metadata, timestamp, expires_at
        FROM queue_metrics 
        WHERE metric_type = ${metricType}
        AND timestamp >= ${periodStart}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `

      return metrics
    } catch (error) {
      console.error(`Failed to get metrics by type ${metricType}:`, error)
      return []
    }
  }

  /**
   * Записать кастомную метрику
   */
  async recordCustomMetric(
    metricType: string, 
    value: number, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.TTL_HOURS * 60 * 60 * 1000)
    const id = `${metricType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      await prisma.$executeRaw`
        INSERT INTO queue_metrics (id, metric_type, metric_value, metadata, timestamp, expires_at)
        VALUES (${id}, ${metricType}, ${value}, ${JSON.stringify(metadata || {})}, NOW(), ${expiresAt})
      `
    } catch (error) {
      console.error(`Failed to record custom metric ${metricType}:`, error)
    }
  }

  /**
   * Отправка текущих метрик в Yandex Cloud Monitoring
   */
  async sendToYandexCloud(): Promise<void> {
    if (!yandexMonitoring.isEnabled()) {
      return;
    }

    try {
      const metrics = await this.getPerformanceMetrics(1); // Получаем метрики за последний час
      const now = new Date();

      const yandexMetrics = [
        // PostgreSQL Queue метрики
        { 
          name: 'queue_jobs_waiting', 
          value: metrics.queueSizes.waiting, 
          labels: { 'queue': 'ocr', 'storage': 'postgresql' } as Record<string, string>
        },
        { 
          name: 'queue_jobs_active', 
          value: metrics.queueSizes.active, 
          labels: { 'queue': 'ocr', 'storage': 'postgresql' } as Record<string, string>
        },
        { 
          name: 'queue_jobs_completed', 
          value: metrics.queueSizes.completed, 
          labels: { 'queue': 'ocr', 'storage': 'postgresql' } as Record<string, string>
        },
        { 
          name: 'queue_jobs_failed', 
          value: metrics.queueSizes.failed, 
          labels: { 'queue': 'ocr', 'storage': 'postgresql' } as Record<string, string>
        },
        
        // Производительность
        { 
          name: 'ocr_processing_time_avg', 
          value: metrics.averageProcessingTime,
          labels: { 'unit': 'milliseconds' } as Record<string, string>
        },
        { 
          name: 'ocr_throughput_per_minute', 
          value: metrics.throughputPerMinute,
          labels: { 'unit': 'jobs_per_minute' } as Record<string, string>
        },
        { 
          name: 'ocr_error_rate', 
          value: metrics.errorRate,
          labels: { 'unit': 'percentage' } as Record<string, string>
        },
        
        // Система
        { 
          name: 'ocr_workers_active', 
          value: metrics.activeWorkersCount,
          labels: { 'unit': 'count' } as Record<string, string>
        },
        
        // Общие статистики
        { 
          name: 'ocr_failed_jobs_total', 
          value: metrics.failedJobsCount,
          labels: { 'unit': 'count' } as Record<string, string>
        }
      ];

      await yandexMonitoring.writeMetricsWithRetry(yandexMetrics);
      
      console.log(`📊 Отправлено ${yandexMetrics.length} метрик в Yandex Cloud Monitoring`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Ошибка отправки метрик в Yandex Cloud:', errorMessage);
    }
  }

  /**
   * Отправка специфичных метрик PostgreSQL очередей
   */
  async sendPostgreSQLMetrics(): Promise<void> {
    if (!yandexMonitoring.isEnabled()) {
      return;
    }

    try {
      // Получаем дополнительные метрики PostgreSQL
      const pgStats = await this.getPostgreSQLSpecificMetrics();
      
      const pgMetrics = [
        { 
          name: 'pg_queue_connection_count', 
          value: pgStats.connectionCount,
          labels: { 'database': 'esg_lite_mvp' } as Record<string, string>
        },
        { 
          name: 'pg_queue_table_size', 
          value: pgStats.queueTableSize,
          labels: { 'table': 'pgboss_job', 'unit': 'bytes' } as Record<string, string>
        },
        { 
          name: 'pg_slow_queries_count', 
          value: pgStats.slowQueriesCount,
          labels: { 'threshold': '1000ms' } as Record<string, string>
        }
      ];

      await yandexMonitoring.writeMetricsWithRetry(pgMetrics);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Ошибка отправки PostgreSQL метрик:', errorMessage);
    }
  }

  /**
   * Получение специфичных метрик PostgreSQL
   */
  private async getPostgreSQLSpecificMetrics(): Promise<{
    connectionCount: number;
    queueTableSize: number;
    slowQueriesCount: number;
  }> {
    try {
      // Количество активных соединений
      const connections = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;

      // Размер таблицы очередей (если существует)
      const tableSize = await prisma.$queryRaw<Array<{ size: number }>>`
        SELECT pg_total_relation_size('pgboss_job'::regclass) as size
      `.catch(() => [{ size: 0 }]); // Если таблица не существует

      // Количество медленных запросов (примерная реализация)
      const slowQueries = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM pg_stat_statements 
        WHERE mean_exec_time > 1000 AND calls > 0
      `.catch(() => [{ count: 0 }]); // Если pg_stat_statements не включен

      return {
        connectionCount: Number(connections[0]?.count || 0),
        queueTableSize: Number(tableSize[0]?.size || 0),
        slowQueriesCount: Number(slowQueries[0]?.count || 0)
      };
    } catch (error) {
      console.warn('⚠️ Не удалось получить PostgreSQL метрики:', error);
      return {
        connectionCount: 0,
        queueTableSize: 0,
        slowQueriesCount: 0
      };
    }
  }
}

// Экспортируем singleton instance
export const metricsCollector = new MetricsCollector()

// Автоматическая отправка метрик в Yandex Cloud Monitoring
if (process.env.YANDEX_MONITORING_ENABLED === 'true' && process.env.YANDEX_CLOUD_FOLDER_ID) {
  console.log('🚀 Запуск автоматической отправки метрик в Yandex Cloud Monitoring...');
  
  // Отправляем метрики каждые 5 минут
  setInterval(async () => {
    try {
      await metricsCollector.sendToYandexCloud();
      
      // Также отправляем PostgreSQL-специфичные метрики каждые 10 минут
      const now = new Date();
      if (now.getMinutes() % 10 === 0) {
        await metricsCollector.sendPostgreSQLMetrics();
      }
    } catch (error) {
      console.error('❌ Ошибка автоматической отправки метрик:', error);
    }
  }, 5 * 60 * 1000); // 5 минут

  console.log('✅ Автоматическая отправка метрик настроена (интервал: 5 минут)');
}