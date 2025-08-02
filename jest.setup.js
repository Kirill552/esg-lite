// Jest setup file
// Настройка глобальных моков и конфигурации для тестов

// Mock переменной окружения NODE_ENV для тестов
process.env.NODE_ENV = 'test'
process.env.QUEUE_STORAGE_TYPE = 'postgres'

// НЕ переопределяем DATABASE_URL - используем из .env.local через jest.env.js

// Увеличиваем таймаут для асинхронных операций
jest.setTimeout(10000)