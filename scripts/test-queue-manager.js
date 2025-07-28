/**
 * Тест Queue Manager с заглушками монетизации
 */

require('dotenv').config();

async function testQueueManager() {
  console.log('🔧 Тестирование Queue Manager...');
  
  // Используем require для TypeScript файлов через ts-node или компиляцию
  // Временно создадим простой тест подключения
  console.log('⚠️ Тест Queue Manager требует компиляции TypeScript');
  
  const queueManager = new QueueManager();
  
  try {
    // Инициализация
    console.log('🚀 Инициализация Queue Manager...');
    await queueManager.initialize();
    console.log('✅ Queue Manager инициализирован');
    
    // Тестовые данные
    const testJobData = {
      documentId: 'test-doc-123',
      fileKey: 'test-file.pdf',
      userId: 'test-user-456',
      organizationId: 'test-org-789'
    };
    
    // Тест добавления задачи
    console.log('📋 Тест добавления OCR задачи...');
    const jobId = await queueManager.addOcrJob(testJobData, { priority: 'normal' });
    console.log('✅ Задача добавлена с ID:', jobId);
    
    // Тест получения статуса
    if (jobId) {
      console.log('📊 Тест получения статуса задачи...');
      const status = await queueManager.getJobStatus(jobId);
      console.log('✅ Статус задачи:', status);
    }
    
    // Тест статистики очередей
    console.log('📈 Тест получения статистики очередей...');
    const stats = await queueManager.getQueueStats();
    console.log('✅ Статистика очередей:', stats);
    
    // Тест surge-pricing
    console.log('💰 Тест surge-pricing информации...');
    const surgeInfo = queueManager.getSurgePricingInfo();
    console.log('✅ Surge-pricing:', surgeInfo);
    
    // Тест с высоким приоритетом
    console.log('🔥 Тест задачи с высоким приоритетом...');
    const highPriorityJobId = await queueManager.addOcrJob({
      ...testJobData,
      documentId: 'test-doc-high-priority'
    }, { priority: 'high' });
    console.log('✅ Задача с высоким приоритетом добавлена:', highPriorityJobId);
    
    // Тест очистки
    console.log('🧹 Тест очистки завершенных задач...');
    const cleanedCount = await queueManager.cleanCompletedJobs(1);
    console.log('✅ Очищено задач:', cleanedCount);
    
    console.log('🎉 Все тесты Queue Manager прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования Queue Manager:', error.message);
    throw error;
  } finally {
    await queueManager.stop();
    console.log('🛑 Queue Manager остановлен');
  }
}

testQueueManager()
  .then(() => {
    console.log('✅ Тестирование завершено успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Тестирование не прошло:', error.message);
    process.exit(1);
  });