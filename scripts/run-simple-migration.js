/**
 * Простой скрипт для выполнения миграции БД
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSimpleMigration() {
  console.log('🚀 Запуск простой миграции базы данных...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Подключение к БД успешно');

    // Читаем SQL файл миграции
    const migrationPath = path.join(__dirname, 'add-report-snapshots.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Выполнение простой миграции...');
    
    // Разбиваем на отдельные команды (по точке с запятой)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`  ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
          await client.query(command);
          console.log(`  ✅ Команда ${i + 1} выполнена успешно`);
        } catch (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('already has value') ||
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist') ||
              error.message.includes('IF NOT EXISTS')) {
            console.log(`  ⚠️ Команда ${i + 1} пропущена: ${error.message.split('\n')[0]}`);
          } else {
            console.error(`  ❌ Ошибка в команде ${i + 1}:`, error.message);
            // Не прерываем выполнение, продолжаем
          }
        }
      }
    }

    console.log('\n🎉 Простая миграция завершена!');
    
    // Проверяем результат
    console.log('\n🔍 Проверка результатов миграции...');
    
    // Проверяем новые поля в documents
    const documentsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name IN ('processingProgress', 'processingStage', 'processingMessage', 'jobId')
      ORDER BY column_name;
    `);
    
    console.log('📄 Новые поля в documents:', documentsResult.rows.map(r => r.column_name));
    
    // Проверяем новые таблицы
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('credits', 'credit_transactions', 'rate_limits')
      ORDER BY table_name;
    `);
    
    console.log('🗂️ Новые таблицы:', tablesResult.rows.map(r => r.table_name));
    
    // Проверяем enum DocumentStatus
    const enumResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DocumentStatus')
      ORDER BY enumlabel;
    `);
    
    console.log('📋 DocumentStatus enum:', enumResult.rows.map(r => r.enumlabel));

    // Создаем начальные записи кредитов для существующих пользователей
    console.log('\n💰 Создание начальных записей кредитов...');
    const insertResult = await client.query(`
      INSERT INTO credits ("userId", balance, "totalPurchased", "totalUsed", "createdAt", "updatedAt")
      SELECT id, 1000, 1000, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM users
      WHERE id NOT IN (SELECT "userId" FROM credits WHERE "userId" IS NOT NULL)
      ON CONFLICT ("userId") DO NOTHING;
    `);
    
    console.log(`✅ Создано ${insertResult.rowCount} записей кредитов`);

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Соединение с БД закрыто');
  }
}

// Запуск миграции
runSimpleMigration()
  .then(() => {
    console.log('✅ Простая миграция завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка миграции:', error);
    process.exit(1);
  });