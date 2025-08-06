/**
 * Тесты для Rate Limiter с интеграцией Credits Service
 * Задача 2.3: Тестирование учета кредитов в Rate Limiter
 */

import { RateLimiter } from '../../lib/rate-limiter';
import { creditsService } from '../../lib/credits-service';

// Мокируем CreditsService
jest.mock('../../lib/credits-service', () => ({
  creditsService: {
    checkBalance: jest.fn(),
    getOperationCost: jest.fn(),
    hasCredits: jest.fn()
  }
}));

// Мокируем Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    rateLimit: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn()
    }
  }
}));

describe('Rate Limiter - Credits Integration', () => {
  let rateLimiter: RateLimiter;
  let mockCreditsService: jest.Mocked<typeof creditsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Создаем Rate Limiter с тестовой конфигурацией
    rateLimiter = new RateLimiter({
      windowSizeMs: 60000, // 1 минута для тестов
      maxRequests: 10,
      cleanupIntervalMs: 300000,
      subscriptionLimits: {
        FREE: 5,
        LITE_ANNUAL: 10,
        CBAM_ADDON: 20,
        PREMIUM: 50
      }
    });
    
    // Получаем мок CreditsService
    mockCreditsService = (rateLimiter as any).creditsService;
  });

  afterEach(async () => {
    await rateLimiter.stop();
  });

  describe('checkLimit', () => {
    const mockPrisma = require('../../lib/prisma').prisma;

    it('должен блокировать запросы при нулевом балансе кредитов', async () => {
      // Настройка моков
      mockCreditsService.checkBalance.mockResolvedValue({
        organizationId: 'org-123',
        balance: 0,
        balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(0),
        totalPurchased: 10,
        totalUsed: 10,
        planType: 'FREE',
        lastUpdated: new Date()
      });

      // Выполнение
      const result = await rateLimiter.checkLimit('org-123');

      // Проверки
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('INSUFFICIENT_CREDITS');
      expect(result.subscriptionType).toBe('FREE');
      expect(result.hasCredits).toBe(false);
      expect(mockCreditsService.checkBalance).toHaveBeenCalledWith('org-123');
    });

    it('должен применить лимиты по типу подписки FREE', async () => {
      // Настройка моков
      mockCreditsService.checkBalance.mockResolvedValue({
        organizationId: 'org-123',
        balance: 10,
        balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(10),
        totalPurchased: 10,
        totalUsed: 0,
        planType: 'FREE',
        lastUpdated: new Date()
      });

      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 0.1,
        surgePricingMultiplier: 1,
        finalCost: 0.1,
        pricePerTonRub: 5
      });

      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId: 'org-123',
        requestCount: 3,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Выполнение
      const result = await rateLimiter.checkLimit('org-123');

      // Проверки
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 (FREE лимит) - 3 (текущий счет) = 2
      expect(result.subscriptionType).toBe('FREE');
      expect(result.hasCredits).toBe(true);
    });

    it('должен применить лимиты по типу подписки LITE_ANNUAL', async () => {
      // Настройка моков
      mockCreditsService.checkBalance.mockResolvedValue({
        organizationId: 'org-premium',
        balance: 1000,
        balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(1000),
        totalPurchased: 1000,
        totalUsed: 0,
        planType: 'LITE_ANNUAL',
        lastUpdated: new Date()
      });

      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 0.1,
        surgePricingMultiplier: 1,
        finalCost: 0.1,
        pricePerTonRub: 5
      });

      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId: 'org-premium',
        requestCount: 7,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Выполнение
      const result = await rateLimiter.checkLimit('org-premium');

      // Проверки
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3); // 10 (LITE_ANNUAL лимит) - 7 (текущий счет) = 3
      expect(result.subscriptionType).toBe('LITE_ANNUAL');
    });

    it('должен применить surge pricing ограничения', async () => {
      // Настройка моков для surge period
      mockCreditsService.checkBalance.mockResolvedValue({
        organizationId: 'org-surge',
        balance: 100,
        balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(100),
        totalPurchased: 100,
        totalUsed: 0,
        planType: 'LITE_ANNUAL',
        lastUpdated: new Date()
      });

      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 0.1,
        surgePricingMultiplier: 2, // Surge period активен
        finalCost: 0.2,
        pricePerTonRub: 5
      });

      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId: 'org-surge',
        requestCount: 4,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Выполнение
      const result = await rateLimiter.checkLimit('org-surge');

      // Проверки
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1); // 5 (10 * 0.5 surge reduction) - 4 = 1
    });

    it('должен блокировать при превышении лимита', async () => {
      // Настройка моков
      mockCreditsService.checkBalance.mockResolvedValue({
        organizationId: 'org-limit',
        balance: 100,
        balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(100),
        totalPurchased: 100,
        totalUsed: 0,
        planType: 'FREE',
        lastUpdated: new Date()
      });

      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 0.1,
        surgePricingMultiplier: 1,
        finalCost: 0.1,
        pricePerTonRub: 5
      });

      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId: 'org-limit',
        requestCount: 5, // Равно лимиту FREE (5)
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Выполнение
      const result = await rateLimiter.checkLimit('org-limit');

      // Проверки
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('canPerformOperation', () => {
    it('должен разрешить операцию при достаточных кредитах и лимитах', async () => {
      // Настройка моков для checkLimit
      mockCreditsService.checkBalance
        .mockResolvedValueOnce({
          organizationId: 'org-ok',
          balance: 10,
          balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(10),
          totalPurchased: 10,
          totalUsed: 0,
          planType: 'LITE_ANNUAL',
          lastUpdated: new Date()
        })
        .mockResolvedValueOnce({
          organizationId: 'org-ok',
          balance: 10,
          balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(10),
          totalPurchased: 10,
          totalUsed: 0,
          planType: 'LITE_ANNUAL',
          lastUpdated: new Date()
        });

      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 0.1,
        surgePricingMultiplier: 1,
        finalCost: 0.1,
        pricePerTonRub: 5
      });

      const mockPrisma = require('../../lib/prisma').prisma;
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId: 'org-ok',
        requestCount: 2,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Выполнение
      const result = await rateLimiter.canPerformOperation('org-ok', 'ocr');

      // Проверки
      expect(result.allowed).toBe(true);
      expect(result.requiredCredits).toBe(0.1);
      expect(result.availableCredits).toBe(10);
      expect(result.rateLimitResult?.allowed).toBe(true);
    });

    it('должен отклонить операцию при недостатке кредитов', async () => {
      // Настройка моков для checkLimit (пропускает rate limit)
      mockCreditsService.checkBalance
        .mockResolvedValueOnce({
          organizationId: 'org-poor',
          balance: 0.05, // Меньше чем нужно для операции
          balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(0.05),
          totalPurchased: 10,
          totalUsed: 9.95,
          planType: 'FREE',
          lastUpdated: new Date()
        })
        .mockResolvedValueOnce({
          organizationId: 'org-poor',
          balance: 0.05,
          balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(0.05),
          totalPurchased: 10,
          totalUsed: 9.95,
          planType: 'FREE',
          lastUpdated: new Date()
        });

      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 0.1,
        surgePricingMultiplier: 2, // Surge pricing
        finalCost: 0.2,
        pricePerTonRub: 5
      });

      const mockPrisma = require('../../lib/prisma').prisma;
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId: 'org-poor',
        requestCount: 1,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Выполнение
      const result = await rateLimiter.canPerformOperation('org-poor', 'ocr');

      // Проверки
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('INSUFFICIENT_CREDITS_FOR_OPERATION');
      expect(result.requiredCredits).toBe(0.2);
      expect(result.availableCredits).toBe(0.05);
    });
  });

  describe('getStats', () => {
    it('должен возвращать полную статистику с кредитами', async () => {
      // Настройка моков
      mockCreditsService.checkBalance.mockResolvedValue({
        organizationId: 'org-stats',
        balance: 50,
        balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(50),
        totalPurchased: 100,
        totalUsed: 50,
        planType: 'CBAM_ADDON',
        lastUpdated: new Date()
      });

      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 0.1,
        surgePricingMultiplier: 1.5,
        finalCost: 0.15,
        pricePerTonRub: 5
      });

      const mockPrisma = require('../../lib/prisma').prisma;
      mockPrisma.rateLimit.findUnique.mockResolvedValue({
        organizationId: 'org-stats',
        requestCount: 8,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Выполнение
      const stats = await rateLimiter.getStats('org-stats');

      // Проверки
      expect(stats.organizationId).toBe('org-stats');
      expect(stats.currentCount).toBe(8);
      expect(stats.maxRequests).toBe(10); // CBAM_ADDON лимит (20) с surge reduction (20 * 0.5 = 10)
      expect(stats.hasCredits).toBe(true);
      expect(stats.isSurgePeriod).toBe(true); // surgePricingMultiplier > 1
      expect(stats.subscriptionType).toBe('CBAM_ADDON');
      expect(stats.creditsBalance).toBe(50);
    });
  });
});
