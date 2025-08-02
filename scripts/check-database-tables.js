const { Client } = require('pg');

async function checkDatabaseTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://esg_user:esg_user_2025!@localhost:5433/esg_lite_mvp'
  });

  try {
    console.log('🔍 Подключение к базе данных...');
    await client.connect();
    
    console.log('📊 Получаем список всех таблиц...');
    
    // Получаем все схемы и таблицы
    const allTablesQuery = `
      SELECT 
        schemaname, 
        tablename,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename;
    `;
    
    const result = await client.query(allTablesQuery);
    
    console.log(`\n📋 Найдено ${result.rows.length} таблиц:\n`);
    
    let currentSchema = '';
    result.rows.forEach(row => {
      if (row.schemaname !== currentSchema) {
        currentSchema = row.schemaname;
        console.log(`\n🏛️  Схема: ${currentSchema}`);
        console.log('='.repeat(40));
      }
      
      const features = [];
      if (row.hasindexes) features.push('indexes');
      if (row.hasrules) features.push('rules');
      if (row.hastriggers) features.push('triggers');
      
      console.log(`   📄 ${row.tablename}${features.length ? ` (${features.join(', ')})` : ''}`);
    });
    
    // Проверяем специально схему pgboss
    console.log('\n🔍 Проверяем схему pgboss детально...');
    const pgbossQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'pgboss'
      ORDER BY table_name;
    `;
    
    const pgbossResult = await client.query(pgbossQuery);
    
    if (pgbossResult.rows.length === 0) {
      console.log('❌ Схема pgboss пустая или не существует!');
    } else {
      console.log(`✅ В схеме pgboss найдено ${pgbossResult.rows.length} таблиц:`);
      pgbossResult.rows.forEach(row => {
        console.log(`   📄 ${row.table_name} (${row.table_type})`);
      });
    }
    
    // Проверяем права пользователя
    console.log('\n🔐 Проверяем права текущего пользователя...');
    const userQuery = `SELECT current_user, current_database();`;
    const userResult = await client.query(userQuery);
    console.log(`👤 Пользователь: ${userResult.rows[0].current_user}`);
    console.log(`🏠 База данных: ${userResult.rows[0].current_database}`);
    
    // Проверяем права на схему pgboss
    console.log('\n🔍 Проверяем содержимое схемы pgboss...');
    const pgbossContentQuery = `
      SELECT 
        name,
        COUNT(*) as job_count
      FROM pgboss.job 
      GROUP BY name
      ORDER BY job_count DESC;
    `;
    
    try {
      const contentResult = await client.query(pgbossContentQuery);
      if (contentResult.rows.length > 0) {
        console.log('� Задачи в очередях:');
        contentResult.rows.forEach(row => {
          console.log(`   📝 ${row.name}: ${row.job_count} задач`);
        });
      } else {
        console.log('📭 Очереди пустые');
      }
    } catch (err) {
      console.log('❌ Ошибка чтения pgboss.job:', err.message);
    }
    
    // Проверяем версию pgboss
    try {
      const versionQuery = `SELECT version FROM pgboss.version LIMIT 1;`;
      const versionResult = await client.query(versionQuery);
      if (versionResult.rows.length > 0) {
        console.log(`🔢 Версия pg-boss схемы: ${versionResult.rows[0].version}`);
      }
    } catch (err) {
      console.log('❌ Ошибка чтения версии pg-boss:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  checkDatabaseTables().catch(console.error);
}

module.exports = { checkDatabaseTables };
