/**
 * Surge Pricing Service - динамическое ценообразование ESG-Lite
 * Задача 5.1: Создать Surge Pricing Service
 * Требования: 1.4 Surge-pricing - кредит ×2 в период 15-30 июня
 */

export interface SurgePricingConfig {
  enabled: boolean;
  surgeStartDate: Date;
  surgeEndDate: Date;
  multiplier: number;
  reason: string;
}

export interface SurgePricingStatus {
  isActive: boolean;
  multiplier: number;
  reason: string;
  startDate?: Date;
  endDate?: Date;
  timeRemaining?: string;
}

export interface SurgePricingNotification {
  type: 'start' | 'end' | 'reminder';
  message: string;
  timestamp: Date;
  isActive: boolean;
  daysRemaining?: number;
}

export class SurgePricingService {
  private config: SurgePricingConfig;

  constructor() {
    // Настройка surge pricing для периода 15-30 июня
    const currentYear = new Date().getFullYear();
    this.config = {
      enabled: true,
      surgeStartDate: new Date(currentYear, 5, 15), // 15 июня (месяц 5 = июнь)
      surgeEndDate: new Date(currentYear, 5, 30, 23, 59, 59, 999), // 30 июня до конца дня
      multiplier: 2.0, // ×2 согласно требованиям 1.4
      reason: 'Высокий сезон отчетности (15-30 июня)'
    };
  }

  /**
   * Получить даты surge периода для указанного года
   */
  private getSurgeDates(year: number): { start: Date; end: Date } {
    return {
      start: new Date(year, 5, 15), // 15 июня 00:00:00
      end: new Date(year, 5, 30, 23, 59, 59, 999) // 30 июня 23:59:59.999
    };
  }

  /**
   * Проверить, активен ли период surge pricing
   */
  isSurgePeriod(date: Date = new Date()): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const checkDate = new Date(date);
    const { start, end } = this.getSurgeDates(checkDate.getFullYear());
    
    return checkDate >= start && checkDate <= end;
  }

  /**
   * Получить множитель для surge pricing
   */
  getSurgeMultiplier(date: Date = new Date()): number {
    if (this.isSurgePeriod(date)) {
      return this.config.multiplier; // 2.0x в surge период
    }
    return 1.0; // Обычная цена
  }

  /**
   * Получить статус surge pricing
   */
  getSurgePricingStatus(date: Date = new Date()): SurgePricingStatus {
    const isActive = this.isSurgePeriod(date);
    const { start: surgeStart, end: surgeEnd } = this.getSurgeDates(date.getFullYear());

    // Для статуса возвращаем обычную дату без времени
    const statusStartDate = new Date(date.getFullYear(), 5, 15);
    const statusEndDate = new Date(date.getFullYear(), 5, 30);

    let timeRemaining: string | undefined;
    if (isActive) {
      // Простой расчет дней: разница между датами
      const daysDiff = 30 - date.getDate(); 
      const daysRemaining = daysDiff > 0 ? daysDiff : 1;
      timeRemaining = `${daysRemaining} дней до окончания`;
    }

    return {
      isActive,
      multiplier: isActive ? this.config.multiplier : 1.0,
      reason: isActive ? this.config.reason : 'Обычное ценообразование',
      startDate: isActive ? statusStartDate : undefined,
      endDate: isActive ? statusEndDate : undefined,
      timeRemaining
    };
  }

  /**
   * Получить уведомление о surge pricing
   */
  getSurgePricingNotification(date: Date = new Date()): SurgePricingNotification | null {
    const { start: surgeStart, end: surgeEnd } = this.getSurgeDates(date.getFullYear());
    const checkDate = new Date(date);
    
    const isActive = this.isSurgePeriod(date);
    
    if (isActive) {
      // Простой расчет дней: разница между датами
      const daysDiff = 30 - checkDate.getDate();
      const daysRemaining = daysDiff > 0 ? daysDiff : 1;
      
      if (daysRemaining <= 3) {
        return {
          type: 'reminder',
          message: `⚡ Surge pricing активен! Кредиты стоят ×${this.config.multiplier}. Осталось ${daysRemaining} дней.`,
          timestamp: checkDate,
          isActive: true,
          daysRemaining
        };
      }
      
      return {
        type: 'start',
        message: `⚡ Период surge pricing активен до ${surgeEnd.toLocaleDateString('ru-RU')}. Стоимость кредитов увеличена в ${this.config.multiplier} раза.`,
        timestamp: checkDate,
        isActive: true,
        daysRemaining
      };
    }
    
    // Проверяем, скоро ли начнется surge период
    const msToStart = surgeStart.getTime() - checkDate.getTime();
    const daysToStart = Math.ceil(msToStart / (1000 * 60 * 60 * 24));
    
    if (daysToStart > 0 && daysToStart <= 7) {
      return {
        type: 'reminder',
        message: `💡 Surge pricing начнется через ${daysToStart} дней (${surgeStart.toLocaleDateString('ru-RU')}). Рекомендуем пополнить кредиты сейчас.`,
        timestamp: checkDate,
        isActive: false,
        daysRemaining: daysToStart
      };
    }
    
    return null; // Нет активных уведомлений
  }

  /**
   * Рассчитать цену с учетом surge pricing
   */
  calculatePrice(basePrice: number, date: Date = new Date()): number {
    const multiplier = this.getSurgeMultiplier(date);
    return Math.ceil(basePrice * multiplier);
  }

  /**
   * Получить приоритет задачи на основе surge pricing
   */
  getJobPriority(date: Date = new Date()): 'normal' | 'high' {
    return this.isSurgePeriod(date) ? 'high' : 'normal';
  }

  /**
   * Получить информацию для баннера UI
   */
  getBannerInfo(date: Date = new Date()): { show: boolean; message: string; type: 'warning' | 'info' } | null {
    const { start: surgeStart, end: surgeEnd } = this.getSurgeDates(date.getFullYear());
    const checkDate = new Date(date);
    
    const isActive = this.isSurgePeriod(date);
    
    if (isActive) {
      const msRemaining = surgeEnd.getTime() - checkDate.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      
      return {
        show: true,
        message: `⚡ Surge период активен! Стоимость кредитов ×${this.config.multiplier}. Осталось ${daysRemaining} дней.`,
        type: 'warning'
      };
    }
    
    // Проверяем предупреждение о скором начале
    const msToStart = surgeStart.getTime() - checkDate.getTime();
    const daysToStart = Math.ceil(msToStart / (1000 * 60 * 60 * 24));
    
    if (daysToStart > 0 && daysToStart <= 7) {
      return {
        show: true,
        message: `💡 Скидка 15% до ${surgeStart.toLocaleDateString('ru-RU')}! Пополните кредиты сейчас.`,
        type: 'info'
      };
    }
    
    return null;
  }

  /**
   * Обновить конфигурацию surge pricing
   */
  updateConfig(newConfig: Partial<SurgePricingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Получить текущую конфигурацию
   */
  getConfig(): SurgePricingConfig {
    return { ...this.config };
  }

  /**
   * Проверить, будет ли surge pricing активен в указанном диапазоне дат
   */
  willBeSurgeActive(startDate: Date, endDate: Date): boolean {
    const currentYear = new Date().getFullYear();
    const { start: surgeStart, end: surgeEnd } = this.getSurgeDates(currentYear);

    // Проверяем пересечение диапазонов
    return startDate <= surgeEnd && endDate >= surgeStart;
  }

  /**
   * Получить дни до начала или окончания surge периода
   */
  getDaysToSurgeEvent(date: Date = new Date()): { event: 'start' | 'end' | 'none'; days: number } {
    const { start: surgeStart, end: surgeEnd } = this.getSurgeDates(date.getFullYear());
    const checkDate = new Date(date);
    
    if (this.isSurgePeriod(date)) {
      // Простой расчет дней: разница между датами
      const daysDiff = 30 - checkDate.getDate();
      const daysToEnd = daysDiff > 0 ? daysDiff : 1;
      return { event: 'end', days: daysToEnd };
    }
    
    const msToStart = surgeStart.getTime() - checkDate.getTime();
    const daysToStart = Math.ceil(msToStart / (1000 * 60 * 60 * 24));
    
    if (daysToStart > 0 && daysToStart <= 365) {
      return { event: 'start', days: daysToStart };
    }
    
    return { event: 'none', days: 0 };
  }

  /**
   * Получить все уведомления (для админов)
   */
  getNotifications(date: Date = new Date()): Array<{
    id: string;
    type: 'start' | 'reminder' | 'banner';
    message: string;
    created: Date;
    active: boolean;
  }> {
    const { start: surgeStart, end: surgeEnd } = this.getSurgeDates(date.getFullYear());
    const checkDate = new Date(date);
    const notifications = [];
    
    // Уведомление о начале
    const startNotification = {
      id: 'surge-start',
      type: 'start' as const,
      message: `🚀 Surge период начался! Повышенная стоимость кредитов ×${this.config.multiplier} до ${surgeEnd.toLocaleDateString('ru-RU')}.`,
      created: surgeStart,
      active: this.isSurgePeriod(date)
    };
    
    // Напоминание в середине периода
    const midDate = new Date(surgeStart.getTime() + (surgeEnd.getTime() - surgeStart.getTime()) / 2);
    const reminderNotification = {
      id: 'surge-reminder',
      type: 'reminder' as const,
      message: `⏰ Напоминание: Surge период активен еще несколько дней. Кредиты ×${this.config.multiplier}.`,
      created: midDate,
      active: this.isSurgePeriod(date) && checkDate >= midDate
    };
    
    // Баннер информация
    const bannerInfo = this.getBannerInfo(date);
    if (bannerInfo?.show) {
      notifications.push({
        id: 'surge-banner',
        type: 'banner' as const,
        message: bannerInfo.message,
        created: checkDate,
        active: true
      });
    }
    
    notifications.push(startNotification, reminderNotification);
    
    return notifications.filter(n => n.active);
  }
}

// Singleton instance для использования в приложении
export const surgePricingService = new SurgePricingService();