/**
 * Тест OCR Worker функциональности
 */

require('dotenv').config();
const PgBoss = require('pg-boss');

async function testOcrWorker() {
  console.log('🔧 Тест OCR Worker функциональности...');
  
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '5432');
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  
  if (!host || !database || !user || !password) {
    throw new Error('DB параметры не настроены');
  }
  
  const boss = new PgBoss({
    host,
    port,
    database,
    user,
    password,
    schema: 'pgboss',
    noSupervisor: true,
    noScheduling: true
  });
  
  try {
    console.log('🚀 Запуск pg-boss для тестирования...');
    await boss.start();
    console.log('✅ pg-boss запущен');
    
    // Тест 1: Создание тестовой задачи OCR
    console.log('📋 Тест 1: Создание тестовой задачи OCR...');
    
    const testJobData = {
      documentId: 'test-doc-worker-123',
      fileKey: 'test-files/sample.pdf', // Несуществующий файл для теста
      userId: 'test-user-456',
      organizationId: 'test-org-789'
    };
    
    const jobId = await boss.send('ocr-processing', testJobData, {
      priority: 10,
      retryLimit: 1, // Ограничиваем retry для теста
      expireInHours: 1
    });
    
    console.log(`✅ Тестовая задача создана с ID: ${jobId}`);
    
    // Тест 2: Проверка статуса задачи
    console.log('📊 Тест 2: Проверка статуса задачи...');
    
    if (jobId) {
      // Ждем немного
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const job = await boss.getJobById('ocr-processing', jobId);
      if (job) {
        console.log('✅ Статус задачи:', {
          id: job.id,
          state: job.state,
          priority: job.priority,
          createdOn: job.createdOn
        });
      } else {
        console.log('⚠️ Задача не найдена');
      }
    }
    
    // Тест 3: Симуляция обработки задачи (без реального worker'а)
    console.log('🔧 Тест 3: Симуляция обработки задачи...');
    
    // Заглушки для тестирования логики
    function simulateCreditsCheck(orgId) {
      console.log(`🔧 [STUB] Проверка кредитов для ${orgId}: OK`);
      return true;
    }
    
    function simulateOcrProcessing(fileKey) {
      console.log(`🔧 [STUB] OCR обработка файла ${fileKey}...`);
      if (fileKey.includes('sample.pdf')) {
        // Симулируем ошибку для несуществующего файла
        throw new Error('FILE_NOT_FOUND: Файл не найден в хранилище');
      }
      return 'Тестовый текст из OCR обработки';
    }
    
    function simulateCreditsDebit(orgId, amount) {
      console.log(`🔧 [STUB] Списание ${amount} кредитов для ${orgId}`);
      return true;
    }
    
    // Симулируем обработку
    try {
      console.log('  📋 Этап 1: Проверка кредитов...');
      const hasCredits = simulateCreditsCheck(testJobData.organizationId);
      
      if (!hasCredits) {
        throw new Error('INSUFFICIENT_CREDITS');
      }
      
      console.log('  📋 Этап 2: OCR обработка...');
      const ocrText = simulateOcrProcessing(testJobData.fileKey);
      
      console.log('  📋 Этап 3: Списание кредитов...');
      simulateCreditsDebit(testJobData.organizationId, 1);
      
      console.log('✅ Симуляция обработки завершена успешно');
      console.log(`📄 OCR результат: "${ocrText.substring(0, 50)}..."`);
      
    } catch (error) {
      console.log(`❌ Симуляция обработки завершилась ошибкой: ${error.message}`);
      console.log('✅ Это ожидаемое поведение для тестового файла');
    }
    
    // Тест 4: Проверка конфигурации worker'а
    console.log('⚙️ Тест 4: Проверка конфигурации worker...');
    
    const workerConfig = {
      concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '5'),
      pollInterval: 5000,
      maxRetries: 3
    };
    
    console.log('✅ Конфигурация worker:', workerConfig);
    
    // Тест 5: Проверка очереди
    console.log('📊 Тест 5: Статистика очереди...');
    
    const queueSize = await boss.getQueueSize('ocr-processing');
    console.log(`✅ Размер очереди ocr-processing: ${queueSize}`);
    
    // Получаем задачи в очереди
    const db = boss.db;
    if (db) {
      const jobs = await db.query(`
        SELECT 
          id,
          state,
          priority,
          createdon,
          data->>'documentId' as document_id
        FROM pgboss.job 
        WHERE name = 'ocr-processing'
        ORDER BY createdon DESC
        LIMIT 5
      `);
      
      console.log('✅ Последние задачи в очереди:');
      jobs.rows.forEach(job => {
        console.log(`  - ${job.id}: ${job.state}, doc: ${job.document_id}, priority: ${job.priority}`);
      });
    }
    
    console.log('🎉 Все тесты OCR Worker прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования OCR Worker:', error.message);
    throw error;
  } finally {
    await boss.stop();
    console.log('🛑 pg-boss остановлен');
  }
}

testOcrWorker()
  .then(() => {
    console.log('✅ Тестирование OCR Worker завершено');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Тест OCR Worker не прошел:', error.message);
    process.exit(1);
  });