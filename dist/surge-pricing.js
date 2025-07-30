"use strict";
/**
 * Surge Pricing Service - управление ценообразованием в пиковые периоды
 * Реализует логику повышения цен в период 15-30 июня
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.surgePricingService = exports.SurgePricingService = void 0;
/**
 * Сервис управления surge-pricing
 */
class SurgePricingService {
    constructor() {
        this.config = {
            surgeMonth: 6, // июнь
            surgeStartDay: 15,
            surgeEndDay: 30,
            surgeMultiplier: 2,
            normalMultiplier: 1
        };
        console.log('🔧 [STUB] Surge Pricing Service инициализирован');
    }
    static getInstance() {
        if (!SurgePricingService.instance) {
            SurgePricingService.instance = new SurgePricingService();
        }
        return SurgePricingService.instance;
    }
    /**
     * Проверка, активен ли surge период
     */
    isSurgePeriod(date = new Date()) {
        const month = date.getMonth() + 1; // 0-based, поэтому +1
        const day = date.getDate();
        const isSurge = month === this.config.surgeMonth &&
            day >= this.config.surgeStartDay &&
            day <= this.config.surgeEndDay;
        if (isSurge) {
            console.log(`🔧 [STUB] Surge период активен: ${day} ${this.getMonthName(month)}`);
        }
        else {
            console.log(`🔧 [STUB] Surge период неактивен: ${day} ${this.getMonthName(month)}`);
        }
        return isSurge;
    }
    /**
     * Получение множителя цены
     */
    getSurgeMultiplier(date = new Date()) {
        const multiplier = this.isSurgePeriod(date) ?
            this.config.surgeMultiplier :
            this.config.normalMultiplier;
        console.log(`🔧 [STUB] Множитель цены: x${multiplier}`);
        return multiplier;
    }
    /**
     * Получение приоритета задачи на основе surge периода
     */
    getJobPriority(date = new Date()) {
        const priority = this.isSurgePeriod(date) ? 'high' : 'normal';
        console.log(`🔧 [STUB] Приоритет задачи: ${priority}`);
        return priority;
    }
    /**
     * Расчет стоимости с учетом surge-pricing
     */
    calculatePrice(basePrice, date = new Date()) {
        const multiplier = this.getSurgeMultiplier(date);
        const finalPrice = basePrice * multiplier;
        console.log(`🔧 [STUB] Расчет цены: ${basePrice} x ${multiplier} = ${finalPrice}`);
        return finalPrice;
    }
    /**
     * Получение полной информации о surge-pricing
     */
    getSurgePricingInfo(date = new Date()) {
        const isSurge = this.isSurgePeriod(date);
        const multiplier = this.getSurgeMultiplier(date);
        // Создаем даты начала и конца surge периода для текущего года
        const year = date.getFullYear();
        const startDate = new Date(year, this.config.surgeMonth - 1, this.config.surgeStartDay);
        const endDate = new Date(year, this.config.surgeMonth - 1, this.config.surgeEndDay);
        return {
            isSurge,
            multiplier,
            period: isSurge ? 'surge' : 'normal',
            startDate,
            endDate
        };
    }
    /**
     * Получение времени до начала/конца surge периода
     */
    getTimeToSurgeChange(date = new Date()) {
        const year = date.getFullYear();
        const surgeStart = new Date(year, this.config.surgeMonth - 1, this.config.surgeStartDay);
        const surgeEnd = new Date(year, this.config.surgeMonth - 1, this.config.surgeEndDay);
        if (this.isSurgePeriod(date)) {
            // Surge активен, считаем до конца
            const daysToEnd = Math.ceil((surgeEnd.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            return {
                type: 'end',
                daysRemaining: daysToEnd,
                targetDate: surgeEnd
            };
        }
        else {
            // Surge неактивен, считаем до начала
            let targetStart = surgeStart;
            // Если surge период уже прошел в этом году, считаем до следующего года
            if (date > surgeEnd) {
                targetStart = new Date(year + 1, this.config.surgeMonth - 1, this.config.surgeStartDay);
            }
            const daysToStart = Math.ceil((targetStart.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            return {
                type: 'start',
                daysRemaining: daysToStart,
                targetDate: targetStart
            };
        }
    }
    /**
     * Получение сообщения для пользователя о surge-pricing
     */
    getUserMessage(date = new Date()) {
        const info = this.getSurgePricingInfo(date);
        const timeInfo = this.getTimeToSurgeChange(date);
        if (info.isSurge) {
            return `⚡ Период повышенной нагрузки! Стоимость увеличена в ${info.multiplier} раза. Осталось ${timeInfo.daysRemaining} дней до окончания.`;
        }
        else {
            if (timeInfo.type === 'start') {
                return `💡 До периода повышенной нагрузки осталось ${timeInfo.daysRemaining} дней. Рекомендуем обработать документы заранее.`;
            }
            else {
                return `✅ Обычный период. Стандартная стоимость обработки.`;
            }
        }
    }
    /**
     * Обновление конфигурации surge-pricing
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 [STUB] Конфигурация surge-pricing обновлена:', this.config);
    }
    /**
     * Получение текущей конфигурации
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Вспомогательный метод для получения названия месяца
     */
    getMonthName(month) {
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return months[month - 1] || 'неизвестно';
    }
}
exports.SurgePricingService = SurgePricingService;
// Экспорт singleton instance
exports.surgePricingService = SurgePricingService.getInstance();
