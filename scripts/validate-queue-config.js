/**
 * Скрипт для проверки конфигурации очередей
 */

require('dotenv').config();

function validateQueueConfig() {
  console.log('🔧 Проверка конфигурации PostgreSQL очередей...');
  console.log('📋 Тип хранилища: PostgreSQL (pg-boss)');
  
  const databaseUrl = process.env.QUEUE_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('QUEUE_DATABASE_URL or DATABASE_URL is required for PostgreSQL queues');
  }
  console.log('✅ PostgreSQL URL настроен');
  
  // Проверка других параметров
  const concurrency = parseInt(process.env.BULLMQ_CONCURRENCY || '5');
  const maxJobs = parseInt(process.env.BULLMQ_MAX_JOBS || '1000');
  const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW || '90000');
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10');
  
  console.log('⚙️ Параметры pg-boss:');
  console.log('  - Concurrency:', concurrency);
  console.log('  - Max Jobs:', maxJobs);
  console.log('  - Rate Limit:', `${rateLimitMax} requests per ${rateLimitWindow/1000}s`);
  
  console.log('✅ Конфигурация очередей валидна!');
}

try {
  validateQueueConfig();
} catch (error) {
  console.error('❌ Ошибка конфигурации:', error.message);
  process.exit(1);
}