/**
 * Базовый тест Queue Manager функциональности
 */

require('dotenv').config();
const PgBoss = require('pg-boss');

async function testQueueBasic() {
  console.log('🔧 Базовый тест Queue Manager функциональности...');
  
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
    console.log('🚀 Запуск pg-boss...');
    await boss.start();
    console.log('✅ pg-boss запущен');
    
    // Тест заглушек монетизации
    console.log('💳 Тест заглушек кредитов...');
    const organizationId = 'test-org-123';
    
    // Заглушка проверки кредитов
    function checkCreditsStub(orgId) {
      console.log(`🔧 [STUB] Проверка кредитов для ${orgId}: OK`);
      return true;
    }
    
    // Заглушка surge-pricing
    function isSurgePeriodStub() {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const isSurge = month === 6 && day >= 15 && day <= 30;
      console.log(`🔧 [STUB] Surge период: ${isSurge ? 'активен' : 'неактивен'}`);
      return isSurge;
    }
    
    // Тест добавления задачи с проверками
    console.log('📋 Тест добавления задачи с заглушками...');
    
    const hasCredits = checkCreditsStub(organizationId);
    if (!hasCredits) {
      throw new Error('Недостаточно кредитов');
    }
    
    const isSurge = isSurgePeriodStub();
    const priority = isSurge ? 20 : 5; // high : normal
    
    const jobData = {
      documentId: 'test-doc-123',
      fileKey: 'test-file.pdf',
      userId: 'test-user',
      organizationId: organizationId
    };
    
    const jobId = await boss.send('ocr-processing', jobData, {
      priority,
      retryLimit: 3,
      expireInHours: 1
    });
    
    console.log('✅ Задача добавлена с ID:', jobId);
    console.log('📊 Приоритет задачи:', priority, isSurge ? '(surge)' : '(normal)');
    
    // Тест получения статистики
    console.log('📈 Тест статистики очередей...');
    const queueSize = await boss.getQueueSize('ocr-processing');
    console.log('✅ Размер очереди ocr-processing:', queueSize);
    
    // Тест заглушки списания кредитов
    console.log('💰 Тест списания кредитов...');
    function debitCreditsStub(orgId, amount) {
      const surgeMultiplier = isSurge ? 2 : 1;
      const totalAmount = amount * surgeMultiplier;
      console.log(`🔧 [STUB] Списание ${totalAmount} кредитов для ${orgId} (surge: x${surgeMultiplier})`);
      return true;
    }
    
    debitCreditsStub(organizationId, 1);
    
    console.log('🎉 Все базовые тесты прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка базового теста:', error.message);
    throw error;
  } finally {
    await boss.stop();
    console.log('🛑 pg-boss остановлен');
  }
}

testQueueBasic()
  .then(() => {
    console.log('✅ Базовое тестирование завершено успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Базовое тестирование не прошло:', error.message);
    process.exit(1);
  });