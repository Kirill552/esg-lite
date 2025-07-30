"use strict";
/**
 * Credits Service - заглушки для системы кредитов
 * В будущем будет заменен на реальную реализацию с БД и платежами
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditsService = exports.CreditsService = void 0;
/**
 * Заглушка сервиса кредитов
 * TODO: Заменить на реальную реализацию с PostgreSQL таблицами
 */
class CreditsService {
    constructor() {
        // Заглушка: храним балансы в памяти
        this.balances = new Map();
        // Инициализируем тестовые балансы
        this.balances.set('default', 1000);
        console.log('🔧 [STUB] Credits Service инициализирован с заглушками');
    }
    static getInstance() {
        if (!CreditsService.instance) {
            CreditsService.instance = new CreditsService();
        }
        return CreditsService.instance;
    }
    /**
     * Проверка баланса кредитов организации
     */
    async checkBalance(organizationId) {
        const balance = this.balances.get(organizationId) || this.balances.get('default') || 1000;
        console.log(`🔧 [STUB] Баланс кредитов для ${organizationId}: ${balance}`);
        return balance;
    }
    /**
     * Проверка наличия достаточного количества кредитов
     */
    async hasCredits(organizationId, required = 1) {
        const balance = await this.checkBalance(organizationId);
        const hasEnough = balance >= required;
        console.log(`🔧 [STUB] Проверка кредитов ${organizationId}: требуется ${required}, доступно ${balance} - ${hasEnough ? 'OK' : 'НЕДОСТАТОЧНО'}`);
        return hasEnough;
    }
    /**
     * Списание кредитов
     */
    async debitCredits(organizationId, amount, description = 'OCR processing') {
        const currentBalance = await this.checkBalance(organizationId);
        if (currentBalance < amount) {
            console.log(`🔧 [STUB] Ошибка списания: недостаточно кредитов для ${organizationId}`);
            return false;
        }
        // Заглушка: обновляем баланс в памяти
        const newBalance = currentBalance - amount;
        this.balances.set(organizationId, newBalance);
        console.log(`🔧 [STUB] Списано ${amount} кредитов для ${organizationId}. Новый баланс: ${newBalance}`);
        // TODO: Сохранить транзакцию в БД
        this.logTransaction(organizationId, amount, 'debit', description);
        return true;
    }
    /**
     * Пополнение кредитов
     */
    async creditCredits(organizationId, amount, description = 'Credits purchase') {
        const currentBalance = await this.checkBalance(organizationId);
        const newBalance = currentBalance + amount;
        // Заглушка: обновляем баланс в памяти
        this.balances.set(organizationId, newBalance);
        console.log(`🔧 [STUB] Пополнено ${amount} кредитов для ${organizationId}. Новый баланс: ${newBalance}`);
        // TODO: Сохранить транзакцию в БД
        this.logTransaction(organizationId, amount, 'credit', description);
        return true;
    }
    /**
     * Получение истории транзакций (заглушка)
     */
    async getTransactionHistory(organizationId, limit = 10) {
        console.log(`🔧 [STUB] Запрос истории транзакций для ${organizationId} (лимит: ${limit})`);
        // Заглушка: возвращаем пустой массив
        // TODO: Реальный запрос к БД
        return [];
    }
    /**
     * Получение информации о балансе
     */
    async getBalanceInfo(organizationId) {
        const balance = await this.checkBalance(organizationId);
        return {
            organizationId,
            balance,
            lastUpdated: new Date()
        };
    }
    /**
     * Логирование транзакции (заглушка)
     */
    logTransaction(organizationId, amount, type, description) {
        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            organizationId,
            amount,
            type,
            description,
            createdAt: new Date()
        };
        console.log(`🔧 [STUB] Транзакция логирована:`, transaction);
        // TODO: Сохранить в БД
    }
    /**
     * Сброс балансов (для тестирования)
     */
    async resetBalances() {
        this.balances.clear();
        this.balances.set('default', 1000);
        console.log('🔧 [STUB] Балансы кредитов сброшены');
    }
}
exports.CreditsService = CreditsService;
// Экспорт singleton instance
exports.creditsService = CreditsService.getInstance();
