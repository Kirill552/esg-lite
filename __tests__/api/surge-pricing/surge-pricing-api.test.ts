/**
 * Unit тесты для Surge Pricing API endpoints
 * Задача 5.1: Создать Surge Pricing Service - API тестирование
 */

import { NextRequest } from 'next/server';
import { GET as statusGET, POST as statusPOST } from '@/app/api/surge-pricing/status/route';
import { GET as pricingGET, POST as pricingPOST } from '@/app/api/surge-pricing/pricing/route';

// Мокаем Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Мокаем surge pricing service
jest.mock('@/lib/surge-pricing', () => ({
  surgePricingService: {
    getSurgePricingStatus: jest.fn(),
    getSurgePricingNotification: jest.fn(),
    getBannerInfo: jest.fn(),
    getDaysToSurgeEvent: jest.fn(),
    willBeSurgeActive: jest.fn(),
    getConfig: jest.fn(),
    getSurgeMultiplier: jest.fn(),
    calculatePrice: jest.fn()
  }
}));

const { auth } = require('@clerk/nextjs/server');
const mockAuth = auth as jest.MockedFunction<any>;
const mockSurgePricingService = require('@/lib/surge-pricing').surgePricingService;

describe('Surge Pricing API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/surge-pricing/status - GET', () => {
    test('должен возвращать статус surge pricing для аутентифицированного пользователя', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      
      const mockStatus = {
        isActive: true,
        multiplier: 2.0,
        reason: 'Высокий сезон отчетности (15-30 июня)',
        startDate: new Date(2025, 5, 15),
        endDate: new Date(2025, 5, 30),
        timeRemaining: '10 дней до окончания'
      };
      
      const mockNotification = {
        type: 'start',
        message: 'Период surge pricing активен',
        timestamp: new Date(),
        isActive: true,
        daysRemaining: 10
      };
      
      const mockBanner = {
        show: true,
        message: 'Surge период активен!',
        type: 'warning'
      };
      
      const mockDaysToEvent = {
        event: 'end',
        days: 10
      };

      mockSurgePricingService.getSurgePricingStatus.mockReturnValue(mockStatus);
      mockSurgePricingService.getSurgePricingNotification.mockReturnValue(mockNotification);
      mockSurgePricingService.getBannerInfo.mockReturnValue(mockBanner);
      mockSurgePricingService.getDaysToSurgeEvent.mockReturnValue(mockDaysToEvent);

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status');

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      
      // Проверяем основные поля статуса
      expect(data.status.isActive).toBe(mockStatus.isActive);
      expect(data.status.multiplier).toBe(mockStatus.multiplier);
      expect(data.status.reason).toBe(mockStatus.reason);
      expect(data.status.timeRemaining).toBe(mockStatus.timeRemaining);
      
      // Даты в JSON преобразуются в строки
      expect(data.status.startDate).toBe(mockStatus.startDate.toISOString());
      expect(data.status.endDate).toBe(mockStatus.endDate.toISOString());
      
      // Проверяем notification с учетом сериализации дат
      expect(data.notification.type).toBe(mockNotification.type);
      expect(data.notification.message).toBe(mockNotification.message);
      expect(data.notification.isActive).toBe(mockNotification.isActive);
      expect(data.notification.daysRemaining).toBe(mockNotification.daysRemaining);
      expect(data.notification.timestamp).toBe(mockNotification.timestamp.toISOString());
      
      expect(data.bannerInfo).toEqual(mockBanner);
      expect(data.daysToEvent).toEqual(mockDaysToEvent);
      expect(data.requestedDate).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    test('должен принимать кастомную дату через query параметр', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      mockSurgePricingService.getSurgePricingStatus.mockReturnValue({});
      mockSurgePricingService.getSurgePricingNotification.mockReturnValue(null);
      mockSurgePricingService.getBannerInfo.mockReturnValue(null);
      mockSurgePricingService.getDaysToSurgeEvent.mockReturnValue({ event: 'none', days: 0 });

      const testDate = '2025-06-20T12:00:00.000Z';
      const request = new NextRequest(`http://localhost:3000/api/surge-pricing/status?date=${testDate}`);

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.requestedDate).toBe(testDate);
      expect(mockSurgePricingService.getSurgePricingStatus).toHaveBeenCalledWith(new Date(testDate));
    });

    test('должен возвращать 401 для неаутентифицированного пользователя', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status');

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('должен возвращать 400 для невалидной даты', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status?date=invalid-date');

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });
  });

  describe('/api/surge-pricing/status - POST', () => {
    test('должен проверять surge pricing для диапазона дат', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      
      mockSurgePricingService.willBeSurgeActive.mockReturnValue(true);
      mockSurgePricingService.getSurgePricingStatus.mockReturnValue({
        isActive: true,
        multiplier: 2.0
      });
      mockSurgePricingService.getConfig.mockReturnValue({
        surgeStartDate: new Date(2025, 5, 15),
        surgeEndDate: new Date(2025, 5, 30),
        multiplier: 2.0,
        reason: 'Test reason',
        enabled: true
      });

      const requestBody = {
        startDate: '2025-06-10T00:00:00.000Z',
        endDate: '2025-06-25T00:00:00.000Z'
      };

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // Act
      const response = await statusPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.willBeActive).toBe(true);
      expect(data.startStatus).toBeDefined();
      expect(data.endStatus).toBeDefined();
      expect(data.config).toBeDefined();
      expect(data.requestedRange.startDate).toBe(requestBody.startDate);
      expect(data.requestedRange.endDate).toBe(requestBody.endDate);
    });

    test('должен возвращать 400 при отсутствии обязательных параметров', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status', {
        method: 'POST',
        body: JSON.stringify({ startDate: '2025-06-10T00:00:00.000Z' }) // Отсутствует endDate
      });

      // Act
      const response = await statusPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('startDate and endDate are required');
    });

    test('должен возвращать 400 при startDate >= endDate', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const requestBody = {
        startDate: '2025-06-25T00:00:00.000Z',
        endDate: '2025-06-20T00:00:00.000Z' // endDate < startDate
      };

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // Act
      const response = await statusPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('startDate must be before endDate');
    });
  });

  describe('/api/surge-pricing/pricing - GET', () => {
    test('должен рассчитывать цену с surge pricing', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);
      mockSurgePricingService.calculatePrice.mockReturnValue(200);
      mockSurgePricingService.getSurgePricingStatus.mockReturnValue({
        isActive: true,
        multiplier: 2.0,
        reason: 'Test reason'
      });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing?basePrice=100');

      // Act
      const response = await pricingGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.basePrice).toBe(100);
      expect(data.multiplier).toBe(2.0);
      expect(data.finalPrice).toBe(200);
      expect(data.savings).toBe(100); // 100 * (2.0 - 1)
      expect(data.calculation.formula).toBe('100 × 2 = 200');
      expect(data.calculation.isSurgeActive).toBe(true);
      expect(data.calculation.surgeAddition).toBe(100);
    });

    test('должен возвращать 400 при отсутствии basePrice', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing');

      // Act
      const response = await pricingGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('basePrice parameter is required');
    });

    test('должен возвращать 400 для невалидной basePrice', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing?basePrice=-100');

      // Act
      const response = await pricingGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('basePrice must be a positive number');
    });
  });

  describe('/api/surge-pricing/pricing - POST', () => {
    test('должен рассчитывать цены для массива операций', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      
      mockSurgePricingService.getSurgeMultiplier.mockReturnValue(2.0);
      mockSurgePricingService.calculatePrice
        .mockReturnValueOnce(200) // для basePrice 100
        .mockReturnValueOnce(300); // для basePrice 150
      mockSurgePricingService.getSurgePricingStatus.mockReturnValue({
        isActive: true,
        multiplier: 2.0
      });

      const requestBody = {
        operations: [
          { name: 'OCR', basePrice: 100 },
          { name: 'Report Generation', basePrice: 150 }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // Act
      const response = await pricingPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].name).toBe('OCR');
      expect(data.results[0].basePrice).toBe(100);
      expect(data.results[0].finalPrice).toBe(200);
      expect(data.summary.totalOperations).toBe(2);
      expect(data.summary.totalBasePrice).toBe(250); // 100 + 150
      expect(data.summary.totalFinalPrice).toBe(500); // 200 + 300
    });

    test('должен возвращать 400 при отсутствии массива operations', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing', {
        method: 'POST',
        body: JSON.stringify({})
      });

      // Act
      const response = await pricingPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('operations array is required');
    });

    test('должен возвращать 400 для пустого массива operations', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing', {
        method: 'POST',
        body: JSON.stringify({ operations: [] })
      });

      // Act
      const response = await pricingPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('operations array must contain 1-100 items');
    });

    test('должен возвращать 400 для невалидной операции', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const requestBody = {
        operations: [
          { name: 'OCR' } // Отсутствует basePrice
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // Act
      const response = await pricingPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Each operation must have name and positive basePrice');
    });

    test('должен ограничивать размер массива operations', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const operations = Array.from({ length: 101 }, (_, i) => ({
        name: `Operation${i}`,
        basePrice: 100
      }));

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/pricing', {
        method: 'POST',
        body: JSON.stringify({ operations })
      });

      // Act
      const response = await pricingPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('operations array must contain 1-100 items');
    });
  });

  describe('Error Handling', () => {
    test('должен обрабатывать внутренние ошибки сервиса', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      mockSurgePricingService.getSurgePricingStatus.mockImplementation(() => {
        throw new Error('Service error');
      });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status');

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    test('должен обрабатывать ошибки парсинга JSON', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/surge-pricing/status', {
        method: 'POST',
        body: 'invalid json'
      });

      // Act
      const response = await statusPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
