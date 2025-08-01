/**
 * Unit тесты для API endpoint credits pricing с surge pricing
 * Задача 5.2: Интегрировать surge pricing в кредитную систему
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/credits/pricing/route';

// Мокаем все зависимости
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

jest.mock('@/lib/credits-service', () => ({
  creditsService: {
    calculatePriceWithSurge: jest.fn()
  }
}));

import { auth } from '@clerk/nextjs/server';
import { creditsService } from '@/lib/credits-service';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreditsService = creditsService as jest.Mocked<typeof creditsService>;

describe('/api/credits/pricing API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/credits/pricing', () => {
    test('должен возвращать информацию о ценах для аутентифицированного пользователя', async () => {
      // Arrange
      (mockAuth as any).mockResolvedValue({ userId: 'user_123' });
      
      const mockPricingInfo = {
        baseCost: 0.1,
        multiplier: 2.0,
        finalCost: 0.2,
        priceInRubles: 1.0,
        surgeAddition: 0.1,
        surgeAdditionRubles: 0.5,
        surgePricingInfo: {
          status: 'high_season',
          bannerInfo: {
            show: true,
            message: 'Высокий сезон отчетности',
            type: 'warning'
          },
          notification: {
            type: 'start',
            message: 'Началось surge pricing',
            timestamp: new Date()
          },
          isActive: true,
          multiplier: 2.0,
          reason: 'Высокий сезон отчетности'
        },
        operationType: 'ocr'
      };

      mockCreditsService.calculatePriceWithSurge.mockResolvedValue(mockPricingInfo as any);

      const request = new NextRequest('http://localhost:3000/api/credits/pricing?operationType=ocr&emissionVolumeTons=1');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockCreditsService.calculatePriceWithSurge).toHaveBeenCalledWith('ocr', 1, expect.any(Date));
      
      expect(data.baseCost).toBe(0.1);
      expect(data.multiplier).toBe(2.0);
      expect(data.finalCost).toBe(0.2);
      expect(data.priceInRubles).toBe(1.0);
      expect(data.surgeAddition).toBe(0.1);
      expect(data.surgePricingInfo.isActive).toBe(true);
      expect(data.requestedDate).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    test('должен возвращать 401 для неаутентифицированного пользователя', async () => {
      // Arrange
      (mockAuth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/credits/pricing');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('должен возвращать 400 для невалидного типа операции', async () => {
      // Arrange
      (mockAuth as any).mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/credits/pricing?operationType=invalid');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid operationType');
    });
  });

  describe('POST /api/credits/pricing', () => {
    test('должен рассчитывать цены для массива операций', async () => {
      // Arrange
      (mockAuth as any).mockResolvedValue({ userId: 'user_123' });
      
      const mockPricingResult = {
        baseCost: 0.1,
        multiplier: 2.0,
        finalCost: 0.2,
        priceInRubles: 1.0,
        surgeAddition: 0.1,
        surgeAdditionRubles: 0.5,
        surgePricingInfo: {
          status: 'high_season',
          bannerInfo: null,
          notification: null,
          isActive: true,
          multiplier: 2.0,
          reason: 'Высокий сезон отчетности'
        },
        operationType: 'ocr'
      };

      mockCreditsService.calculatePriceWithSurge.mockResolvedValue(mockPricingResult as any);

      const requestBody = {
        operations: [
          { operationType: 'ocr', emissionVolumeTons: 1 }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/credits/pricing', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].operationType).toBe('ocr');
      expect(data.summary.totalOperations).toBe(1);
      expect(data.summary.isSurgeActive).toBe(true);
    });

    test('должен возвращать 400 при отсутствии массива operations', async () => {
      // Arrange
      (mockAuth as any).mockResolvedValue({ userId: 'user_123' });

      const request = new NextRequest('http://localhost:3000/api/credits/pricing', {
        method: 'POST',
        body: JSON.stringify({})
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('operations must be an array');
    });
  });

  describe('Error Handling', () => {
    test('должен обрабатывать внутренние ошибки сервиса', async () => {
      // Arrange
      (mockAuth as any).mockResolvedValue({ userId: 'user_123' });
      mockCreditsService.calculatePriceWithSurge.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/credits/pricing?operationType=ocr');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
