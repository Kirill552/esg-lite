// Jest setup file
// Настройка глобальных моков и конфигурации для тестов

// Mock переменных окружения для тестов
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.QUEUE_STORAGE_TYPE = 'postgres'

// Увеличиваем таймаут для асинхронных операций
jest.setTimeout(10000)