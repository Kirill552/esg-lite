/**
 * Subscription Service - система управления тарифами ESG-Lite
 * Новая модель монетизации 2025
 * Интеграция с системой базовых платежей и переменной ставкой за тонну
 */

import { prisma } from './prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { CreditsService } from './credits-service';
import { 
  calculatePricing, 
  determinePlanByEmissions,
  getPlanDetails,
  isSurgePeriodActive,
  type PricingCalculation 
} from './monetization-config';

export interface SubscriptionInfo {
  id: string;
  organizationId: string;
  planType: 'TRIAL' | 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE';
  status: SubscriptionStatus;
  annualEmissions: number;
  hasCbamAddon: boolean;
  pricing: PricingCalculation;
  startsAt?: Date;
  expiresAt?: Date;
  autoRenew: boolean;
  finalPrice: number;
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionRequest {
  organizationId: string;
  annualEmissions: number;
  hasCbamAddon?: boolean;
  durationMonths?: number;
  autoRenew?: boolean;
  startDate?: Date;
}

export interface SubscriptionPlanInfo {
  planType: SubscriptionPlan;
  name: string;
  description: string;
  priceRub: number;
  durationMonths: number;
  creditsIncluded: number; // Кредиты в тоннах CO₂
  features: string[];
}

export interface ActivateSubscriptionResult {
  success: boolean;
  subscription?: SubscriptionInfo;
  creditsAdded?: number;
  error?: string;
}

export class SubscriptionService {
  private creditsService: CreditsService;

  // Планы подписок с ценами и характеристиками
  private readonly SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanInfo> = {
    [SubscriptionPlan.FREE]: {
      planType: SubscriptionPlan.FREE,
      name: 'Бесплатный пробный план',
      description: 'Базовая функциональность с ограничениями',
      priceRub: 0,
      durationMonths: 0,
      creditsIncluded: 1000, // 1000 т CO₂ бесплатно
      features: [
        'До 1000 т CO₂ бесплатно',
        'Базовая обработка документов',
        'Ограниченное количество запросов'
      ]
    },
    [SubscriptionPlan.TRIAL]: {
      planType: SubscriptionPlan.TRIAL,
      name: 'Пробный план (14 дней)',
      description: 'Полный доступ на 14 дней',
      priceRub: 0,
      durationMonths: 0, // 14 дней
      creditsIncluded: 0,
      features: [
        '14 дней полного доступа',
        '1 отчёт до 200 МБ',
        'Все функции платформы'
      ]
    },
    [SubscriptionPlan.LITE]: {
      planType: SubscriptionPlan.LITE,
      name: 'План "Лайт"',
      description: 'Для предприятий с выбросами 50-150 тыс. тонн CO₂',
      priceRub: 75000, // Базовый платёж
      durationMonths: 12,
      creditsIncluded: 0, // Рассчитывается по формуле
      features: [
        'Базовый платёж 75 000 ₽/год',
        'Дополнительно 1,5 ₽ за тонну CO₂',
        'Автоматический расчёт отчётности',
        'Техническая поддержка',
        'Интеграция с ГИС Экология'
      ]
    },
    [SubscriptionPlan.STANDARD]: {
      planType: SubscriptionPlan.STANDARD,
      name: 'План "Стандарт"',
      description: 'Для предприятий с выбросами 150к-1М тонн CO₂',
      priceRub: 150000, // Базовый платёж
      durationMonths: 12,
      creditsIncluded: 0, // Рассчитывается по формуле
      features: [
        'Базовый платёж 150 000 ₽/год',
        'Дополнительно 0,32 ₽ за тонну CO₂',
        'Приоритетная поддержка',
        'Модуль 1С-ESG коннектор',
        'Расширенная аналитика',
        'API доступ'
      ]
    },
    [SubscriptionPlan.LARGE]: {
      planType: SubscriptionPlan.LARGE,
      name: 'План "Крупный"',
      description: 'Для крупных предприятий с выбросами 1-3М тонн CO₂',
      priceRub: 250000, // Базовый платёж
      durationMonths: 12,
      creditsIncluded: 0, // Рассчитывается по формуле
      features: [
        'Базовый платёж 250 000 ₽/год',
        'Дополнительно 0,33 ₽ за тонну CO₂',
        'Персональный менеджер',
        'Все интеграции (1С, СБИС, Контур)',
        'Белый лейбл решения',
        'SLA 99.9%'
      ]
    },
    [SubscriptionPlan.CBAM_ADDON]: {
      planType: SubscriptionPlan.CBAM_ADDON,
      name: 'Модуль CBAM',
      description: 'Дополнительный модуль для экспортёров в ЕС',
      priceRub: 15000, // Годовая подписка
      durationMonths: 12,
      creditsIncluded: 0, // 255 ₽ за тонну дополнительно
      features: [
        'Годовая подписка 15 000 ₽',
        'Дополнительно 255 ₽ за тонну импорта',
        'CBAM отчеты по стандартам ЕС',
        'Поддержка EUR валюты',
        'Специализированные шаблоны',
        'Интеграция с EU ETS'
      ]
    }
  };

  constructor() {
    this.creditsService = new CreditsService();
  }

  /**
   * Преобразовать тип плана из новой модели в Prisma enum
   */
  private mapPlanTypeToPrisma(planType: 'TRIAL' | 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE'): SubscriptionPlan {
    switch (planType) {
      case 'TRIAL':
        return SubscriptionPlan.TRIAL;
      case 'LITE':
        return SubscriptionPlan.LITE;
      case 'STANDARD':
        return SubscriptionPlan.STANDARD;
      case 'LARGE':
        return SubscriptionPlan.LARGE;
      case 'ENTERPRISE':
        return SubscriptionPlan.LARGE; // ENTERPRISE использует LARGE plan в БД
      default:
        return SubscriptionPlan.FREE;
    }
  }

  /**
   * Преобразовать Prisma enum в тип новой модели
   */
  private mapPrismaTypeToPlan(planType: SubscriptionPlan): 'TRIAL' | 'LITE' | 'STANDARD' | 'LARGE' {
    switch (planType) {
      case SubscriptionPlan.TRIAL:
        return 'TRIAL';
      case SubscriptionPlan.LITE:
        return 'LITE';
      case SubscriptionPlan.STANDARD:
        return 'STANDARD';
      case SubscriptionPlan.LARGE:
        return 'LARGE';
      default:
        return 'TRIAL';
    }
  }

  /**
   * Получить информацию о доступных планах подписки
   */
  getAvailablePlans(): SubscriptionPlanInfo[] {
    return Object.values(this.SUBSCRIPTION_PLANS);
  }

  /**
   * Получить информацию о конкретном плане
   */
  getPlanInfo(planType: 'TRIAL' | 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE' | 'CBAM_ADDON'): SubscriptionPlanInfo | null {
    // Для ENTERPRISE используем LARGE план как базу
    const effectivePlanType = planType === 'ENTERPRISE' ? 'LARGE' : planType;
    const prismaPlanType = this.mapPlanTypeToPrisma(effectivePlanType as any);
    return this.SUBSCRIPTION_PLANS[prismaPlanType] || null;
  }

  /**
   * Получить активную подписку организации
   */
  async getActiveSubscription(organizationId: string): Promise<SubscriptionInfo | null> {
    try {
      const subscription = await prisma.organization_subscriptions.findFirst({
        where: {
          organizationId,
          status: SubscriptionStatus.ACTIVE,
          OR: [
            { expires_at: null }, // Бессрочная тариф
            { expires_at: { gt: new Date() } } // Не истекшая
          ]
        }
      });

      if (!subscription) {
        return null;
      }

      return this.mapToSubscriptionInfo(subscription);
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw new Error(`Failed to get active subscription for organization ${organizationId}`);
    }
  }

  /**
   * Создать новую подписку на основе годовых выбросов
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionInfo> {
    try {
      // Определяем план автоматически на основе выбросов
      const planType = determinePlanByEmissions(request.annualEmissions);
      const pricing = calculatePricing(
        request.annualEmissions, 
        request.hasCbamAddon || false,
        request.startDate || new Date()
      );

      // Проверить, нет ли уже активной подписки
      const existingSubscription = await this.getActiveSubscription(request.organizationId);
      if (existingSubscription) {
        throw new Error(`Organization ${request.organizationId} already has an active subscription`);
      }

      const now = request.startDate || new Date();
      const durationMonths = request.durationMonths || 12;
      const expiresAt = durationMonths > 0 
        ? new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)
        : null;

      const subscription = await prisma.organization_subscriptions.create({
        data: {
          organizationId: request.organizationId,
          plan_type: this.mapPlanTypeToPrisma(planType),
          status: SubscriptionStatus.PENDING, // Начинаем с PENDING до активации
          starts_at: now,
          expires_at: expiresAt,
          auto_renew: request.autoRenew ?? false,
          price_rub: pricing.finalPrice,
          annual_emissions: request.annualEmissions,
          has_cbam_addon: request.hasCbamAddon || false,
        }
      });

      return {
        id: subscription.id,
        organizationId: subscription.organizationId,
        planType: planType,
        status: subscription.status,
        annualEmissions: request.annualEmissions,
        hasCbamAddon: request.hasCbamAddon || false,
        pricing,
        startsAt: subscription.starts_at || undefined,
        expiresAt: subscription.expires_at || undefined,
        autoRenew: subscription.auto_renew,
        finalPrice: pricing.finalPrice,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Активировать подписку и начислить кредиты
   */
  async activateSubscription(subscriptionId: string): Promise<ActivateSubscriptionResult> {
    try {
      const subscription = await prisma.organization_subscriptions.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.status === SubscriptionStatus.ACTIVE) {
        return { success: false, error: 'Subscription is already active' };
      }

      const planInfo = this.getPlanInfo(this.mapPrismaTypeToPlan(subscription.plan_type));
      if (!planInfo) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Обновить статус подписки на ACTIVE
      const updatedSubscription = await prisma.organization_subscriptions.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          starts_at: new Date()
        }
      });

      // Начислить кредиты, если они включены в план
      let creditsAdded = 0;
      if (planInfo.creditsIncluded > 0) {
        await this.creditsService.creditCredits(
          subscription.organizationId,
          planInfo.creditsIncluded,
          `Кредиты за активацию подписки ${planInfo.name}`,
          'SUBSCRIPTION', // CreditTransactionType
          { subscriptionId, planType: subscription.plan_type }
        );
        creditsAdded = planInfo.creditsIncluded;
      }

      // Обновить planType в organization_credits для совместимости
      await this.updateOrganizationPlanType(subscription.organizationId, subscription.plan_type);

      return {
        success: true,
        subscription: this.mapToSubscriptionInfo(updatedSubscription),
        creditsAdded
      };
    } catch (error) {
      console.error('Error activating subscription:', error);
      return { 
        success: false, 
        error: `Failed to activate subscription: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Продлить подписку
   */
  async renewSubscription(organizationId: string): Promise<ActivateSubscriptionResult> {
    try {
      const activeSubscription = await this.getActiveSubscription(organizationId);
      if (!activeSubscription) {
        return { success: false, error: 'No active subscription found' };
      }

      const planInfo = this.getPlanInfo(activeSubscription.planType);
      if (!planInfo) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Продлить подписку
      const newExpiresAt = activeSubscription.expiresAt 
        ? new Date(activeSubscription.expiresAt.getTime() + planInfo.durationMonths * 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + planInfo.durationMonths * 30 * 24 * 60 * 60 * 1000);

      const renewedSubscription = await prisma.organization_subscriptions.update({
        where: { id: activeSubscription.id },
        data: {
          expires_at: newExpiresAt,
          updatedAt: new Date()
        }
      });

      // Начислить кредиты за продление
      let creditsAdded = 0;
      if (planInfo.creditsIncluded > 0) {
        await this.creditsService.creditCredits(
          organizationId,
          planInfo.creditsIncluded,
          `Кредиты за продление подписки ${planInfo.name}`,
          'SUBSCRIPTION', // CreditTransactionType
          { subscriptionId: activeSubscription.id, planType: activeSubscription.planType, renewal: true }
        );
        creditsAdded = planInfo.creditsIncluded;
      }

      return {
        success: true,
        subscription: this.mapToSubscriptionInfo(renewedSubscription),
        creditsAdded
      };
    } catch (error) {
      console.error('Error renewing subscription:', error);
      return { 
        success: false, 
        error: `Failed to renew subscription: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Отменить подписку
   */
  async cancelSubscription(organizationId: string): Promise<boolean> {
    try {
      const activeSubscription = await this.getActiveSubscription(organizationId);
      if (!activeSubscription) {
        return false;
      }

      await prisma.organization_subscriptions.update({
        where: { id: activeSubscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          auto_renew: false,
          updatedAt: new Date()
        }
      });

      // Обновить planType обратно на FREE
      await this.updateOrganizationPlanType(organizationId, SubscriptionPlan.FREE);

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  /**
   * Проверить, истекли ли подписки и обновить их статус
   */
  async processExpiredSubscriptions(): Promise<number> {
    try {
      const expiredSubscriptions = await prisma.organization_subscriptions.updateMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          expires_at: {
            lt: new Date()
          }
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
          updatedAt: new Date()
        }
      });

      // Обновить planType для истекших подписок
      if (expiredSubscriptions.count > 0) {
        const expiredOrgs = await prisma.organization_subscriptions.findMany({
          where: {
            status: SubscriptionStatus.EXPIRED,
            updatedAt: {
              gte: new Date(Date.now() - 5000) // Только что обновленные
            }
          },
          select: { organizationId: true }
        });

        for (const org of expiredOrgs) {
          await this.updateOrganizationPlanType(org.organizationId, SubscriptionPlan.FREE);
        }
      }

      return expiredSubscriptions.count;
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
      return 0;
    }
  }

  /**
   * Получить историю подписок организации
   */
  async getSubscriptionHistory(organizationId: string): Promise<SubscriptionInfo[]> {
    try {
      const subscriptions = await prisma.organization_subscriptions.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });

      return subscriptions.map(sub => this.mapToSubscriptionInfo(sub));
    } catch (error) {
      console.error('Error getting subscription history:', error);
      throw new Error(`Failed to get subscription history for organization ${organizationId}`);
    }
  }

  /**
   * Обновить planType в organization_credits для совместимости
   */
  private async updateOrganizationPlanType(organizationId: string, planType: SubscriptionPlan): Promise<void> {
    try {
      await prisma.organization_credits.upsert({
        where: { organizationId },
        update: { planType: planType.toString() },
        create: {
          organizationId,
          planType: planType.toString(),
          balance: 1000,
          totalPurchased: 1000,
          totalUsed: 0,
          balance_t_co2: 1000
        }
      });
    } catch (error) {
      console.error('Error updating organization plan type:', error);
      // Не выбрасываем ошибку, чтобы не ломать основной процесс
    }
  }

  /**
   * Преобразовать данные БД в SubscriptionInfo
   */
  private mapToSubscriptionInfo(subscription: any): SubscriptionInfo {
    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      planType: this.mapPrismaTypeToPlan(subscription.plan_type),
      status: subscription.status,
      annualEmissions: subscription.annual_emissions || 0,
      hasCbamAddon: subscription.has_cbam_addon || false,
      pricing: {
        planType: this.mapPrismaTypeToPlan(subscription.plan_type),
        basePrice: subscription.price_rub ? Number(subscription.price_rub) : 0,
        surgeMultiplier: 1,
        finalPrice: subscription.price_rub ? Number(subscription.price_rub) : 0,
        emissions: subscription.annual_emissions || 0,
        currency: 'RUB',
        period: 'YEAR',
        hasCbamAddon: subscription.has_cbam_addon || false,
      },
      startsAt: subscription.starts_at,
      expiresAt: subscription.expires_at,
      autoRenew: subscription.auto_renew,
      finalPrice: subscription.price_rub ? Number(subscription.price_rub) : 0,
      features: subscription.features,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };
  }
}
