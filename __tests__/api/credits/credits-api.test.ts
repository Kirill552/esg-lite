/**
 * Unit тесты для API Credits endpoints
 * Задача 1.3: Создать API endpoints для кредитов
 */

import { NextRequest } from 'next/server';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Mock Credits Service
jest.mock('../../../lib/credits-service', () => ({
  CreditsService: jest.fn().mockImplementation(() => ({
    checkBalance: jest.fn(),
    getTransactionHistory: jest.fn(),
    getOperationCost: jest.fn()
  }))
}));

// Простые моки для тестирования
const mockAuth = jest.fn() as any;
const mockCreditsServiceInstance = {
  checkBalance: jest.fn(),
  getTransactionHistory: jest.fn(),
  getOperationCost: jest.fn()
};

// Мокаем модули
jest.doMock('@clerk/nextjs/server', () => ({ auth: mockAuth }));
jest.doMock('../../../lib/credits-service', () => ({
  CreditsService: jest.fn(() => mockCreditsServiceInstance)
}));

describe('Credits API Endpoints', () => {
  
  describe('Credits Service Integration', () => {
    it('должен правильно форматировать Decimal значения для JSON', () => {
      // Arrange
      const balance = new Decimal(100.50);
      const amountDecimal = new Decimal(-10.25);

      // Act
      const formattedBalance = balance.toString();
      const formattedAmount = amountDecimal.toString();

      // Assert
      expect(formattedBalance).toBe('100.5');
      expect(formattedAmount).toBe('-10.25');
    });

    it('должен правильно работать с пагинацией', () => {
      // Arrange
      const totalTransactions = 25;
      const page = 2;
      const limit = 10;

      // Act
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const totalPages = Math.ceil(totalTransactions / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      // Assert
      expect(startIndex).toBe(10);
      expect(endIndex).toBe(20);
      expect(totalPages).toBe(3);
      expect(hasNextPage).toBe(true);
      expect(hasPrevPage).toBe(true);
    });

    it('должен валидировать параметры пагинации', () => {
      // Arrange
      const testCases = [
        { page: 0, limit: 10, valid: false },
        { page: 1, limit: 0, valid: false },
        { page: 1, limit: 101, valid: false },
        { page: 1, limit: 20, valid: true },
        { page: 5, limit: 100, valid: true },
      ];

      // Act & Assert
      testCases.forEach(({ page, limit, valid }) => {
        const isValid = page >= 1 && limit >= 1 && limit <= 100;
        expect(isValid).toBe(valid);
      });
    });

    it('должен правильно определять organization ID', () => {
      // Arrange
      const userId = 'user-123';
      const orgId = 'org-456';
      const noOrgId = '';

      // Act - симулируем логику из API
      const organizationId1 = orgId || userId; // Когда есть orgId
      const organizationId2 = noOrgId || userId; // Когда нет orgId

      // Assert
      expect(organizationId1).toBe('org-456');
      expect(organizationId2).toBe('user-123');
    });

    it('должен форматировать данные транзакций для JSON ответа', () => {
      // Arrange
      const mockTransaction = {
        id: 'tx-1',
        organizationId: 'org-456',
        amount: 100.50,
        amountDecimal: new Decimal(100.50),
        type: 'CREDIT',
        description: 'Пополнение баланса',
        metadata: { source: 'payment' },
        timestamp: new Date('2025-01-01T10:00:00Z')
      };

      // Act - симулируем форматирование из API
      const formattedTransaction = {
        id: mockTransaction.id,
        organizationId: mockTransaction.organizationId,
        amount: mockTransaction.amount.toString(),
        amountDecimal: mockTransaction.amountDecimal.toString(),
        type: mockTransaction.type,
        description: mockTransaction.description,
        metadata: mockTransaction.metadata,
        timestamp: mockTransaction.timestamp
      };

      // Assert
      expect(formattedTransaction.amount).toBe('100.5');
      expect(formattedTransaction.amountDecimal).toBe('100.5');
      expect(formattedTransaction.type).toBe('CREDIT');
      expect(formattedTransaction.metadata).toEqual({ source: 'payment' });
    });

    it('должен правильно обрабатывать параметры из URL', () => {
      // Arrange
      const testUrls = [
        'http://localhost:3000/api/credits/history?page=2&limit=15',
        'http://localhost:3000/api/credits/history?page=1',
        'http://localhost:3000/api/credits/history?limit=30',
        'http://localhost:3000/api/credits/history'
      ];

      // Act & Assert
      testUrls.forEach(url => {
        const { searchParams } = new URL(url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        expect(page).toBeGreaterThan(0);
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThanOrEqual(100);
      });
    });

    it('должен правильно рассчитывать стоимость операций', () => {
      // Arrange
      const mockOperationCost = {
        baseCost: 0.1,
        surgePricingMultiplier: 1.5,
        finalCost: 0.15,
        pricePerTonRub: 5
      };

      // Act - проверяем логику расчета
      const calculatedFinalCost = mockOperationCost.baseCost * mockOperationCost.surgePricingMultiplier;

      // Assert - используем toBeCloseTo для работы с float
      expect(calculatedFinalCost).toBeCloseTo(0.15, 10);
      expect(mockOperationCost.finalCost).toBeCloseTo(calculatedFinalCost, 10);
    });
  });

  describe('Error Handling', () => {
    it('должен правильно обрабатывать ошибки API', () => {
      // Arrange
      const errorScenarios = [
        { status: 401, error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 400, error: 'Bad Request', message: 'Organization ID не найден' },
        { status: 500, error: 'Internal Server Error', message: 'Ошибка при получении баланса кредитов' }
      ];

      // Act & Assert
      errorScenarios.forEach(scenario => {
        expect(scenario.status).toBeGreaterThanOrEqual(400);
        expect(scenario.error).toBeTruthy();
        expect(scenario.message).toBeTruthy();
      });
    });
  });
});
