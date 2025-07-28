/**
 * Конфигурация системы очередей PostgreSQL
 * Использует pg-boss для работы с PostgreSQL очередями
 */

export interface QueueConfig {
  connectionString: string;
  schema?: string;
  defaultJobOptions: {
    retryLimit: number;
    retryDelay: number;
    retryBackoff: boolean;
    expireInHours: number;
  };
  concurrency: number;
  maxJobs: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface HealthConfig {
  checkInterval: number;
  metricsRetentionDays: number;
}

/**
 * Получение конфигурации очередей из переменных окружения
 */
export function getQueueConfig(): QueueConfig {
  const databaseUrl = process.env.QUEUE_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('QUEUE_DATABASE_URL or DATABASE_URL is required for PostgreSQL queues');
  }

  return {
    connectionString: databaseUrl,
    schema: process.env.QUEUE_TABLE_PREFIX || 'pgboss',
    defaultJobOptions: {
      retryLimit: 3,
      retryDelay: 2000,
      retryBackoff: true,
      expireInHours: parseInt(process.env.BULLMQ_JOB_TTL || '3600000') / (1000 * 60 * 60) // конвертируем в часы
    },
    concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '5'),
    maxJobs: parseInt(process.env.BULLMQ_MAX_JOBS || '1000')
  };
}

/**
 * Получение конфигурации rate limiting
 */
export function getRateLimitConfig(): RateLimitConfig {
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '90000'), // 90 секунд
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10')
  };
}

/**
 * Получение конфигурации мониторинга
 */
export function getHealthConfig(): HealthConfig {
  return {
    checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 секунд
    metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '7')
  };
}

/**
 * Валидация конфигурации при запуске
 */
export function validateQueueConfig(): void {
  try {
    const config = getQueueConfig();
    const rateLimitConfig = getRateLimitConfig();
    const healthConfig = getHealthConfig();

    console.log('✅ PostgreSQL Queue configuration validated:', {
      schema: config.schema,
      concurrency: config.concurrency,
      maxJobs: config.maxJobs,
      retryLimit: config.defaultJobOptions.retryLimit,
      rateLimitWindow: rateLimitConfig.windowMs,
      rateLimitMax: rateLimitConfig.maxRequests
    });
  } catch (error) {
    console.error('❌ Queue configuration validation failed:', error);
    throw error;
  }
}