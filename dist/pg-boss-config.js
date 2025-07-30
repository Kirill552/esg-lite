"use strict";
/**
 * Конфигурация pg-boss для PostgreSQL очередей
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_PRIORITIES = exports.QUEUE_NAMES = void 0;
exports.getPgBossConfig = getPgBossConfig;
exports.createPgBoss = createPgBoss;
const PgBoss = require('pg-boss');
/**
 * Получение конфигурации pg-boss из переменных окружения
 */
function getPgBossConfig() {
    // Используем отдельные параметры вместо connectionString для надежности
    const host = process.env.DB_HOST;
    const port = parseInt(process.env.DB_PORT || '5432');
    const database = process.env.DB_NAME;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    if (!host || !database || !user || !password) {
        throw new Error('DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD are required for PostgreSQL queues');
    }
    // Формируем connectionString из отдельных параметров
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    return {
        connectionString,
        schema: process.env.QUEUE_TABLE_PREFIX || 'pgboss',
        retryLimit: 3,
        retryDelay: 2000,
        expireInHours: 1, // задачи истекают через 1 час
        archiveCompletedAfterSeconds: 3600, // архивировать завершенные задачи через 1 час
        deleteAfterHours: 24 * 7 // удалять старые задачи через неделю
    };
}
/**
 * Создание экземпляра pg-boss с конфигурацией
 */
async function createPgBoss() {
    // Используем отдельные параметры для надежного подключения
    const host = process.env.DB_HOST;
    const port = parseInt(process.env.DB_PORT || '5432');
    const database = process.env.DB_NAME;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    if (!host || !database || !user || !password) {
        throw new Error('DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD are required');
    }
    const boss = new PgBoss({
        host,
        port,
        database,
        user,
        password,
        schema: process.env.QUEUE_TABLE_PREFIX || 'pgboss',
        retryLimit: 3,
        retryDelay: 2000,
        expireInHours: 1,
        archiveCompletedAfterSeconds: 3600,
        deleteAfterHours: 24 * 7,
        // Настройки для production
        monitorStateIntervalSeconds: 60,
        maintenanceIntervalSeconds: 300
    });
    // Запускаем pg-boss
    await boss.start();
    console.log('✅ pg-boss started successfully');
    return boss;
}
/**
 * Константы для имен очередей
 */
exports.QUEUE_NAMES = {
    OCR: 'ocr-processing',
    PDF_GENERATION: 'pdf-generation',
    CLEANUP: 'cleanup-old-jobs'
};
/**
 * Приоритеты задач
 */
exports.JOB_PRIORITIES = {
    LOW: 1,
    NORMAL: 5,
    HIGH: 10,
    URGENT: 20
};
