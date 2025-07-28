/**
 * Простой тест логирования без импорта TypeScript модулей
 * Проверяет создание директории логов и базовое логирование
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testBasicLogging() {
  console.log('🧪 Простой тест логирования...\n');

  try {
    // 1. Проверяем переменные окружения
    console.log('1️⃣ Проверка переменных окружения:');
    console.log(`   LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);
    console.log(`   LOG_TO_FILE: ${process.env.LOG_TO_FILE || 'false'}`);
    console.log(`   LOG_DIRECTORY: ${process.env.LOG_DIRECTORY || './logs'}`);
    console.log(`   LOG_MAX_FILE_SIZE: ${process.env.LOG_MAX_FILE_SIZE || '10485760'}`);
    console.log(`   LOG_MAX_FILES: ${process.env.LOG_MAX_FILES || '5'}`);

    // 2. Создаем директорию логов если нужно
    const logDir = process.env.LOG_DIRECTORY || './logs';
    if (process.env.LOG_TO_FILE === 'true') {
      console.log('\n2️⃣ Создание директории логов...');
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        console.log(`   ✅ Директория создана: ${logDir}`);
      } else {
        console.log(`   ✅ Директория уже существует: ${logDir}`);
      }
    }

    // 3. Тест записи лога
    if (process.env.LOG_TO_FILE === 'true') {
      console.log('\n3️⃣ Тест записи в лог файл...');
      
      const testLogFile = path.join(logDir, 'test-log.log');
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'test',
        message: 'Test log entry',
        data: { test: true }
      };
      
      fs.appendFileSync(testLogFile, JSON.stringify(logEntry) + '\n');
      console.log(`   ✅ Тестовый лог записан: ${testLogFile}`);
      
      // Проверяем размер файла
      const stats = fs.statSync(testLogFile);
      console.log(`   📊 Размер файла: ${stats.size} байт`);
    }

    // 4. Демонстрация структуры лога
    console.log('\n4️⃣ Пример структуры лога:');
    const exampleLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      component: 'queue-manager',
      message: 'OCR job started',
      jobId: 'job123',
      organizationId: 'org456',
      data: {
        documentId: 'doc789',
        priority: 'normal',
        fileSize: 1024
      }
    };
    console.log(JSON.stringify(exampleLog, null, 2));

    // 5. Демонстрация лога ошибки
    console.log('\n5️⃣ Пример лога ошибки:');
    const errorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'ocr-worker',
      message: 'Job processing failed',
      jobId: 'job123',
      error: {
        name: 'ProcessingError',
        message: 'Failed to process document',
        stack: 'ProcessingError: Failed to process document\n    at processOcr (worker.js:123:45)'
      },
      data: {
        attempt: 2,
        maxAttempts: 3
      }
    };
    console.log(JSON.stringify(errorLog, null, 2));

    console.log('\n🎉 Тест базового логирования завершен!');

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error);
  }
}

// Запуск теста
if (require.main === module) {
  testBasicLogging()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { testBasicLogging };
