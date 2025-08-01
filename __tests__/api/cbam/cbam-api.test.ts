/**
 * Тесты для CBAM API endpoints
 * Проверяем работу API расчета стоимости и проверки подписки
 */

import { NextRequest } from 'next/server';
import { POST as pricingPOST, GET as pricingGET } from '@/app/api/cbam/pricing/route';
import { GET as subscriptionGET } from '@/app/api/cbam/subscription/status/route';

// Мокаем зависимости
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

jest.mock('@/lib/cbam-pricing', () => ({
  calculateCBAMPricing: jest.fn(),
  validateCBAMLineItems: jest.fn(),
  getCBAMPricingInfo: jest.fn(),
  checkCBAMSubscription: jest.fn(),
  CBAM_RATE_RUB_PER_TON: 255
}));

import { auth } from '@clerk/nextjs/server';
import { 
  calculateCBAMPricing,
  validateCBAMLineItems,
  getCBAMPricingInfo,
  checkCBAMSubscription
} from '@/lib/cbam-pricing';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCalculateCBAMPricing = calculateCBAMPricing as jest.MockedFunction<typeof calculateCBAMPricing>;
const mockValidateCBAMLineItems = validateCBAMLineItems as jest.MockedFunction<typeof validateCBAMLineItems>;
const mockGetCBAMPricingInfo = getCBAMPricingInfo as jest.MockedFunction<typeof getCBAMPricingInfo>;
const mockCheckCBAMSubscription = checkCBAMSubscription as jest.MockedFunction<typeof checkCBAMSubscription>;

describe('CBAM API endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/cbam/pricing', () => {
    const createRequest = (body: any) => {
      return {
        json: async () => body,
        url: 'http://localhost:3000/api/cbam/pricing'
      } as NextRequest;
    };

    it('должен корректно рассчитать стоимость CBAM отчета', async () => {
      // Мокаем авторизацию
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);

      // Мокаем валидацию
      mockValidateCBAMLineItems.mockReturnValue({
        valid: true,
        errors: []
      });

      // Мокаем расчет стоимости
      const mockPricingResult = {
        lineItems: [
          {
            id: 'line_1',
            productName: 'Цемент',
            carbonIntensity: 0.8,
            quantity: 100,
            totalEmissions: 80,
            price: 20400
          }
        ],
        totalEmissions: 80,
        totalPrice: 20400,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: false,
        organizationId: 'org_1'
      };

      mockCalculateCBAMPricing.mockResolvedValue(mockPricingResult);

      const requestBody = {
        organizationId: 'org_1',
        reportType: 'CBAM_XML',
        lineItems: [
          {
            productName: 'Цемент',
            carbonIntensity: 0.8,
            quantity: 100,
            totalEmissions: 80
          }
        ]
      };

      const request = createRequest(requestBody);
      const response = await pricingPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalPrice).toBe(20400);
      expect(data.data.hasSubscription).toBe(false);
      expect(data.meta.reportType).toBe('CBAM_XML');
      expect(data.meta.lineCount).toBe(1);
    });

    it('должен вернуть ошибку для неавторизованного пользователя', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = createRequest({});
      const response = await pricingPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('должен вернуть ошибку для некорректного типа отчета', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);

      const requestBody = {
        organizationId: 'org_1',
        reportType: 'INVALID_TYPE',
        lineItems: []
      };

      const request = createRequest(requestBody);
      const response = await pricingPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toContain('Некорректный тип отчета');
    });

    it('должен вернуть ошибку валидации для некорректных данных', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);

      mockValidateCBAMLineItems.mockReturnValue({
        valid: false,
        errors: ['Строка 1: отсутствует название продукта']
      });

      const requestBody = {
        organizationId: 'org_1',
        reportType: 'CBAM_XML',
        lineItems: [
          {
            productName: '',
            carbonIntensity: 0.8,
            quantity: 100,
            totalEmissions: 80
          }
        ]
      };

      const request = createRequest(requestBody);
      const response = await pricingPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
      expect(data.details).toContain('Строка 1: отсутствует название продукта');
    });

    it('должен обработать ошибку сервиса', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);
      mockValidateCBAMLineItems.mockReturnValue({ valid: true, errors: [] });
      mockCalculateCBAMPricing.mockRejectedValue(new Error('Database error'));

      const request = createRequest({
        organizationId: 'org_1',
        reportType: 'CBAM_XML',
        lineItems: []
      });

      const response = await pricingPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
    });
  });

  describe('GET /api/cbam/pricing', () => {
    const createGetRequest = () => {
      return {
        url: 'http://localhost:3000/api/cbam/pricing'
      } as NextRequest;
    };

    it('должен вернуть информацию о тарифах', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);

      const mockPricingInfo = {
        ratePerTon: 255,
        currency: 'RUB',
        description: 'Стоимость обработки строки CBAM отчета',
        subscriptionBenefit: 'Для владельцев CBAM подписки - бесплатно',
        calculationMethod: 'Цена = количество тонн CO₂ × 255₽/т',
        supportedReports: ['CBAM_XML', 'CBAM_CSV']
      };

      mockGetCBAMPricingInfo.mockReturnValue(mockPricingInfo);

      const request = createGetRequest();
      const response = await pricingGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.ratePerTon).toBe(255);
      expect(data.data.currency).toBe('RUB');
    });

    it('должен требовать авторизацию', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = createGetRequest();
      const response = await pricingGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/cbam/subscription/status', () => {
    const createStatusRequest = (organizationId?: string) => {
      const url = organizationId 
        ? `http://localhost:3000/api/cbam/subscription/status?organizationId=${organizationId}`
        : 'http://localhost:3000/api/cbam/subscription/status';
      
      return {
        url
      } as NextRequest;
    };

    it('должен вернуть статус подписки для подписчика', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);
      mockCheckCBAMSubscription.mockResolvedValue(true);

      const request = createStatusRequest('org_1');
      const response = await subscriptionGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.hasActiveSubscription).toBe(true);
      expect(data.data.pricing.ratePerTon).toBe(0);
      expect(data.data.benefits).toContain('Безлимитная генерация CBAM отчетов');
    });

    it('должен вернуть статус для организации без подписки', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);
      mockCheckCBAMSubscription.mockResolvedValue(false);

      const request = createStatusRequest('org_2');
      const response = await subscriptionGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.hasActiveSubscription).toBe(false);
      expect(data.data.pricing.ratePerTon).toBe(255);
      expect(data.data.benefits).toContain('Тариф: 255₽ за тонну CO₂');
    });

    it('должен требовать organizationId', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_1' } as any);

      const request = createStatusRequest();
      const response = await subscriptionGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
      expect(data.message).toContain('Не указан organizationId');
    });

    it('должен требовать авторизацию', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = createStatusRequest('org_1');
      const response = await subscriptionGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
