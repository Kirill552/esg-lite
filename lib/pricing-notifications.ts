/**
 * Pricing Notification Service
 * Задача 5.3: Создать систему уведомлений о ценах
 * 
 * Управляет уведомлениями о ценах, включая surge pricing, 
 * скидки и изменения тарифов
 */

import { surgePricingService } from '@/lib/surge-pricing';

export interface PricingNotification {
  id: string;
  type: 'surge_start' | 'surge_end' | 'discount' | 'price_change' | 'low_credits';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  actionText?: string;
  actionUrl?: string;
  validFrom: Date;
  validUntil?: Date;
  dismissible: boolean;
  showInBanner: boolean;
  sendEmail: boolean;
}

export interface PricingBannerInfo {
  show: boolean;
  type: 'surge_active' | 'surge_ending' | 'normal_pricing' | 'discount';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  actionText?: string;
  actionUrl?: string;
  countdown?: {
    endDate: Date;
    message: string;
  };
}

export interface CurrentPricingStatus {
  isSurgeActive: boolean;
  baseMultiplier: number;
  currentMultiplier: number;
  surgeReason?: string;
  bannerInfo: PricingBannerInfo;
  notifications: PricingNotification[];
  priceChange: {
    hasChanged: boolean;
    previousPrice: number;
    currentPrice: number;
    changePercent: number;
  };
}

class PricingNotificationService {
  /**
   * Получить текущий статус ценообразования с уведомлениями
   */
  async getCurrentPricingStatus(date: Date = new Date()): Promise<CurrentPricingStatus> {
    const isSurgeActive = surgePricingService.isSurgePeriod(date);
    const currentMultiplier = surgePricingService.getSurgeMultiplier(date);
    const surgeReason = 'Высокий сезон отчетности (15-30 июня)';
    
    // Базовые цены (в кредитах за тонну CO₂)
    const basePrice = 5; // 5 ₽/т CO₂
    const currentPrice = basePrice * currentMultiplier;
    
    // Создаем объект совместимый с surgePricingInfo
    const surgePricingInfo = {
      isActive: isSurgeActive,
      multiplier: currentMultiplier,
      reason: surgeReason
    };
    
    // Информация о баннере
    const bannerInfo = this.generateBannerInfo(surgePricingInfo, date);
    
    // Активные уведомления
    const notifications = await this.getActiveNotifications(date);
    
    return {
      isSurgeActive,
      baseMultiplier: 1,
      currentMultiplier,
      surgeReason,
      bannerInfo,
      notifications,
      priceChange: {
        hasChanged: currentMultiplier !== 1,
        previousPrice: basePrice,
        currentPrice,
        changePercent: ((currentPrice - basePrice) / basePrice) * 100
      }
    };
  }

  /**
   * Генерировать информацию для баннера
   */
  private generateBannerInfo(surgePricingInfo: any, date: Date): PricingBannerInfo {
    if (surgePricingInfo.isActive) {
      // Surge период активен
      const surgeEnd = new Date(date.getFullYear(), 5, 30); // 30 июня
      const daysLeft = Math.ceil((surgeEnd.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 3) {
        return {
          show: true,
          type: 'surge_ending',
          title: '⏰ Surge pricing заканчивается!',
          message: `Повышенные тарифы ×${surgePricingInfo.multiplier} действуют еще ${daysLeft} дня(ей). Успейте воспользоваться сервисом по текущим ценам.`,
          severity: 'warning',
          actionText: 'Загрузить документ',
          actionUrl: '/upload',
          countdown: {
            endDate: surgeEnd,
            message: 'до окончания surge pricing'
          }
        };
      } else {
        return {
          show: true,
          type: 'surge_active',
          title: '📈 Активен surge pricing',
          message: `В связи с высоким сезоном отчетности действуют повышенные тарифы ×${surgePricingInfo.multiplier}. ${surgePricingInfo.reason}`,
          severity: 'info',
          actionText: 'Подробнее о ценах',
          actionUrl: '/pricing'
        };
      }
    } else {
      // Проверяем, не начинается ли surge скоро
      const surgeStart = new Date(date.getFullYear(), 5, 15); // 15 июня
      const daysUntilSurge = Math.ceil((surgeStart.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilSurge <= 7 && daysUntilSurge > 0) {
        return {
          show: true,
          type: 'discount',
          title: '💰 Скидка 50% до surge pricing!',
          message: `Обработайте документы сейчас по базовым тарифам. Через ${daysUntilSurge} дня(ей) начнется surge pricing ×2.`,
          severity: 'success',
          actionText: 'Загрузить сейчас',
          actionUrl: '/upload',
          countdown: {
            endDate: surgeStart,
            message: 'до начала surge pricing'
          }
        };
      } else {
        return {
          show: false,
          type: 'normal_pricing',
          title: 'Обычные тарифы',
          message: 'Действуют стандартные тарифы на обработку документов.',
          severity: 'info'
        };
      }
    }
  }

  /**
   * Получить активные уведомления
   */
  private async getActiveNotifications(date: Date): Promise<PricingNotification[]> {
    const notifications: PricingNotification[] = [];
    const isSurgeActive = surgePricingService.isSurgePeriod(date);
    const currentMultiplier = surgePricingService.getSurgeMultiplier(date);
    
    // Уведомление о surge pricing
    if (isSurgeActive) {
      notifications.push({
        id: 'surge-active',
        type: 'surge_start',
        title: 'Активен surge pricing',
        message: `Тарифы повышены в ${currentMultiplier}x раза до 30 июня в связи с высоким сезоном отчетности.`,
        severity: 'warning',
        actionText: 'Узнать подробности',
        actionUrl: '/pricing',
        validFrom: new Date(date.getFullYear(), 5, 15),
        validUntil: new Date(date.getFullYear(), 5, 30),
        dismissible: true,
        showInBanner: true,
        sendEmail: true
      });
    }

    // Уведомление о скидке перед surge
    const surgeStart = new Date(date.getFullYear(), 5, 15);
    const daysUntilSurge = Math.ceil((surgeStart.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilSurge <= 7 && daysUntilSurge > 0) {
      notifications.push({
        id: 'pre-surge-discount',
        type: 'discount',
        title: 'Последние дни обычных тарифов!',
        message: `Через ${daysUntilSurge} дня(ей) начнется surge pricing. Обработайте документы сейчас по базовым ценам.`,
        severity: 'success',
        actionText: 'Загрузить документ',
        actionUrl: '/upload',
        validFrom: new Date(date.getFullYear(), 5, 8),
        validUntil: new Date(date.getFullYear(), 5, 15),
        dismissible: true,
        showInBanner: true,
        sendEmail: true
      });
    }

    return notifications;
  }

  /**
   * Получить информацию для email уведомлений
   */
  async getEmailNotifications(userId: string, date: Date = new Date()): Promise<PricingNotification[]> {
    const allNotifications = await this.getActiveNotifications(date);
    return allNotifications.filter(notification => notification.sendEmail);
  }

  /**
   * Проверить, нужно ли отправить email уведомление
   */
  async shouldSendEmailNotification(
    userId: string, 
    notificationType: PricingNotification['type'],
    date: Date = new Date()
  ): Promise<boolean> {
    // Здесь можно добавить логику проверки, 
    // отправлялось ли уже уведомление пользователю
    // Для MVP возвращаем true
    return true;
  }

  /**
   * Отметить уведомление как отправленное
   */
  async markNotificationAsSent(
    userId: string,
    notificationId: string,
    date: Date = new Date()
  ): Promise<void> {
    // Здесь можно добавить сохранение в БД
    // информации о отправленных уведомлениях
    console.log(`📧 Уведомление ${notificationId} отправлено пользователю ${userId}`);
  }

  /**
   * Получить сводку по изменениям цен
   */
  async getPricingSummary(date: Date = new Date()) {
    const status = await this.getCurrentPricingStatus(date);
    
    return {
      current: {
        basePrice: 5,
        currentPrice: 5 * status.currentMultiplier,
        multiplier: status.currentMultiplier,
        currency: 'RUB',
        unit: 'т CO₂'
      },
      surge: {
        isActive: status.isSurgeActive,
        reason: status.surgeReason,
        startDate: new Date(date.getFullYear(), 5, 15),
        endDate: new Date(date.getFullYear(), 5, 30)
      },
      banner: status.bannerInfo,
      hasActiveNotifications: status.notifications.length > 0
    };
  }
}

// Экспортируем singleton
export const pricingNotificationService = new PricingNotificationService();
export default pricingNotificationService;
