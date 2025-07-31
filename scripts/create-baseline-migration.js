#!/usr/bin/env node

/**
 * Скрипт для создания миграции Prisma
 * Используется для baseline миграции существующей БД
 */

const { execSync } = require('child_process');

async function createMigration() {
  try {
    console.log('🗃️ Создание baseline миграции для существующей базы данных...');
    
    // Отмечаем миграцию как примененную (baseline)
    execSync('npx prisma migrate resolve --applied 20250131000000_init', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    console.log('✅ Baseline миграция успешно отмечена как примененная');
    
    // Проверяем статус миграций
    console.log('\n📊 Статус миграций:');
    execSync('npx prisma migrate status', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при создании миграции:', error.message);
    process.exit(1);
  }
}

createMigration();
