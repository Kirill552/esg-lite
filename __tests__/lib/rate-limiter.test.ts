/**
 * Unit тесты для Rate Limiter
 * Задача 12.2: Создать тесты для Rate Limiter
 * Требования: 2.1, 2.2, 2.3
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock модули перед импортом
jest.mock('../../lib/prisma', () => ({
  prisma: {
    rateLimit: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn()
    }
  }
}));

jest.mock('../../lib/credits-service', () => ({
  creditsService: {
    checkBalance: jest.fn(),
    getOperationCost: jest.fn(),
    hasCredits: jest.fn(),
    debitCredits: jest.fn()
  }
}));

import { RateLimiter, RateLimitConfig } from '../../lib/rate-limiter';

// Получаем ссылки на моки после импорта
const mockPrisma = require('../../lib/prisma').prisma;
const mockCreditsService = require('../../lib/credits-service').creditsService;

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const testConfig: RateLimitConfig = {
    windowSizeMs: 60000, // 1 минута для тестов
    maxRequests: 10,
    cleanupIntervalMs: 30000, // 30 секунд
    subscriptionLimits: {
      'FREE': 5,
      'LITE_ANNUAL': 10,
      'CBAM_ADDON': 20,
      'PREMIUM': 50
    }
  };

  beforeEach(() => {
    // Сбрасываем все моки
    jest.clearAllMocks();

    // Создаем новый экземпляр для каждого теста
    rateLimiter = new RateLimiter(testConfig);

    // Настройка моков по умолчанию
    mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'FREE' });
    mockCreditsService.getOperationCost.mockResolvedValue({
      baseCost: 1,
      surgePricingMultiplier: 1,
      finalCost: 1,
      pricePerTonRub: 5
    });
  });

  afterEach(async () => {
    // Останавливаем rate limiter после каждого теста
    await rateLimiter.stop();
  });

  describe('checkLimit', () => {
    test('должен разрешить запрос при наличии кредитов и в пределах лимита', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'LITE_ANNUAL' });
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 5,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // 10 - 5 = 5
      expect(result.resetTime).toBeInstanceOf(Date);
      expect(result.reason).toBeUndefined();
    });

    test('должен отклонить запрос при недостатке кредитов', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 0, planType: 'FREE' });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toBe('INSUFFICIENT_CREDITS');
      expect(mockPrisma.rateLimit.upsert).not.toHaveBeenCalled();
    });

    test('должен отклонить запрос при превышении лимита', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'LITE_ANNUAL' });
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 10, // Достигнут лимит
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('должен применить surge pricing лимиты', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'LITE_ANNUAL' });
      mockCreditsService.getOperationCost.mockResolvedValueOnce({
        baseCost: 1,
        surgePricingMultiplier: 2,
        finalCost: 2,
        pricePerTonRub: 5
      });
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 6, // Больше чем 50% от 10 (5)
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('должен обрабатывать ошибки базы данных (fail-open)', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'FREE' });
      mockPrisma.rateLimit.upsert.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('ERROR_FALLBACK');
      expect(result.remaining).toBe(testConfig.maxRequests);
    });
  });

  describe('incrementCounter', () => {
    test('должен увеличить счетчик для существующей записи', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 6,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      await rateLimiter.incrementCounter(organizationId);

      // Assert
      expect(mockPrisma.rateLimit.upsert).toHaveBeenCalledWith({
        where: {
          organizationId_windowStart: {
            organizationId,
            windowStart: expect.any(Date)
          }
        },
        update: {
          requestCount: {
            increment: 1
          },
          updatedAt: expect.any(Date)
        },
        create: {
          organizationId,
          requestCount: 1,
          windowStart: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    test('должен создать новую запись для новой организации', async () => {
      // Arrange
      const organizationId = 'org-new';
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 1,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      await rateLimiter.incrementCounter(organizationId);

      // Assert
      expect(mockPrisma.rateLimit.upsert).toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки без прерывания выполнения', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockPrisma.rateLimit.upsert.mockRejectedValue(new Error('Database error'));

      // Act & Assert - не должно выбросить исключение
      await expect(rateLimiter.incrementCounter(organizationId)).resolves.toBeUndefined();
    });
  });

  describe('getStats', () => {
    test('должен вернуть статистику для организации', async () => {
      // Arrange
      const organizationId = 'org-123';
      const windowStart = new Date();
      mockPrisma.rateLimit.findUnique.mockResolvedValue({
        organizationId,
        requestCount: 7,
        windowStart,
        updatedAt: new Date()
      });
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 5, planType: 'LITE_ANNUAL' });
      mockCreditsService.getOperationCost.mockResolvedValueOnce({
        baseCost: 1,
        surgePricingMultiplier: 1,
        finalCost: 1,
        pricePerTonRub: 5
      });

      // Act
      const stats = await rateLimiter.getStats(organizationId);

      // Assert
      expect(stats).toEqual({
        organizationId,
        currentCount: 7,
        maxRequests: testConfig.subscriptionLimits.LITE_ANNUAL,
        windowStart: expect.any(Date),
        windowEnd: expect.any(Date),
        hasCredits: true,
        isSurgePeriod: false,
        subscriptionType: 'LITE_ANNUAL',
        creditsBalance: 5
      });
    });

    test('должен вернуть нулевой счетчик для новой организации', async () => {
      // Arrange
      const organizationId = 'org-new';
      mockPrisma.rateLimit.findUnique.mockResolvedValue(null);
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'FREE' });
      mockCreditsService.getOperationCost.mockResolvedValueOnce({
        baseCost: 1,
        surgePricingMultiplier: 1,
        finalCost: 1,
        pricePerTonRub: 5
      });

      // Act
      const stats = await rateLimiter.getStats(organizationId);

      // Assert
      expect(stats.currentCount).toBe(0);
      expect(stats.organizationId).toBe(organizationId);
    });

    test('должен обрабатывать ошибки и возвращать базовую статистику', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockPrisma.rateLimit.findUnique.mockRejectedValue(new Error('Database error'));

      // Act
      const stats = await rateLimiter.getStats(organizationId);

      // Assert
      expect(stats).toEqual({
        organizationId,
        currentCount: 0,
        maxRequests: testConfig.maxRequests,
        windowStart: expect.any(Date),
        windowEnd: expect.any(Date),
        hasCredits: false,
        isSurgePeriod: false,
        subscriptionType: 'FREE',
        creditsBalance: 0
      });
    });
  });

  describe('resetLimits', () => {
    test('должен сбросить лимиты для организации', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockPrisma.rateLimit.deleteMany.mockResolvedValue({ count: 3 });

      // Act
      await rateLimiter.resetLimits(organizationId);

      // Assert
      expect(mockPrisma.rateLimit.deleteMany).toHaveBeenCalledWith({
        where: {
          organizationId
        }
      });
    });

    test('должен обрабатывать ошибки при сбросе лимитов', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockPrisma.rateLimit.deleteMany.mockRejectedValue(new Error('Database error'));

      // Act & Assert - не должно выбросить исключение
      await expect(rateLimiter.resetLimits(organizationId)).resolves.toBeUndefined();
    });
  });

  describe('временные окна', () => {
    test('должен корректно вычислять временные окна', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'FREE' });
      
      // Мокаем текущее время
      const fixedTime = new Date('2024-01-01T12:30:45.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);
      
      // Ожидаемое начало окна (округленное вниз до минуты)
      const expectedWindowStart = new Date('2024-01-01T12:30:00.000Z');
      
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 1,
        windowStart: expectedWindowStart,
        updatedAt: new Date()
      });

      // Act
      await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(mockPrisma.rateLimit.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId_windowStart: {
              organizationId,
              windowStart: expectedWindowStart
            }
          }
        })
      );

      // Восстанавливаем Date.now
      jest.restoreAllMocks();
    });

    test('должен использовать разные окна для разного времени', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'FREE' });
      
      // Первый запрос в 12:30
      const time1 = new Date('2024-01-01T12:30:45.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(time1);
      
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 1,
        windowStart: new Date('2024-01-01T12:30:00.000Z'),
        updatedAt: new Date()
      });

      // Act 1
      await rateLimiter.checkLimit(organizationId);
      const firstCall = mockPrisma.rateLimit.upsert.mock.calls[0];

      // Второй запрос в 12:31 (новое окно)
      const time2 = new Date('2024-01-01T12:31:15.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(time2);
      
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 1,
        windowStart: new Date('2024-01-01T12:31:00.000Z'),
        updatedAt: new Date()
      });

      // Act 2
      await rateLimiter.checkLimit(organizationId);
      const secondCall = mockPrisma.rateLimit.upsert.mock.calls[1];

      // Assert
      const firstWindowStart = (firstCall[0] as any).where.organizationId_windowStart.windowStart;
      const secondWindowStart = (secondCall[0] as any).where.organizationId_windowStart.windowStart;
      
      expect(firstWindowStart).not.toEqual(secondWindowStart);
      expect(secondWindowStart.getTime() - firstWindowStart.getTime()).toBe(60000); // 1 минута

      // Восстанавливаем Date.now
      jest.restoreAllMocks();
    });
  });

  describe('интеграция с заглушками', () => {
    test('должен проверять кредиты через credits service', async () => {
      // Arrange
      const organizationId = 'org-123';
      
      // Act
      await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(mockCreditsService.checkBalance).toHaveBeenCalledWith(organizationId);
    });

    test('должен учитывать surge pricing период', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'LITE_ANNUAL' });
      mockCreditsService.getOperationCost.mockResolvedValueOnce({
        baseCost: 1,
        surgePricingMultiplier: 2,
        finalCost: 2,
        pricePerTonRub: 5
      });

      // В surge период лимит должен быть 50% от обычного (5 вместо 10)
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 3,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(mockCreditsService.getOperationCost).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 - 3 = 2 (surge лимит)
    });

    test('должен отклонить запрос в surge период при превышении уменьшенного лимита', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 10, planType: 'LITE_ANNUAL' });
      mockCreditsService.getOperationCost.mockResolvedValueOnce({
        baseCost: 1,
        surgePricingMultiplier: 2,
        finalCost: 2,
        pricePerTonRub: 5
      });

      // В surge период лимит 5, а у нас уже 5 запросов
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 5,
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('конфигурация', () => {
    test('должен использовать конфигурацию по умолчанию', () => {
      // Arrange & Act
      const defaultRateLimiter = new RateLimiter();

      // Assert - проверяем через приватные поля (в реальном коде лучше добавить геттеры)
      expect(defaultRateLimiter).toBeInstanceOf(RateLimiter);
    });

    test('должен использовать переданную конфигурацию', () => {
      // Arrange
      const customConfig = {
        windowSizeMs: 30000,
        maxRequests: 50,
        cleanupIntervalMs: 60000
      };

      // Act
      const customRateLimiter = new RateLimiter(customConfig);

      // Assert
      expect(customRateLimiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('очистка ресурсов', () => {
    test('должен корректно останавливать таймеры', async () => {
      // Arrange
      const rateLimiter = new RateLimiter(testConfig);

      // Act
      await rateLimiter.stop();

      // Assert - проверяем что метод выполнился без ошибок
      expect(true).toBe(true);
    });

    test('должен выполнять финальную очистку при остановке', async () => {
      // Arrange
      const rateLimiter = new RateLimiter(testConfig);
      mockPrisma.rateLimit.deleteMany.mockResolvedValue({ count: 5 });

      // Act
      await rateLimiter.stop();

      // Assert
      expect(mockPrisma.rateLimit.deleteMany).toHaveBeenCalledWith({
        where: {
          windowStart: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });
});