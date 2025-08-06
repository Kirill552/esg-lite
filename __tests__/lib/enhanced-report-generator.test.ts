/**
 * Тесты для Enhanced Report Generator с CBAM Pricing
 * Проверяем интеграцию генерации отчетов с системой тарификации
 */

import {
  generateCBAMReportWithPricing,
  getCBAMReportPricing,
  generate296FZReportWithPricing,
  type CBAMReportGenerationData,
  type CBAMReportGenerationOptions
} from '@/lib/enhanced-report-generator';
import * as reportGenerator from '@/lib/report-generator';
import * as cbamoricing from '@/lib/cbam-pricing';

// Мокаем зависимости
jest.mock('@/lib/report-generator');
jest.mock('@/lib/cbam-pricing');

const mockReportGenerator = reportGenerator as jest.Mocked<typeof reportGenerator>;
const mockCBAMPricing = cbamoricing as jest.Mocked<typeof cbamoricing>;

describe('Enhanced Report Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCBAMReportPricing', () => {
    const testData: CBAMReportGenerationData = {
      organizationId: 'org_123',
      org_name: 'Тестовая Компания',
      org_address: 'Москва, ул. Тестовая, 1',
      signer_name: 'Иванов И.И.',
      sign_date: '2025-01-27',
      generation_date: '2025-01-27',
      generation_time: '10:30:00',
      document_id: 'test_doc_123',
      lineItems: [
        {
          productName: 'Цемент',
          carbonIntensity: 0.8,
          quantity: 100,
          totalEmissions: 80
        }
      ]
    };

    it('должен корректно рассчитать стоимость CBAM отчета', async () => {
      const mockPricingCalculation = {
        lineItems: testData.lineItems!.map(item => ({ ...item, price: 255 * item.totalEmissions })),
        totalEmissions: 80,
        totalPrice: 20400,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: false,
        organizationId: 'org_123'
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);

      const result = await getCBAMReportPricing(testData);

      expect(result.success).toBe(true);
      expect(result.pricing).toEqual(mockPricingCalculation);
      expect(result.canGenerate).toBe(false); // Нет подписки и есть стоимость
      expect(result.reason).toContain('требуется CBAM тариф');
      expect(mockCBAMPricing.calculateCBAMPricing).toHaveBeenCalledWith({
        organizationId: 'org_123',
        lineItems: testData.lineItems,
        reportType: 'CBAM_XML'
      });
    });

    it('должен разрешить генерацию для подписчиков CBAM', async () => {
      const mockPricingCalculation = {
        lineItems: testData.lineItems!.map(item => ({ ...item, price: 0 })),
        totalEmissions: 80,
        totalPrice: 0,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: true,
        organizationId: 'org_123'
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);

      const result = await getCBAMReportPricing(testData);

      expect(result.success).toBe(true);
      expect(result.canGenerate).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('должен извлекать line items из динамических полей', async () => {
      const dataWithDynamicFields: CBAMReportGenerationData = {
        ...testData,
        lineItems: undefined,
        product_1_name: 'Цемент',
        product_1_carbon_intensity: 0.8,
        product_1_quantity: 100,
        product_1_emissions: 80,
        product_2_name: 'Сталь',
        product_2_carbon_intensity: 1.0,
        product_2_quantity: 50,
        product_2_emissions: 50
      };

      const mockPricingCalculation = {
        lineItems: [
          { id: 'product_1', productName: 'Цемент', carbonIntensity: 0.8, quantity: 100, totalEmissions: 80, price: 0 },
          { id: 'product_2', productName: 'Сталь', carbonIntensity: 1.0, quantity: 50, totalEmissions: 50, price: 0 }
        ],
        totalEmissions: 130,
        totalPrice: 0,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: true,
        organizationId: 'org_123'
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);

      const result = await getCBAMReportPricing(dataWithDynamicFields);

      expect(result.success).toBe(true);
      expect(mockCBAMPricing.calculateCBAMPricing).toHaveBeenCalledWith({
        organizationId: 'org_123',
        lineItems: [
          { id: 'product_1', productName: 'Цемент', carbonIntensity: 0.8, quantity: 100, totalEmissions: 80 },
          { id: 'product_2', productName: 'Сталь', carbonIntensity: 1.0, quantity: 50, totalEmissions: 50 }
        ],
        reportType: 'CBAM_XML'
      });
    });

    it('должен отклонить генерацию при отсутствии данных о выбросах', async () => {
      const dataWithoutLineItems: CBAMReportGenerationData = {
        ...testData,
        lineItems: undefined
      };

      const result = await getCBAMReportPricing(dataWithoutLineItems);

      expect(result.success).toBe(true);
      expect(result.canGenerate).toBe(false);
      expect(result.reason).toContain('Отсутствуют данные о выбросах');
    });
  });

  describe('generateCBAMReportWithPricing', () => {
    const testData: CBAMReportGenerationData = {
      organizationId: 'org_123',
      org_name: 'Тестовая Компания',
      org_address: 'Москва, ул. Тестовая, 1',
      signer_name: 'Иванов И.И.',
      sign_date: '2025-01-27',
      generation_date: '2025-01-27',
      generation_time: '10:30:00',
      document_id: 'test_doc_123',
      lineItems: [
        {
          productName: 'Цемент',
          carbonIntensity: 0.8,
          quantity: 100,
          totalEmissions: 80
        }
      ]
    };

    it('должен успешно генерировать отчет для подписчика CBAM', async () => {
      const mockPricingCalculation = {
        lineItems: testData.lineItems!.map(item => ({ ...item, price: 0 })),
        totalEmissions: 80,
        totalPrice: 0,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: true,
        organizationId: 'org_123'
      };

      const mockReportResult = {
        success: true,
        filePath: '/path/to/report.pdf',
        fileName: 'report.pdf',
        fileSize: 1024
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);
      mockReportGenerator.generateCBAMReport.mockResolvedValue(mockReportResult);
      mockCBAMPricing.recordCBAMCharges.mockResolvedValue();

      const result = await generateCBAMReportWithPricing(testData);

      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.filePath).toBe('/path/to/report.pdf');
      expect(result.pricingInfo?.hasSubscription).toBe(true);
      expect(result.pricingInfo?.totalCost).toBe(0);
      expect(result.pricingInfo?.chargeApplied).toBe(true);
      expect(mockReportGenerator.generateCBAMReport).toHaveBeenCalled();
      expect(mockCBAMPricing.recordCBAMCharges).toHaveBeenCalledWith(
        mockPricingCalculation,
        'test_doc_123'
      );
    });

    it('должен блокировать генерацию для организации без подписки', async () => {
      const mockPricingCalculation = {
        lineItems: testData.lineItems!.map(item => ({ ...item, price: 255 * item.totalEmissions })),
        totalEmissions: 80,
        totalPrice: 20400,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: false,
        organizationId: 'org_123'
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);

      const result = await generateCBAMReportWithPricing(testData);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toContain('требуется CBAM тариф или оплата 20400₽');
      expect(result.pricingInfo?.totalCost).toBe(20400);
      expect(mockReportGenerator.generateCBAMReport).not.toHaveBeenCalled();
    });

    it('должен работать в режиме предпросмотра', async () => {
      const mockPricingCalculation = {
        lineItems: testData.lineItems!.map(item => ({ ...item, price: 255 * item.totalEmissions })),
        totalEmissions: 80,
        totalPrice: 20400,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: false,
        organizationId: 'org_123'
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);

      const options: CBAMReportGenerationOptions = { previewMode: true };
      const result = await generateCBAMReportWithPricing(testData, options);

      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.pricingInfo?.totalCost).toBe(20400);
      expect(result.pricingInfo?.chargeApplied).toBe(false);
      expect(mockReportGenerator.generateCBAMReport).not.toHaveBeenCalled();
    });

    it('должен пропускать проверку pricing при skipPricingCheck', async () => {
      const mockReportResult = {
        success: true,
        filePath: '/path/to/report.pdf',
        fileName: 'report.pdf',
        fileSize: 1024
      };

      mockReportGenerator.generateCBAMReport.mockResolvedValue(mockReportResult);

      const options: CBAMReportGenerationOptions = { skipPricingCheck: true };
      const result = await generateCBAMReportWithPricing(testData, options);

      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
      expect(mockCBAMPricing.calculateCBAMPricing).not.toHaveBeenCalled();
      expect(mockReportGenerator.generateCBAMReport).toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки генерации отчета', async () => {
      const mockPricingCalculation = {
        lineItems: testData.lineItems!.map(item => ({ ...item, price: 0 })),
        totalEmissions: 80,
        totalPrice: 0,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: true,
        organizationId: 'org_123'
      };

      const mockReportResult = {
        success: false,
        error: 'Template error'
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);
      mockReportGenerator.generateCBAMReport.mockResolvedValue(mockReportResult);

      const result = await generateCBAMReportWithPricing(testData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template error');
      expect(result.pricingInfo?.hasSubscription).toBe(true);
    });

    it('должен обрабатывать ошибки записи начислений', async () => {
      const mockPricingCalculation = {
        lineItems: testData.lineItems!.map(item => ({ ...item, price: 0 })),
        totalEmissions: 80,
        totalPrice: 0,
        currency: 'RUB' as const,
        ratePerTon: 255,
        hasSubscription: true,
        organizationId: 'org_123'
      };

      const mockReportResult = {
        success: true,
        filePath: '/path/to/report.pdf',
        fileName: 'report.pdf',
        fileSize: 1024
      };

      mockCBAMPricing.calculateCBAMPricing.mockResolvedValue(mockPricingCalculation);
      mockReportGenerator.generateCBAMReport.mockResolvedValue(mockReportResult);
      mockCBAMPricing.recordCBAMCharges.mockRejectedValue(new Error('Database error'));

      const result = await generateCBAMReportWithPricing(testData);

      // Ошибка записи начислений не должна блокировать генерацию
      expect(result.success).toBe(true);
      expect(result.pricingInfo?.chargeApplied).toBe(false);
    });
  });

  describe('generate296FZReportWithPricing', () => {
    it('должен использовать базовую генерацию для 296-FZ отчетов', async () => {
      const testData = {
        org_name: 'Тестовая Компания',
        org_address: 'Москва, ул. Тестовая, 1',
        signer_name: 'Иванов И.И.',
        sign_date: '2025-01-27',
        generation_date: '2025-01-27',
        generation_time: '10:30:00',
        document_id: 'test_doc_123'
      };

      const mockReportResult = {
        success: true,
        filePath: '/path/to/296fz_report.pdf',
        fileName: '296fz_report.pdf',
        fileSize: 2048
      };

      mockReportGenerator.generateReport.mockResolvedValue(mockReportResult);

      const result = await generate296FZReportWithPricing(testData);

      expect(result).toEqual(mockReportResult);
      expect(mockReportGenerator.generateReport).toHaveBeenCalledWith('296-FZ', testData, undefined);
      expect(mockCBAMPricing.calculateCBAMPricing).not.toHaveBeenCalled();
    });
  });
});
