/**
 * Subscription Service - система управления тарифами ESG-Lite
 * Задача 3.1: Создать систему тарифов
 * Требования: 1.1 Annual Lite тариф 30-50k ₽/год, включает 1 000 т CO₂ кредитов
 */

import { prisma } from './prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { CreditsService } from './credits-service';

export interface SubscriptionInfo {
  id: string;
  organizationId: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  startsAt?: Date;
  expiresAt?: Date;
  autoRenew: boolean;
  priceRub?: number;
  features?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionRequest {
  organizationId: string;
  planType: SubscriptionPlan;
  durationMonths?: number; // По умолчанию 12 для LITE_ANNUAL
  autoRenew?: boolean;
  customPriceRub?: number;
  features?: any;
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
      name: 'Бесплатный план',
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
    [SubscriptionPlan.LITE_ANNUAL]: {
      planType: SubscriptionPlan.LITE_ANNUAL,
      name: 'Ежегодный LITE',
      description: 'Годовой тариф для средних предприятий',
      priceRub: 40000, // 30-50k ₽/год
      durationMonths: 12,
      creditsIncluded: 1000, // 1000 т CO₂ включено в тариф
      features: [
        '1000 т CO₂ кредитов включено',
        'Приоритетная обработка',
        'Увеличенные лимиты запросов',
        'Техническая поддержка',
        'Расширенная аналитика'
      ]
    },
    [SubscriptionPlan.CBAM_ADDON]: {
      planType: SubscriptionPlan.CBAM_ADDON,
      name: 'CBAM Add-on',
      description: 'Дополнительный модуль CBAM',
      priceRub: 15000, // ~3 EUR/т CO₂ * 5000 т * 85 ₽/EUR
      durationMonths: 12,
      creditsIncluded: 0, // CBAM оплачивается отдельно
      features: [
        'CBAM отчеты по строкам',
        'Поддержка EUR валюты',
        'Специализированные шаблоны',
        'Интеграция с EU ETS',
        'CBAM калькулятор'
      ]
    }
  };

  constructor() {
    this.creditsService = new CreditsService();
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
  getPlanInfo(planType: SubscriptionPlan): SubscriptionPlanInfo | null {
    return this.SUBSCRIPTION_PLANS[planType] || null;
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
   * Создать новую подписку
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionInfo> {
    try {
      const planInfo = this.getPlanInfo(request.planType);
      if (!planInfo) {
        throw new Error(`Invalid subscription plan: ${request.planType}`);
      }

      // Проверить, нет ли уже активной подписки
      const existingSubscription = await this.getActiveSubscription(request.organizationId);
      if (existingSubscription) {
        throw new Error(`Organization ${request.organizationId} already has an active subscription`);
      }

      const now = new Date();
      const durationMonths = request.durationMonths || planInfo.durationMonths;
      const expiresAt = durationMonths > 0 
        ? new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)
        : null;

      const subscription = await prisma.organization_subscriptions.create({
        data: {
          organizationId: request.organizationId,
          plan_type: request.planType,
          status: SubscriptionStatus.PENDING, // Начинаем с PENDING до активации
          starts_at: now,
          expires_at: expiresAt,
          auto_renew: request.autoRenew ?? false,
          price_rub: request.customPriceRub ?? planInfo.priceRub,
          features: request.features ?? planInfo.features
        }
      });

      return this.mapToSubscriptionInfo(subscription);
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

      const planInfo = this.getPlanInfo(subscription.plan_type);
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
      planType: subscription.plan_type,
      status: subscription.status,
      startsAt: subscription.starts_at,
      expiresAt: subscription.expires_at,
      autoRenew: subscription.auto_renew,
      priceRub: subscription.price_rub ? Number(subscription.price_rub) : undefined,
      features: subscription.features,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };
  }
}
