/**
 * Загрузка переменных окружения для Jest тестов
 * Подключает .env.local для корректной работы с БД в тестах
 */
const { loadEnvConfig } = require('@next/env');
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные окружения из .env.local для тестов
loadEnvConfig(process.cwd());

// Дополнительная загрузка .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Отладочная информация
console.log('🔧 Jest environment loaded DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Очистка кэша Prisma клиента, чтобы он пересоздался с новыми переменными окружения
delete require.cache[require.resolve('@prisma/client')];

// Перезагружаем Prisma клиент после установки переменных окружения
if (global.prisma) {
  global.prisma.$disconnect();
  delete global.prisma;
}
