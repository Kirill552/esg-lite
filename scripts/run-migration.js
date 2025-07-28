/**
 * Скрипт для выполнения миграции БД
 * Добавляет недостающие поля и таблицы для монетизации
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Запуск миграции базы данных...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Подключение к БД успешно');

    // Читаем SQL файл миграции
    const migrationPath = path.join(__dirname, 'add-missing-fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Выполнение миграции...');
    
    // Разбиваем на отдельные команды, учитывая DO блоки
    const commands = [];
    let currentCommand = '';
    let inDoBlock = false;
    
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Пропускаем комментарии и пустые строки
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      currentCommand += line + '\n';
      
      // Проверяем начало DO блока
      if (trimmedLine.includes('DO $$')) {
        inDoBlock = true;
      }
      
      // Проверяем конец DO блока
      if (inDoBlock && trimmedLine.includes('END $$;')) {
        inDoBlock = false;
        commands.push(currentCommand.trim());
        currentCommand = '';
        continue;
      }
      
      // Если не в DO блоке и строка заканчивается на ;
      if (!inDoBlock && trimmedLine.endsWith(';') && !trimmedLine.includes('DO $$')) {
        commands.push(currentCommand.trim());
        currentCommand = '';
      }
    }
    
    // Добавляем последнюю команду если есть
    if (currentCommand.trim()) {
      commands.push(currentCommand.trim());
    }
    
    // Фильтруем пустые команды
    const filteredCommands = commands.filter(cmd => cmd.length > 0 && cmd !== 'COMMIT');

    for (let i = 0; i < filteredCommands.length; i++) {
      const command = filteredCommands[i];
      if (command.trim()) {
        try {
          console.log(`  ${i + 1}/${filteredCommands.length}: Выполнение команды...`);
          console.log(`    ${command.substring(0, 60)}...`);
          await client.query(command);
          console.log(`  ✅ Команда ${i + 1} выполнена успешно`);
        } catch (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('already has value') ||
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist')) {
            console.log(`  ⚠️ Команда ${i + 1} пропущена: ${error.message.split('\n')[0]}`);
          } else {
            console.error(`  ❌ Ошибка в команде ${i + 1}:`, error.message);
            console.error(`  Команда: ${command.substring(0, 200)}...`);
            throw error;
          }
        }
      }
    }

    console.log('\n🎉 Миграция завершена успешно!');
    
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

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Соединение с БД закрыто');
  }
}

// Запуск миграции
runMigration()
  .then(() => {
    console.log('✅ Миграция завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка миграции:', error);
    process.exit(1);
  });