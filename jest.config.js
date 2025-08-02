/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Загружаем переменные окружения для тестов
  setupFiles: ['<rootDir>/jest.env.js'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'workers/**/*.{js,ts}',
    '!lib/**/*.d.ts',
    '!**/*.config.js',
    '!**/node_modules/**'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  testTimeout: 10000,
  verbose: true
}

module.exports = config