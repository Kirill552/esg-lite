/**
 * Unit тесты для API endpoints подписок
 * Задача 3.3: Создать API endpoints для подписок
 */

import { NextRequest } from 'next/server';
import { GET as getSubscriptions, POST as createSubscription, PATCH as updateSubscription } from '../../../app/api/subscriptions/route';
import { GET as getPlans } from '../../../app/api/subscriptions/plans/route';
import { POST as changePlan } from '../../../app/api/subscriptions/change-plan/route';
import { SubscriptionService } from '../../../lib/subscription-service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// Mock auth функции
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Mock SubscriptionService
jest.mock('../../../lib/subscription-service');

const mockAuth = require('@clerk/nextjs/server').auth;
const MockedSubscriptionService = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;

describe('Subscriptions API Endpoints', () => {
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;
  const testOrganizationId = 'org_test123';
  const testUserId = 'user_test456';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscriptionService = new MockedSubscriptionService() as jest.Mocked<SubscriptionService>;
    MockedSubscriptionService.mockImplementation(() => mockSubscriptionService);
  });

  describe('GET /api/subscriptions', () => {
    it('должен возвращать активную подписку и историю', async () => {
      // Mock аутентификации
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      // Mock данных
      const mockActiveSubscription = {
        id: 'sub_123',
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.LITE_ANNUAL,
        status: SubscriptionStatus.ACTIVE,
        startsAt: new Date('2025-01-01'),
        expiresAt: new Date('2026-01-01'),
        autoRenew: true,
        priceRub: 40000,
        features: ['1000 т CO₂ кредитов'],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      const mockHistory = [mockActiveSubscription];

      mockSubscriptionService.getActiveSubscription.mockResolvedValue(mockActiveSubscription);
      mockSubscriptionService.getSubscriptionHistory.mockResolvedValue(mockHistory);

      // Создаем mock запрос
      const request = new NextRequest('http://localhost:3000/api/subscriptions');
      
      const response = await getSubscriptions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.organizationId).toBe(testOrganizationId);
      expect(data.data.activeSubscription.id).toBe(mockActiveSubscription.id);
      expect(data.data.activeSubscription.planType).toBe(mockActiveSubscription.planType);
      expect(data.data.history).toHaveLength(1);
    });

    it('должен возвращать 401 для неаутентифицированного пользователя', async () => {
      mockAuth.mockResolvedValue({ userId: null, orgId: null });

      const request = new NextRequest('http://localhost:3000/api/subscriptions');
      const response = await getSubscriptions(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('должен корректно обрабатывать ошибки SubscriptionService', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });
      mockSubscriptionService.getActiveSubscription.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/subscriptions');
      const response = await getSubscriptions(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
    });
  });

  describe('POST /api/subscriptions', () => {
    it('должен создать новую подписку LITE_ANNUAL', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const mockCreatedSubscription = {
        id: 'sub_new123',
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.LITE_ANNUAL,
        status: SubscriptionStatus.PENDING,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        priceRub: 40000,
        features: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSubscriptionService.createSubscription.mockResolvedValue(mockCreatedSubscription);

      const requestBody = {
        planType: SubscriptionPlan.LITE_ANNUAL,
        autoRenew: false
      };

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.subscription.id).toBe(mockCreatedSubscription.id);
      expect(data.data.subscription.planType).toBe(mockCreatedSubscription.planType);
      expect(data.data.subscription.status).toBe(mockCreatedSubscription.status);
      expect(mockSubscriptionService.createSubscription).toHaveBeenCalledWith({
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.LITE_ANNUAL,
        autoRenew: false
      });
    });

    it('должен отклонить запрос без planType', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
      expect(data.message).toContain('planType обязательно');
    });

    it('должен отклонить запрос с недопустимым planType', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ planType: 'INVALID_PLAN' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
      expect(data.message).toContain('Недопустимый тип плана');
    });

    it('должен обработать конфликт при существующей активной подписке', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });
      mockSubscriptionService.createSubscription.mockRejectedValue(
        new Error('Organization test-org already has an active subscription')
      );

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ planType: SubscriptionPlan.LITE_ANNUAL }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await createSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Conflict');
    });
  });

  describe('PATCH /api/subscriptions', () => {
    it('должен активировать подписку', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const mockActivationResult = {
        success: true,
        subscription: {
          id: 'sub_123',
          organizationId: testOrganizationId,
          planType: SubscriptionPlan.LITE_ANNUAL,
          status: SubscriptionStatus.ACTIVE,
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: false,
          priceRub: 40000,
          features: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        creditsAdded: 1000
      };

      mockSubscriptionService.activateSubscription.mockResolvedValue(mockActivationResult);

      const requestBody = {
        action: 'activate',
        subscriptionId: 'sub_123'
      };

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await updateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.action).toBe('activate');
      expect(data.data.message).toContain('1000 т CO₂ кредитов');
    });

    it('должен продлить подписку', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const mockRenewalResult = {
        success: true,
        subscription: {
          id: 'sub_123',
          organizationId: testOrganizationId,
          planType: SubscriptionPlan.LITE_ANNUAL,
          status: SubscriptionStatus.ACTIVE,
          startsAt: new Date('2025-01-01'),
          expiresAt: new Date('2027-01-01'), // Продлено на год
          autoRenew: true,
          priceRub: 40000,
          features: [],
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date()
        },
        creditsAdded: 1000
      };

      mockSubscriptionService.renewSubscription.mockResolvedValue(mockRenewalResult);

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'renew' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await updateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.action).toBe('renew');
      expect(data.data.message).toContain('продлена');
    });

    it('должен отменить подписку', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });
      mockSubscriptionService.cancelSubscription.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await updateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.action).toBe('cancel');
      expect(data.data.message).toContain('отменена');
    });

    it('должен отклонить запрос с недопустимым action', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'invalid_action' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await updateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
      expect(data.message).toContain('Недопустимое действие');
    });
  });

  describe('GET /api/subscriptions/plans', () => {
    it('должен возвращать список доступных планов', async () => {
      const mockPlans = [
        {
          planType: SubscriptionPlan.FREE,
          name: 'Бесплатный план',
          description: 'Базовая функциональность',
          priceRub: 0,
          durationMonths: 0,
          creditsIncluded: 1000,
          features: ['До 1000 т CO₂ бесплатно']
        },
        {
          planType: SubscriptionPlan.LITE_ANNUAL,
          name: 'Annual Lite',
          description: 'Годовая подписка для средних предприятий',
          priceRub: 40000,
          durationMonths: 12,
          creditsIncluded: 1000,
          features: ['1000 т CO₂ кредитов включено']
        }
      ];

      mockSubscriptionService.getAvailablePlans.mockReturnValue(mockPlans);

      const request = new NextRequest('http://localhost:3000/api/subscriptions/plans');
      const response = await getPlans(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.plans).toHaveLength(2);
      expect(data.data.plans[0].recommended).toBe(false); // FREE план не рекомендуемый
      expect(data.data.plans[1].recommended).toBe(true);  // LITE_ANNUAL рекомендуемый
      expect(data.data.currency).toBe('RUB');
    });
  });

  describe('POST /api/subscriptions/change-plan', () => {
    it('должен немедленно изменить план подписки', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const mockCurrentSubscription = {
        id: 'sub_current',
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        startsAt: new Date('2025-01-01'),
        expiresAt: new Date('2026-01-01'),
        autoRenew: false,
        priceRub: 0,
        features: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      const mockNewSubscription = {
        ...mockCurrentSubscription,
        id: 'sub_new',
        planType: SubscriptionPlan.LITE_ANNUAL,
        priceRub: 40000
      };

      const mockPlanInfo = {
        planType: SubscriptionPlan.LITE_ANNUAL,
        name: 'Annual Lite',
        description: 'Годовая подписка',
        priceRub: 40000,
        durationMonths: 12,
        creditsIncluded: 1000,
        features: []
      };

      mockSubscriptionService.getActiveSubscription.mockResolvedValue(mockCurrentSubscription);
      mockSubscriptionService.getPlanInfo.mockReturnValue(mockPlanInfo);
      mockSubscriptionService.cancelSubscription.mockResolvedValue(true);
      mockSubscriptionService.createSubscription.mockResolvedValue(mockNewSubscription);
      mockSubscriptionService.activateSubscription.mockResolvedValue({
        success: true,
        subscription: mockNewSubscription,
        creditsAdded: 1000
      });

      const requestBody = {
        newPlanType: SubscriptionPlan.LITE_ANNUAL,
        immediate: true
      };

      const request = new NextRequest('http://localhost:3000/api/subscriptions/change-plan', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await changePlan(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.changeResult.type).toBe('immediate');
      expect(data.data.changeResult.oldPlan).toBe(SubscriptionPlan.FREE);
      expect(data.data.changeResult.newPlan).toBe(SubscriptionPlan.LITE_ANNUAL);
      expect(data.data.changeResult.creditsAdded).toBe(1000);
    });

    it('должен запланировать смену плана', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const mockCurrentSubscription = {
        id: 'sub_current',
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.LITE_ANNUAL,
        status: SubscriptionStatus.ACTIVE,
        startsAt: new Date('2025-01-01'),
        expiresAt: new Date('2026-01-01'),
        autoRenew: false,
        priceRub: 40000,
        features: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      const mockPendingSubscription = {
        ...mockCurrentSubscription,
        id: 'sub_pending',
        planType: SubscriptionPlan.CBAM_ADDON,
        status: SubscriptionStatus.PENDING,
        priceRub: 15000
      };

      const mockPlanInfo = {
        planType: SubscriptionPlan.CBAM_ADDON,
        name: 'CBAM Add-on',
        description: 'Дополнительный модуль CBAM',
        priceRub: 15000,
        durationMonths: 12,
        creditsIncluded: 0,
        features: []
      };

      mockSubscriptionService.getActiveSubscription.mockResolvedValue(mockCurrentSubscription);
      mockSubscriptionService.getPlanInfo.mockReturnValue(mockPlanInfo);
      mockSubscriptionService.createSubscription.mockResolvedValue(mockPendingSubscription);

      const requestBody = {
        newPlanType: SubscriptionPlan.CBAM_ADDON,
        immediate: false
      };

      const request = new NextRequest('http://localhost:3000/api/subscriptions/change-plan', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await changePlan(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.changeResult.type).toBe('scheduled');
      expect(data.data.changeResult.effectiveDate).toBe(mockCurrentSubscription.expiresAt.toISOString());
    });

    it('должен отклонить смену на тот же план', async () => {
      mockAuth.mockResolvedValue({ userId: testUserId, orgId: testOrganizationId });

      const mockCurrentSubscription = {
        id: 'sub_current',
        organizationId: testOrganizationId,
        planType: SubscriptionPlan.LITE_ANNUAL,
        status: SubscriptionStatus.ACTIVE,
        startsAt: new Date('2025-01-01'),
        expiresAt: new Date('2026-01-01'),
        autoRenew: false,
        priceRub: 40000,
        features: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      mockSubscriptionService.getActiveSubscription.mockResolvedValue(mockCurrentSubscription);

      const requestBody = {
        newPlanType: SubscriptionPlan.LITE_ANNUAL, // Тот же план
        immediate: true
      };

      const request = new NextRequest('http://localhost:3000/api/subscriptions/change-plan', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await changePlan(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
      expect(data.message).toContain('совпадает с текущим');
    });
  });
});
