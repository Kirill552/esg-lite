"use strict";
/**
 * Queue Manager для системы очередей на основе pg-boss
 * Включает заглушки для монетизации (кредиты и surge-pricing)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
exports.getQueueManager = getQueueManager;
exports.stopQueueManager = stopQueueManager;
const PgBoss = require('pg-boss');
const pg_boss_config_1 = require("./pg-boss-config");
const credits_service_1 = require("./credits-service");
const surge_pricing_1 = require("./surge-pricing");
// Заглушки удалены - используем отдельные сервисы
/**
 * Основной класс Queue Manager
 */
class QueueManager {
    constructor() {
        this.boss = null;
        // Используем singleton сервисы
    }
    /**
     * Инициализация pg-boss
     */
    async initialize() {
        if (this.boss) {
            console.log('⚠️ Queue Manager уже инициализирован');
            return;
        }
        try {
            this.boss = await (0, pg_boss_config_1.createPgBoss)();
            console.log('✅ Queue Manager инициализирован успешно');
        }
        catch (error) {
            console.error('❌ Ошибка инициализации Queue Manager:', error);
            throw error;
        }
    }
    /**
     * Остановка pg-boss
     */
    async stop() {
        if (this.boss) {
            await this.boss.stop();
            this.boss = null;
            console.log('🛑 Queue Manager остановлен');
        }
    }
    /**
     * Добавление задачи OCR в очередь
     */
    async addOcrJob(data, options = {}) {
        if (!this.boss) {
            throw new Error('Queue Manager не инициализирован');
        }
        // Проверяем кредиты
        const hasCredits = await credits_service_1.creditsService.hasCredits(data.organizationId || data.userId);
        if (!hasCredits) {
            console.log(`❌ Недостаточно кредитов для организации ${data.organizationId || data.userId}`);
            throw new Error('INSUFFICIENT_CREDITS');
        }
        // Определяем приоритет с учетом surge-pricing
        let priority = pg_boss_config_1.JOB_PRIORITIES.NORMAL;
        if (options.priority === 'urgent') {
            priority = pg_boss_config_1.JOB_PRIORITIES.URGENT;
        }
        else if (options.priority === 'high' || surge_pricing_1.surgePricingService.getJobPriority() === 'high') {
            priority = pg_boss_config_1.JOB_PRIORITIES.HIGH;
        }
        const jobOptions = {
            priority,
            retryLimit: options.retryLimit || 3,
            expireInHours: options.expireInHours || 1
        };
        console.log(`📋 Добавление OCR задачи в очередь:`, {
            documentId: data.documentId,
            priority,
            isSurge: surge_pricing_1.surgePricingService.isSurgePeriod(),
            organizationId: data.organizationId || data.userId
        });
        try {
            const jobId = await this.boss.send(pg_boss_config_1.QUEUE_NAMES.OCR, data, jobOptions);
            console.log(`✅ OCR задача добавлена с ID: ${jobId}`);
            return jobId;
        }
        catch (error) {
            console.error('❌ Ошибка добавления OCR задачи:', error);
            throw error;
        }
    }
    /**
     * Получение статуса задачи
     */
    async getJobStatus(jobId) {
        if (!this.boss) {
            throw new Error('Queue Manager не инициализирован');
        }
        try {
            const job = await this.boss.getJobById(pg_boss_config_1.QUEUE_NAMES.OCR, jobId);
            if (!job) {
                return null;
            }
            // Исправляем типы и названия полей согласно pg-boss API
            return {
                id: job.id,
                status: this.mapJobState(job.state),
                progress: job.data?.progress,
                result: job.output,
                error: job.output?.error,
                createdAt: job.createdOn,
                processedAt: job.completedOn || job.failedOn,
                priority: job.priority || pg_boss_config_1.JOB_PRIORITIES.NORMAL
            };
        }
        catch (error) {
            console.error(`❌ Ошибка получения статуса задачи ${jobId}:`, error);
            throw error;
        }
    }
    /**
     * Получение статистики очередей
     */
    async getQueueStats() {
        if (!this.boss) {
            throw new Error('Queue Manager не инициализирован');
        }
        try {
            // Упрощенная версия - получаем общий размер очереди
            const totalSize = await this.boss.getQueueSize(pg_boss_config_1.QUEUE_NAMES.OCR);
            // Заглушка для детальной статистики (в будущем можно улучшить)
            const stats = {
                waiting: totalSize,
                active: 0,
                completed: 0,
                failed: 0,
                total: totalSize
            };
            console.log('📊 Статистика очередей:', stats);
            return stats;
        }
        catch (error) {
            console.error('❌ Ошибка получения статистики очередей:', error);
            throw error;
        }
    }
    /**
     * Очистка завершенных задач
     */
    async cleanCompletedJobs(olderThanHours = 24) {
        if (!this.boss) {
            throw new Error('Queue Manager не инициализирован');
        }
        try {
            // pg-boss автоматически очищает старые задачи согласно конфигурации
            // Здесь можем добавить дополнительную логику очистки
            console.log(`🧹 Запуск очистки задач старше ${olderThanHours} часов`);
            // Заглушка: возвращаем количество очищенных задач
            const cleanedCount = 0; // pg-boss делает это автоматически
            console.log(`✅ Очищено ${cleanedCount} завершенных задач`);
            return cleanedCount;
        }
        catch (error) {
            console.error('❌ Ошибка очистки завершенных задач:', error);
            throw error;
        }
    }
    /**
     * Обработка успешного завершения задачи (для списания кредитов)
     */
    async onJobCompleted(jobId, result) {
        console.log(`✅ Задача ${jobId} завершена успешно`);
        // Списываем кредиты
        const organizationId = result.documentId; // временно используем documentId
        const creditsToDebit = surge_pricing_1.surgePricingService.getSurgeMultiplier(); // 1 или 2 кредита
        await credits_service_1.creditsService.debitCredits(organizationId, creditsToDebit, 'OCR processing completed');
        console.log(`💳 Списано ${creditsToDebit} кредитов для ${organizationId}`);
    }
    /**
     * Получение информации о surge-pricing
     */
    getSurgePricingInfo() {
        return {
            isSurge: surge_pricing_1.surgePricingService.isSurgePeriod(),
            multiplier: surge_pricing_1.surgePricingService.getSurgeMultiplier()
        };
    }
    /**
     * Маппинг состояний pg-boss в наши статусы
     */
    mapJobState(state) {
        switch (state) {
            case 'created':
            case 'retry':
                return 'waiting';
            case 'active':
                return 'active';
            case 'completed':
                return 'completed';
            case 'failed':
            case 'cancelled':
                return 'failed';
            default:
                return 'waiting';
        }
    }
}
exports.QueueManager = QueueManager;
// Singleton instance
let queueManagerInstance = null;
/**
 * Получение singleton экземпляра Queue Manager
 */
async function getQueueManager() {
    if (!queueManagerInstance) {
        queueManagerInstance = new QueueManager();
        await queueManagerInstance.initialize();
    }
    return queueManagerInstance;
}
/**
 * Остановка Queue Manager (для graceful shutdown)
 */
async function stopQueueManager() {
    if (queueManagerInstance) {
        await queueManagerInstance.stop();
        queueManagerInstance = null;
    }
}
