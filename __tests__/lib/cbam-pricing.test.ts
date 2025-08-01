/**
 * Тесты для CBAM Pricing Service
 * Проверяем корректность расчетов стоимости CBAM отчетов в рублях
 */

import { 
  calculateCBAMPricing, 
  validateCBAMLineItems,
  checkCBAMSubscription,
  getCBAMPricingInfo,
  recordCBAMCharges,
  CBAM_RATE_RUB_PER_TON,
  type CBAMLineItem,
  type CBAMPricingRequest 
} from '@/lib/cbam-pricing';
import { SubscriptionService } from '@/lib/subscription-service';

// Мокаем внешние зависимости
jest.mock('@/lib/subscription-service');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    report: {
      update: jest.fn()
    }
  }))
}));

const mockSubscriptionService = SubscriptionService as jest.MockedClass<typeof SubscriptionService>;

describe('CBAM Pricing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCBAMLineItems', () => {
    it('должен корректно валидировать правильные данные', () => {
      const lineItems: Omit<CBAMLineItem, 'price'>[] = [
        {
          productName: 'Цемент',
          carbonIntensity: 0.8,
          quantity: 100,
          totalEmissions: 80
        },
        {
          productName: 'Сталь',
          carbonIntensity: 1.2,
          quantity: 50,
          totalEmissions: 60
        }
      ];

      const result = validateCBAMLineItems(lineItems);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('должен отклонить пустой массив строк', () => {
      const result = validateCBAMLineItems([]);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Отсутствуют строки для расчета CBAM');
    });

    it('должен отклонить строки с некорректными данными', () => {
      const lineItems: Omit<CBAMLineItem, 'price'>[] = [
        {
          productName: '',
          carbonIntensity: -0.5,
          quantity: 0,
          totalEmissions: -10
        }
      ];

      const result = validateCBAMLineItems(lineItems);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Строка 1: отсутствует название продукта');
      expect(result.errors).toContain('Строка 1: некорректная углеродная интенсивность');
      expect(result.errors).toContain('Строка 1: некорректное количество продукции');
      expect(result.errors).toContain('Строка 1: некорректные общие выбросы');
    });

    it('должен отклонить строки с несоответствием расчетов', () => {
      const lineItems: Omit<CBAMLineItem, 'price'>[] = [
        {
          productName: 'Цемент',
          carbonIntensity: 0.8,
          quantity: 100,
          totalEmissions: 50 // Должно быть 80
        }
      ];

      const result = validateCBAMLineItems(lineItems);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('несоответствие расчетов выбросов')
      )).toBe(true);
    });
  });

  describe('checkCBAMSubscription', () => {
    it('должен вернуть true для активной CBAM подписки', async () => {
      const mockGetActiveSubscription = jest.fn().mockResolvedValue({
        id: 'sub_1',
        organizationId: 'org_1',
        planType: 'CBAM_ADDON',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockSubscriptionService.prototype.getActiveSubscription = mockGetActiveSubscription;

      const result = await checkCBAMSubscription('org_1');

      expect(result).toBe(true);
      expect(mockGetActiveSubscription).toHaveBeenCalledWith('org_1');
    });

    it('должен вернуть false для отсутствующей подписки', async () => {
      const mockGetActiveSubscription = jest.fn().mockResolvedValue(null);
      mockSubscriptionService.prototype.getActiveSubscription = mockGetActiveSubscription;

      const result = await checkCBAMSubscription('org_1');

      expect(result).toBe(false);
    });

    it('должен вернуть false для неактивной подписки', async () => {
      const mockGetActiveSubscription = jest.fn().mockResolvedValue({
        id: 'sub_1',
        organizationId: 'org_1',
        planType: 'CBAM_ADDON',
        status: 'CANCELLED',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockSubscriptionService.prototype.getActiveSubscription = mockGetActiveSubscription;

      const result = await checkCBAMSubscription('org_1');

      expect(result).toBe(false);
    });

    it('должен вернуть false для просроченной подписки', async () => {
      const mockGetActiveSubscription = jest.fn().mockResolvedValue({
        id: 'sub_1',
        organizationId: 'org_1',
        planType: 'CBAM_ADDON',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // -1 день
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockSubscriptionService.prototype.getActiveSubscription = mockGetActiveSubscription;

      const result = await checkCBAMSubscription('org_1');

      expect(result).toBe(false);
    });
  });

  describe('calculateCBAMPricing', () => {
    const testLineItems: Omit<CBAMLineItem, 'price'>[] = [
      {
        productName: 'Цемент',
        carbonIntensity: 0.8,
        quantity: 100,
        totalEmissions: 80
      },
      {
        productName: 'Сталь',
        carbonIntensity: 1.0,
        quantity: 50,
        totalEmissions: 50
      }
    ];

    const testRequest: CBAMPricingRequest = {
      organizationId: 'org_1',
      lineItems: testLineItems,
      reportType: 'CBAM_XML'
    };

    it('должен рассчитать стоимость для организации без подписки', async () => {
      // Мокаем отсутствие подписки
      const mockGetActiveSubscription = jest.fn().mockResolvedValue(null);
      mockSubscriptionService.prototype.getActiveSubscription = mockGetActiveSubscription;

      const result = await calculateCBAMPricing(testRequest);

      expect(result.hasSubscription).toBe(false);
      expect(result.totalEmissions).toBe(130); // 80 + 50
      expect(result.totalPrice).toBe(130 * CBAM_RATE_RUB_PER_TON); // 33150
      expect(result.currency).toBe('RUB');
      expect(result.ratePerTon).toBe(CBAM_RATE_RUB_PER_TON);
      expect(result.lineItems).toHaveLength(2);
      
      // Проверяем цены по строкам
      expect(result.lineItems[0].price).toBe(80 * CBAM_RATE_RUB_PER_TON); // 20400
      expect(result.lineItems[1].price).toBe(50 * CBAM_RATE_RUB_PER_TON); // 12750
    });

    it('должен рассчитать бесплатную стоимость для подписчика CBAM', async () => {
      // Мокаем активную CBAM подписку
      const mockGetActiveSubscription = jest.fn().mockResolvedValue({
        id: 'sub_1',
        organizationId: 'org_1',
        planType: 'CBAM_ADDON',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockSubscriptionService.prototype.getActiveSubscription = mockGetActiveSubscription;

      const result = await calculateCBAMPricing(testRequest);

      expect(result.hasSubscription).toBe(true);
      expect(result.totalEmissions).toBe(130);
      expect(result.totalPrice).toBe(0); // Бесплатно для подписчиков
      expect(result.lineItems[0].price).toBe(0);
      expect(result.lineItems[1].price).toBe(0);
    });

    it('должен правильно округлять цены до копеек', async () => {
      // Мокаем отсутствие подписки
      const mockGetActiveSubscription = jest.fn().mockResolvedValue(null);
      mockSubscriptionService.prototype.getActiveSubscription = mockGetActiveSubscription;

      const fractionalRequest: CBAMPricingRequest = {
        organizationId: 'org_1',
        lineItems: [{
          productName: 'Тест',
          carbonIntensity: 0.333,
          quantity: 100,
          totalEmissions: 33.3
        }],
        reportType: 'CBAM_CSV'
      };

      const result = await calculateCBAMPricing(fractionalRequest);

      // Проверяем округление до копеек
      expect(result.totalEmissions).toBe(33.3);
      expect(result.totalPrice).toBe(Math.round(33.3 * CBAM_RATE_RUB_PER_TON * 100) / 100);
    });
  });

  describe('getCBAMPricingInfo', () => {
    it('должен вернуть корректную информацию о тарифах', () => {
      const info = getCBAMPricingInfo();

      expect(info.ratePerTon).toBe(CBAM_RATE_RUB_PER_TON);
      expect(info.currency).toBe('RUB');
      expect(info.supportedReports).toContain('CBAM_XML');
      expect(info.supportedReports).toContain('CBAM_CSV');
      expect(info.description).toContain('строки CBAM отчета');
      expect(info.subscriptionBenefit).toContain('бесплатно');
    });
  });

  describe('CBAM_RATE_RUB_PER_TON константа', () => {
    it('должна быть равна 255 рублям за тонну', () => {
      expect(CBAM_RATE_RUB_PER_TON).toBe(255);
    });
  });
});
