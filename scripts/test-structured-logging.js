/**
 * Тест системы структурированного логирования
 * Проверяет работу логгеров и ротацию файлов
 */

// Загружаем переменные из .env файла
require('dotenv').config();

const { queueLogger, workerLogger, healthLogger, apiLogger } = require('../lib/structured-logger.js');

async function testStructuredLogging() {
  console.log('🧪 Тестирование структурированного логирования...\n');

  try {
    // 1. Тест базового логирования
    console.log('1️⃣ Тест базового логирования...');
    
    await queueLogger.debug('Debug message from queue', { test: true });
    await queueLogger.info('Info message from queue', { data: { key: 'value' }});
    await queueLogger.warn('Warning message from queue');
    await queueLogger.error('Error message from queue', new Error('Test error'));

    // 2. Тест логирования с контекстом
    console.log('\n2️⃣ Тест логирования с контекстом...');
    
    await queueLogger.info('Job processing started', 
      { documentId: 'doc123', fileSize: 1024 }, 
      { jobId: 'job456', organizationId: 'org789', userId: 'user101' }
    );

    // 3. Тест специальных методов для очередей
    console.log('\n3️⃣ Тест специальных методов очередей...');
    
    await queueLogger.jobStarted('job123', 'OCR', { documentId: 'doc456' });
    await queueLogger.jobCompleted('job123', 'OCR', 1500, { textLength: 2048 });
    await queueLogger.jobFailed('job124', 'OCR', new Error('OCR failed'), 2, 3);
    await queueLogger.jobRetry('job124', 'OCR', 3, 5000);

    // 4. Тест worker логирования
    console.log('\n4️⃣ Тест worker логирования...');
    
    await workerLogger.workerStarted('worker1', 'ocr-queue');
    await workerLogger.info('Processing job', { jobId: 'job789' });
    await workerLogger.workerStopped('worker1', 'ocr-queue', 'Graceful shutdown');

    // 5. Тест health monitor логирования
    console.log('\n5️⃣ Тест health monitor логирования...');
    
    await healthLogger.queueHealthCheck('ocr-queue', { 
      waiting: 5, 
      active: 2, 
      completed: 100, 
      failed: 1 
    });

    // 6. Тест API логирования
    console.log('\n6️⃣ Тест API логирования...');
    
    await apiLogger.info('API request received', {
      method: 'POST',
      path: '/api/ocr',
      userAgent: 'test-client'
    }, { userId: 'user123' });

    // 7. Тест обработки ошибок
    console.log('\n7️⃣ Тест обработки ошибок...');
    
    const complexError = new Error('Complex error');
    complexError.stack = 'Error: Complex error\n    at testFunction (test.js:123:45)';
    
    await queueLogger.error('Complex error occurred', complexError, {
      context: 'job_processing',
      retryAttempt: 2
    }, { jobId: 'job999' });

    console.log('\n✅ Все тесты логирования выполнены!');
    
    // Информация о логах
    const logDir = process.env.LOG_DIRECTORY || './logs';
    const logToFile = process.env.LOG_TO_FILE === 'true';
    
    console.log('\n📁 Информация о логах:');
    console.log(`   Директория логов: ${logDir}`);
    console.log(`   Запись в файл: ${logToFile ? 'включена' : 'отключена'}`);
    console.log(`   Уровень логирования: ${process.env.LOG_LEVEL || 'info'}`);
    
    if (logToFile) {
      console.log('\n📋 Файлы логов:');
      try {
        const fs = require('fs');
        const files = fs.readdirSync(logDir).filter(f => f.endsWith('.log'));
        files.forEach(file => {
          console.log(`   - ${file}`);
        });
      } catch (error) {
        console.log('   Не удалось прочитать директорию логов');
      }
    }

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании логирования:', error);
  }
}

// Запуск теста
if (require.main === module) {
  testStructuredLogging()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { testStructuredLogging };
