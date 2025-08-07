/**
 * Unit тесты для Subscription Service
 * Задача 3.1: Создать систему подписок
 */

import { SubscriptionService, SubscriptionPlanInfo } from '../../lib/subscription-service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { createMockSubscriptionInfo } from '../utils/subscription-mocks';
import { prisma } from '../../lib/prisma';
import { CreditsService } from '../../lib/credits-service';

// Mock Prisma Client
jest.mock('../../lib/prisma', () => ({
  prisma: {
    organization_subscriptions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    organization_credits: {
      upsert: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

// Mock CreditsService
jest.mock('../../lib/credits-service');

const mockedPrisma = {
  organization_subscriptions: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  },
  organization_credits: {
    upsert: jest.fn()
  },
  $transaction: jest.fn()
};
const mockedCreditsService = CreditsService as jest.MockedClass<typeof CreditsService>;

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockCreditsService: jest.Mocked<CreditsService>;

  const testOrganizationId = 'test-org-123';
  const testSubscriptionId = 'test-sub-456';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Переопределяем prisma для тестов
    Object.defineProperty(require('../../lib/prisma'), 'prisma', {
      value: mockedPrisma,
      writable: true
    });
    
    subscriptionService = new SubscriptionService();
    mockCreditsService = new mockedCreditsService() as jest.Mocked<CreditsService>;
    (subscriptionService as any).creditsService = mockCreditsService;
  });

  describe('getAvailablePlans', () => {
    it('должен возвращать все доступные планы подписки', () => {
      const plans = subscriptionService.getAvailablePlans();
      
      expect(plans).toHaveLength(3);
      expect(plans.map(p => p.planType)).toEqual([
        SubscriptionPlan.FREE,
        SubscriptionPlan.LITE,
        SubscriptionPlan.CBAM_ADDON
      ]);
    });

    it('должен возвращать корректную информацию о LITE плане', () => {
      const plans = subscriptionService.getAvailablePlans();
      const liteAnnual = plans.find(p => p.planType === SubscriptionPlan.LITE);
      
      expect(liteAnnual).toBeDefined();
      expect(liteAnnual!.name).toBe('Annual Lite');
      expect(liteAnnual!.priceRub).toBe(40000);
      expect(liteAnnual!.creditsIncluded).toBe(1000);
      expect(liteAnnual!.durationMonths).toBe(12);
    });
  });

  describe('getPlanInfo', () => {
    it('должен возвращать информацию о конкретном плане', () => {
      const planInfo = subscriptionService.getPlanInfo(SubscriptionPlan.LITE);
      
      expect(planInfo).toBeDefined();
      expect(planInfo!.planType).toBe(SubscriptionPlan.LITE);
      expect(planInfo!.priceRub).toBe(40000);
    });

    it('должен возвращать null для несуществующего плана', () => {
      const planInfo = subscriptionService.getPlanInfo('ENTERPRISE' as any);
      
      expect(planInfo).toBeNull();
    });
  });

  describe('getActiveSubscription', () => {
    it('должен возвращать активную подписку если она есть', async () => {
      const mockSubscription = {
        id: testSubscriptionId,
        organizationId: testOrganizationId,
        plan_type: SubscriptionPlan.LITE,
        status: SubscriptionStatus.ACTIVE,
        starts_at: new Date('2025-01-01'),
        expires_at: new Date('2026-01-01'),
        auto_renew: true,
        price_rub: 40000,
        features: ['feature1', 'feature2'],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.getActiveSubscription(testOrganizationId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(testSubscriptionId);
      expect(result!.planType).toBe(SubscriptionPlan.LITE);
      expect(result!.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('должен возвращать null если активной подписки нет', async () => {
      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(null);

      const result = await subscriptionService.getActiveSubscription(testOrganizationId);

      expect(result).toBeNull();
    });

    it('должен корректно обрабатывать ошибки БД', async () => {
      mockedPrisma.organization_subscriptions.findFirst.mockRejectedValue(new Error('DB Error'));

      await expect(subscriptionService.getActiveSubscription(testOrganizationId))
        .rejects.toThrow('Failed to get active subscription');
    });
  });

  describe('createSubscription', () => {
    it('должен создать новую подписку LITE', async () => {
      const mockCreatedSubscription = {
        id: testSubscriptionId,
        organizationId: testOrganizationId,
        plan_type: SubscriptionPlan.LITE,
        status: SubscriptionStatus.PENDING,
        starts_at: new Date(),
        expires_at: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
        auto_renew: false,
        price_rub: 40000,
        features: ['1000 т CO₂ кредитов включено'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock: нет активной подписки
      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(null);
      // Mock: создание подписки
      mockedPrisma.organization_subscriptions.create.mockResolvedValue(mockCreatedSubscription);

      const request = {
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.LITE,
        annualEmissions: 75000
      };

      const result = await subscriptionService.createSubscription(request);

      expect(result.planType).toBe(SubscriptionPlan.LITE);
      expect(result.status).toBe(SubscriptionStatus.PENDING);
      expect(result.finalPrice).toBeGreaterThan(0);
      expect(mockedPrisma.organization_subscriptions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: testOrganizationId,
          plan_type: SubscriptionPlan.LITE,
          status: SubscriptionStatus.PENDING,
          price_rub: 40000
        })
      });
    });

    it('должен отклонить создание если уже есть активная подписка', async () => {
      const existingSubscription = {
        id: 'existing-sub',
        organizationId: testOrganizationId,
        plan_type: SubscriptionPlan.LITE,
        status: SubscriptionStatus.ACTIVE,
        starts_at: new Date(),
        expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 месяцев
        auto_renew: false,
        price_rub: 40000,
        features: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(existingSubscription);

      const request = {
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.CBAM_ADDON,
        annualEmissions: 75000
      };

      await expect(subscriptionService.createSubscription(request))
        .rejects.toThrow('already has an active subscription');
    });

    it('должен отклонить создание для неизвестного плана', async () => {
      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(null);

      const request = {
        organizationId: testOrganizationId,
        planType: 'UNKNOWN_PLAN' as SubscriptionPlan,
        annualEmissions: 75000
      };

      await expect(subscriptionService.createSubscription(request))
        .rejects.toThrow('Invalid subscription plan');
    });
  });

  describe('activateSubscription', () => {
    it('должен активировать подписку и начислить кредиты', async () => {
      const mockSubscription = {
        id: testSubscriptionId,
        organizationId: testOrganizationId,
        plan_type: SubscriptionPlan.LITE,
        status: SubscriptionStatus.PENDING,
        starts_at: new Date(),
        expires_at: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
        auto_renew: false,
        price_rub: 40000,
        features: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUpdatedSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE
      };

      mockedPrisma.organization_subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockedPrisma.organization_subscriptions.update.mockResolvedValue(mockUpdatedSubscription);
      mockedPrisma.organization_credits.upsert.mockResolvedValue({} as any);
      mockCreditsService.creditCredits.mockResolvedValue({
        success: true,
        newBalance: 2000,
        newBalanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(2000),
        transactionId: 'txn-123'
      });

      const result = await subscriptionService.activateSubscription(testSubscriptionId);

      expect(result.success).toBe(true);
      expect(result.creditsAdded).toBe(1000);
      expect(result.subscription?.status).toBe(SubscriptionStatus.ACTIVE);
      
      expect(mockCreditsService.creditCredits).toHaveBeenCalledWith(
        testOrganizationId,
        1000,
        'Кредиты за активацию подписки Annual Lite',
        'SUBSCRIPTION',
        expect.objectContaining({ subscriptionId: testSubscriptionId })
      );
    });

    it('должен отклонить активацию несуществующей подписки', async () => {
      mockedPrisma.organization_subscriptions.findUnique.mockResolvedValue(null);

      const result = await subscriptionService.activateSubscription('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription not found');
    });

    it('должен отклонить активацию уже активной подписки', async () => {
      const mockSubscription = {
        id: testSubscriptionId,
        organizationId: testOrganizationId,
        plan_type: SubscriptionPlan.LITE,
        status: SubscriptionStatus.ACTIVE,
        starts_at: new Date(),
        expires_at: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
        auto_renew: false,
        price_rub: 40000,
        features: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockedPrisma.organization_subscriptions.findUnique.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.activateSubscription(testSubscriptionId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription is already active');
    });
  });

  describe('renewSubscription', () => {
    it('должен продлить активную подписку и начислить кредиты', async () => {
      const currentDate = new Date('2025-12-01');
      const expiryDate = new Date('2025-12-31'); // Скоро истекает
      const newExpiryDate = new Date('2026-12-31'); // Продлено на год

      const mockSubscription = createMockSubscriptionInfo();

      const mockRenewedSubscription = {
        id: testSubscriptionId,
        organizationId: testOrganizationId,
        plan_type: SubscriptionPlan.LITE,
        status: SubscriptionStatus.ACTIVE,
        starts_at: new Date('2025-01-01'),
        expires_at: newExpiryDate,
        auto_renew: true,
        price_rub: 40000,
        features: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: currentDate
      };

      // Mock getActiveSubscription
      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue({
        ...mockSubscription,
        plan_type: mockSubscription.planType,
        starts_at: mockSubscription.startsAt,
        expires_at: mockSubscription.expiresAt,
        auto_renew: mockSubscription.autoRenew,
        price_rub: mockSubscription.finalPrice
      } as any);

      mockedPrisma.organization_subscriptions.update.mockResolvedValue(mockRenewedSubscription);
      mockCreditsService.creditCredits.mockResolvedValue({
        success: true,
        newBalance: 2000,
        newBalanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(2000),
        transactionId: 'renewal-txn-123'
      });

      const result = await subscriptionService.renewSubscription(testOrganizationId);

      expect(result.success).toBe(true);
      expect(result.creditsAdded).toBe(1000);
      expect(result.subscription?.expiresAt).toEqual(newExpiryDate);
      
      expect(mockCreditsService.creditCredits).toHaveBeenCalledWith(
        testOrganizationId,
        1000,
        'Кредиты за продление подписки Annual Lite',
        'SUBSCRIPTION',
        expect.objectContaining({ 
          subscriptionId: testSubscriptionId,
          renewal: true 
        })
      );
    });

    it('должен отклонить продление если нет активной подписки', async () => {
      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(null);

      const result = await subscriptionService.renewSubscription(testOrganizationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active subscription found');
    });
  });

  describe('cancelSubscription', () => {
    it('должен отменить активную подписку', async () => {
      const mockSubscription = {
        id: testSubscriptionId,
        organizationId: testOrganizationId,
        plan_type: SubscriptionPlan.LITE,
        status: SubscriptionStatus.ACTIVE,
        starts_at: new Date(),
        expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
        auto_renew: true,
        price_rub: 40000,
        features: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(mockSubscription);
      mockedPrisma.organization_subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        auto_renew: false
      });
      mockedPrisma.organization_credits.upsert.mockResolvedValue({} as any);

      const result = await subscriptionService.cancelSubscription(testOrganizationId);

      expect(result).toBe(true);
      expect(mockedPrisma.organization_subscriptions.update).toHaveBeenCalledWith({
        where: { id: testSubscriptionId },
        data: expect.objectContaining({
          status: SubscriptionStatus.CANCELLED,
          auto_renew: false
        })
      });
    });

    it('должен возвращать false если нет активной подписки', async () => {
      mockedPrisma.organization_subscriptions.findFirst.mockResolvedValue(null);

      const result = await subscriptionService.cancelSubscription(testOrganizationId);

      expect(result).toBe(false);
    });
  });

  describe('processExpiredSubscriptions', () => {
    it('должен обновить статус истекших подписок', async () => {
      mockedPrisma.organization_subscriptions.updateMany.mockResolvedValue({ count: 3 });
      mockedPrisma.organization_subscriptions.findMany.mockResolvedValue([
        { organizationId: 'org1' },
        { organizationId: 'org2' },
        { organizationId: 'org3' }
      ] as any);
      mockedPrisma.organization_credits.upsert.mockResolvedValue({} as any);

      const result = await subscriptionService.processExpiredSubscriptions();

      expect(result).toBe(3);
      expect(mockedPrisma.organization_subscriptions.updateMany).toHaveBeenCalledWith({
        where: {
          status: SubscriptionStatus.ACTIVE,
          expires_at: { lt: expect.any(Date) }
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('getSubscriptionHistory', () => {
    it('должен возвращать историю подписок организации', async () => {
      const mockSubscriptions = [
        {
          id: 'sub1',
          organizationId: testOrganizationId,
          plan_type: SubscriptionPlan.LITE,
          status: SubscriptionStatus.ACTIVE,
          starts_at: new Date('2025-01-01'),
          expires_at: new Date('2026-01-01'),
          auto_renew: true,
          price_rub: 40000,
          features: [],
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01')
        },
        {
          id: 'sub2',
          organizationId: testOrganizationId,
          plan_type: SubscriptionPlan.CBAM_ADDON,
          status: SubscriptionStatus.EXPIRED,
          starts_at: new Date('2024-01-01'),
          expires_at: new Date('2024-12-31'),
          auto_renew: false,
          price_rub: 15000,
          features: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-12-31')
        }
      ];

      mockedPrisma.organization_subscriptions.findMany.mockResolvedValue(mockSubscriptions);

      const result = await subscriptionService.getSubscriptionHistory(testOrganizationId);

      expect(result).toHaveLength(2);
      expect(result[0].planType).toBe(SubscriptionPlan.LITE);
      expect(result[0].status).toBe(SubscriptionStatus.ACTIVE);
      expect(result[1].planType).toBe(SubscriptionPlan.CBAM_ADDON);
      expect(result[1].status).toBe(SubscriptionStatus.EXPIRED);
    });

    it('должен корректно обрабатывать ошибки БД', async () => {
      mockedPrisma.organization_subscriptions.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(subscriptionService.getSubscriptionHistory(testOrganizationId))
        .rejects.toThrow('Failed to get subscription history');
    });
  });
});
