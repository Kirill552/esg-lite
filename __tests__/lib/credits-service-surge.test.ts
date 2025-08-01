/**
 * Unit тесты для интеграции Surge Pricing в Credits Service
 * Задача 5.2: Интегрировать surge pricing в кредитную систему
 */

import { CreditsService } from '@/lib/credits-service';
import { surgePricingService } from '@/lib/surge-pricing';

// Мокаем prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    organization_credits: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    organization_credit_transactions: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

// Мокаем surge pricing service
jest.mock('@/lib/surge-pricing', () => ({
  surgePricingService: {
    getSurgeMultiplier: jest.fn(),
    getSurgePricingStatus: jest.fn(),
    getBannerInfo: jest.fn(),
    getSurgePricingNotification: jest.fn(),
    isSurgePeriod: jest.fn()
  }
}));

const mockSurgePricingService = surgePricingService as jest.Mocked<typeof surgePricingService>;

describe('CreditsService with Surge Pricing Integration', () => {
  let creditsService: CreditsService;

  beforeEach(() => {
    jest.clearAllMocks();
    creditsService = new CreditsService();
  });

  describe('getOperationCost with Surge Pricing', () => {
    test('должен автоматически применять surge multiplier', async () => {
      // Arrange
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);

      // Act
      const result = await creditsService.getOperationCost('ocr', 1, undefined, surgeDate);

      // Assert
      expect(mockSurgePricingService.getSurgeMultiplier).toHaveBeenCalledWith(surgeDate);
      expect(result.baseCost).toBe(0.1);
      expect(result.surgePricingMultiplier).toBe(2.0);
      expect(result.finalCost).toBe(0.2); // 0.1 * 2.0
      expect(result.pricePerTonRub).toBe(5);
    });

    test('должен использовать явный multiplier если передан', async () => {
      // Arrange
      const explicitMultiplier = 1.5;
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);

      // Act
      const result = await creditsService.getOperationCost('ocr', 1, explicitMultiplier);

      // Assert
      expect(mockSurgePricingService.getSurgeMultiplier).not.toHaveBeenCalled();
      expect(result.surgePricingMultiplier).toBe(1.5);
      expect(result.finalCost).toBeCloseTo(0.15, 5); // 0.1 * 1.5
    });

    test('должен правильно рассчитывать для разных типов операций', async () => {
      // Arrange
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);

      // Act & Assert
      const ocrCost = await creditsService.getOperationCost('ocr');
      expect(ocrCost.baseCost).toBe(0.1);
      expect(ocrCost.finalCost).toBe(0.2);

      const reportCost = await creditsService.getOperationCost('report_generation', 1000);
      expect(reportCost.baseCost).toBe(1.0); // Math.max(0.1, 1000 * 0.001)
      expect(reportCost.finalCost).toBe(2.0);

      const apiCost = await creditsService.getOperationCost('api_call');
      expect(apiCost.baseCost).toBe(0.01);
      expect(apiCost.finalCost).toBe(0.02);
    });
  });

  describe('calculateRequiredCredits with Surge Pricing', () => {
    test('должен учитывать surge pricing при расчете', async () => {
      // Arrange
      const mockBalance = {
        organizationId: 'org-1',
        balance: 500,
        balanceDecimal: { toNumber: () => 500 } as any,
        totalPurchased: 1500,
        totalUsed: 1000,
        lastUpdated: new Date(),
        planType: 'LITE_ANNUAL' as any
      };

      // Мокаем checkBalance
      jest.spyOn(creditsService, 'checkBalance').mockResolvedValue(mockBalance);
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);

      // Act
      const result = await creditsService.calculateRequiredCredits('org-1', 'ocr');

      // Assert
      expect(result).toBe(0.2); // 0.1 * 2.0, но организация уже использовала весь free tier
    });

    test('должен учитывать free tier при surge pricing', async () => {
      // Arrange
      const mockBalance = {
        organizationId: 'org-1',
        balance: 1000,
        balanceDecimal: { toNumber: () => 1000 } as any,
        totalPurchased: 1000,
        totalUsed: 900, // Использовано 900 из 1000 бесплатных
        lastUpdated: new Date(),
        planType: 'LITE_ANNUAL' as any
      };

      jest.spyOn(creditsService, 'checkBalance').mockResolvedValue(mockBalance);
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);

      // Act
      const result = await creditsService.calculateRequiredCredits('org-1', 'ocr');

      // Assert
      // Операция стоит 0.2 (0.1 * 2.0), осталось бесплатных 100 (1000 - 900)
      // Требуется доплатить: max(0, 0.2 - 100) = 0
      expect(result).toBe(0);
    });
  });

  describe('getSurgePricingInfo', () => {
    test('должен возвращать полную информацию о surge pricing', async () => {
      // Arrange
      const mockStatus = {
        isActive: true,
        multiplier: 2.0,
        reason: 'Высокий сезон отчетности',
        startDate: new Date(2025, 5, 15),
        endDate: new Date(2025, 5, 30),
        timeRemaining: '10 дней до окончания'
      };

      const mockBannerInfo = {
        show: true,
        message: 'Surge период активен!',
        type: 'warning' as const
      };

      const mockNotification = {
        type: 'start' as const,
        message: 'Период surge pricing начался',
        timestamp: new Date(),
        isActive: true,
        daysRemaining: 10
      };

      mockSurgePricingService.getSurgePricingStatus.mockReturnValue(mockStatus);
      mockSurgePricingService.getBannerInfo.mockReturnValue(mockBannerInfo);
      mockSurgePricingService.getSurgePricingNotification.mockReturnValue(mockNotification);

      // Act
      const result = await creditsService.getSurgePricingInfo();

      // Assert
      expect(result.status).toEqual(mockStatus);
      expect(result.bannerInfo).toEqual(mockBannerInfo);
      expect(result.notification).toEqual(mockNotification);
      expect(result.isActive).toBe(true);
      expect(result.multiplier).toBe(2.0);
      expect(result.reason).toBe('Высокий сезон отчетности');
    });
  });

  describe('calculatePriceWithSurge', () => {
    test('должен возвращать полную информацию о цене с surge pricing', async () => {
      // Arrange
      const mockStatus = {
        isActive: true,
        multiplier: 2.0,
        reason: 'Высокий сезон отчетности'
      };

      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);
      mockSurgePricingService.getSurgePricingStatus.mockReturnValue(mockStatus);
      mockSurgePricingService.getBannerInfo.mockReturnValue(null);
      mockSurgePricingService.getSurgePricingNotification.mockReturnValue(null);

      // Act
      const result = await creditsService.calculatePriceWithSurge('ocr', 1);

      // Assert
      expect(result.baseCost).toBe(0.1);
      expect(result.multiplier).toBe(2.0);
      expect(result.finalCost).toBe(0.2);
      expect(result.priceInRubles).toBe(1.0); // 0.2 * 5
      expect(result.surgeAddition).toBe(0.1); // 0.2 - 0.1
      expect(result.surgeAdditionRubles).toBe(0.5); // 0.1 * 5
      expect(result.surgePricingInfo.isActive).toBe(true);
      expect(result.operationType).toBe('ocr');
    });

    test('должен работать без surge pricing', async () => {
      // Arrange
      const mockStatus = {
        isActive: false,
        multiplier: 1.0,
        reason: 'Обычное ценообразование'
      };

      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(1.0);
      mockSurgePricingService.getSurgePricingStatus.mockReturnValue(mockStatus);
      mockSurgePricingService.getBannerInfo.mockReturnValue(null);
      mockSurgePricingService.getSurgePricingNotification.mockReturnValue(null);

      // Act
      const result = await creditsService.calculatePriceWithSurge('api_call', 1);

      // Assert
      expect(result.baseCost).toBe(0.01);
      expect(result.multiplier).toBe(1.0);
      expect(result.finalCost).toBe(0.01);
      expect(result.priceInRubles).toBe(0.05); // 0.01 * 5
      expect(result.surgeAddition).toBe(0); // 0.01 - 0.01
      expect(result.surgeAdditionRubles).toBe(0);
      expect(result.surgePricingInfo.isActive).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('должен обрабатывать большие объемы выбросов при surge pricing', async () => {
      // Arrange
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);

      // Act
      const result = await creditsService.getOperationCost('report_generation', 10000);

      // Assert
      expect(result.baseCost).toBe(10.0); // Math.max(0.1, 10000 * 0.001)
      expect(result.finalCost).toBe(20.0); // 10.0 * 2.0
      expect(result.pricePerTonRub).toBe(5);
    });

    test('должен обрабатывать дробные объемы выбросов', async () => {
      // Arrange
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(1.5);

      // Act
      const result = await creditsService.getOperationCost('report_generation', 0.05);

      // Assert
      expect(result.baseCost).toBe(0.1); // Math.max(0.1, 0.05 * 0.001)
      expect(result.finalCost).toBeCloseTo(0.15, 5); // 0.1 * 1.5
    });
  });
});
