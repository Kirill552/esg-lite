/**
 * Тест методов управления очередью
 */

require('dotenv').config();
const PgBoss = require('pg-boss');

async function testQueueManagement() {
  console.log('🔧 Тест методов управления очередью...');
  
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
    
    // Создаем несколько тестовых задач
    console.log('📋 Создание тестовых задач...');
    const jobIds = [];
    
    for (let i = 0; i < 3; i++) {
      const jobData = {
        documentId: `test-doc-${i}`,
        fileKey: `test-file-${i}.pdf`,
        userId: 'test-user',
        organizationId: 'test-org'
      };
      
      const jobId = await boss.send('ocr-processing', jobData, {
        priority: i === 0 ? 20 : 5, // первая задача с высоким приоритетом
        retryLimit: 3
      });
      
      if (jobId) {
        jobIds.push(jobId);
        console.log(`✅ Создана задача ${i + 1}: ${jobId}`);
      }
    }
    
    // Тест получения статистики
    console.log('📊 Тест детальной статистики...');
    const db = boss.db;
    
    if (db) {
      const result = await db.query(`
        SELECT 
          state,
          COUNT(*) as count
        FROM pgboss.job 
        WHERE name = 'ocr-processing'
        GROUP BY state
      `);
      
      console.log('✅ Статистика по статусам:');
      result.rows.forEach(row => {
        console.log(`  - ${row.state}: ${row.count}`);
      });
    }
    
    // Тест получения активных задач
    console.log('📋 Тест получения задач в очереди...');
    if (db) {
      const activeJobs = await db.query(`
        SELECT 
          id,
          data,
          createdon,
          priority,
          state
        FROM pgboss.job 
        WHERE name = 'ocr-processing'
        AND state IN ('created', 'active')
        ORDER BY priority DESC, createdon ASC
        LIMIT 5
      `);
      
      console.log('✅ Задачи в очереди:');
      activeJobs.rows.forEach(job => {
        console.log(`  - ID: ${job.id}, Priority: ${job.priority}, State: ${job.state}`);
        console.log(`    Data: ${JSON.stringify(job.data)}`);
      });
    }
    
    // Тест отмены задачи
    if (jobIds.length > 0) {
      console.log('❌ Тест отмены задачи...');
      const jobToCancel = jobIds[0];
      
      try {
        const cancelled = await boss.cancel(jobToCancel);
        console.log(`✅ Задача ${jobToCancel} ${cancelled ? 'отменена' : 'не удалось отменить'}`);
      } catch (error) {
        console.log(`⚠️ Ошибка отмены задачи: ${error.message}`);
      }
    }
    
    // Тест очистки старых задач
    console.log('🧹 Тест очистки задач...');
    if (db) {
      // Сначала посмотрим, сколько задач есть
      const beforeCleanup = await db.query(`
        SELECT COUNT(*) as count 
        FROM pgboss.job 
        WHERE name = 'ocr-processing'
      `);
      
      console.log(`📊 Задач до очистки: ${beforeCleanup.rows[0].count}`);
      
      // Очистка задач старше 1 минуты (для теста)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const cleanupResult = await db.query(`
        DELETE FROM pgboss.job 
        WHERE name = 'ocr-processing'
        AND state IN ('completed', 'failed', 'cancelled')
        AND completedon < $1
      `, [oneMinuteAgo]);
      
      console.log(`✅ Очищено задач: ${cleanupResult.rowCount || 0}`);
    }
    
    // Тест метрик производительности
    console.log('📈 Тест метрик производительности...');
    if (db) {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const metricsResult = await db.query(`
        SELECT 
          state,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (completedon - startedon))) as avg_duration
        FROM pgboss.job 
        WHERE name = 'ocr-processing'
        AND createdon > $1
        GROUP BY state
      `, [last24Hours]);
      
      console.log('✅ Метрики за 24 часа:');
      metricsResult.rows.forEach(row => {
        const avgDuration = row.avg_duration ? `${Math.round(row.avg_duration)}s` : 'N/A';
        console.log(`  - ${row.state}: ${row.count} задач, среднее время: ${avgDuration}`);
      });
    }
    
    console.log('🎉 Все тесты управления очередью прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования управления очередью:', error.message);
    throw error;
  } finally {
    await boss.stop();
    console.log('🛑 pg-boss остановлен');
  }
}

testQueueManagement()
  .then(() => {
    console.log('✅ Тестирование управления очередью завершено');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Тест управления очередью не прошел:', error.message);
    process.exit(1);
  });