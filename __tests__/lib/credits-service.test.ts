/**
 * Unit тесты для Credits Service
 * Задача 10.1: Создать unit тесты для Credits Service
 * Требования: Тестирование кредитной системы
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CreditTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma перед импортом
jest.mock('../../lib/prisma', () => ({
  prisma: {
    organization_credits: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization_credit_transactions: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Импорт после mock'а
import { CreditsService } from '../../lib/credits-service';
import { prisma } from '../../lib/prisma';

// Type assertion для мocked prisma
const mockPrisma = prisma as any;

describe('CreditsService', () => {
  let creditsService: CreditsService;
  const testOrgId = 'test-org-123';

  beforeEach(() => {
    creditsService = new CreditsService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checkBalance', () => {
    test('должен возвращать баланс кредитов для существующей организации', async () => {
      const mockOrgCredits = {
        id: '1',
        organizationId: testOrgId,
        balance: 1500, // Для совместимости с Prisma
        balance_t_co2: new Decimal('1500.5'),
        totalPurchased: 2000,
        totalUsed: 500,
        planType: 'LITE_ANNUAL',
        planExpiry: new Date('2025-12-31'),
        lastTopUp: new Date('2025-01-15'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-20'),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(mockOrgCredits);

      const result = await creditsService.checkBalance(testOrgId);

      expect(result).toEqual({
        organizationId: testOrgId,
        balance: 1500.5,
        balanceDecimal: new Decimal('1500.5'),
        totalPurchased: 2000,
        totalUsed: 500,
        planType: 'LITE_ANNUAL',
        planExpiry: new Date('2025-12-31'),
        lastTopUp: new Date('2025-01-15'),
        lastUpdated: new Date('2025-01-20'),
      });

      expect(mockPrisma.organization_credits.findUnique).toHaveBeenCalledWith({
        where: { organizationId: testOrgId }
      });
    });

    test('должен создавать новую запись кредитов для новой организации', async () => {
      mockPrisma.organization_credits.findUnique.mockResolvedValue(null);
      
      const newOrgCredits = {
        id: '2',
        organizationId: testOrgId,
        balance: 1000, // Для совместимости с Prisma
        balance_t_co2: new Decimal('1000'),
        totalPurchased: 1000,
        totalUsed: 0,
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.create.mockResolvedValue(newOrgCredits);
      mockPrisma.organization_credit_transactions.create.mockResolvedValue({
        id: 'tx-1',
        organizationId: testOrgId,
        amount: new Decimal('1000'),
        transaction_type: CreditTransactionType.BONUS,
        description: 'Initial free credits for new organization',
        metadata: { source: 'registration_bonus' },
        createdAt: new Date(),
      });

      const result = await creditsService.checkBalance(testOrgId);

      expect(result.balance).toBe(1000);
      expect(result.planType).toBe('FREE');
      expect(mockPrisma.organization_credits.create).toHaveBeenCalledWith({
        data: {
          organizationId: testOrgId,
          balance_t_co2: new Decimal(1000),
          totalPurchased: 1000,
          totalUsed: 0,
          planType: 'FREE'
        }
      });
    });

    test('должен обрабатывать null значения планExpiry и lastTopUp', async () => {
      const mockOrgCredits = {
        id: '1',
        organizationId: testOrgId,
        balance: 500,
        balance_t_co2: new Decimal('500'),
        totalPurchased: 1000,
        totalUsed: 500,
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-20'),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(mockOrgCredits);

      const result = await creditsService.checkBalance(testOrgId);

      expect(result.planExpiry).toBeUndefined();
      expect(result.lastTopUp).toBeUndefined();
    });
  });

  describe('hasCredits', () => {
    test('должен возвращать true когда у организации достаточно кредитов', async () => {
      const mockOrgCredits = {
        id: '1',
        organizationId: testOrgId,
        balance: 500,
        balance_t_co2: new Decimal('500'),
        totalPurchased: 1000,
        totalUsed: 500,
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(mockOrgCredits);

      const result = await creditsService.hasCredits(testOrgId, 100);

      expect(result).toBe(true);
    });

    test('должен возвращать false когда у организации недостаточно кредитов', async () => {
      const mockOrgCredits = {
        id: '1',
        organizationId: testOrgId,
        balance: 50,
        balance_t_co2: new Decimal('50'),
        totalPurchased: 1000,
        totalUsed: 950,
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(mockOrgCredits);

      const result = await creditsService.hasCredits(testOrgId, 100);

      expect(result).toBe(false);
    });

    test('должен возвращать false при ошибке проверки баланса', async () => {
      mockPrisma.organization_credits.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await creditsService.hasCredits(testOrgId, 100);

      expect(result).toBe(false);
    });
  });

  describe('debitCredits', () => {
    test('должен успешно списывать кредиты при достаточном балансе', async () => {
      const currentBalance = {
        id: '1',
        organizationId: testOrgId,
        balance: 1000,
        balance_t_co2: new Decimal('1000'),
        totalPurchased: 1000,
        totalUsed: 0,
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock для ensureOrganizationCredits (через checkBalance)
      mockPrisma.organization_credits.findUnique.mockResolvedValue(currentBalance);

      // Mock для транзакции - упрощенный подход
      const mockTransactionResult = {
        transaction: { id: 'tx-debit-1' },
        newBalance: new Decimal('900')
      };
      
      mockPrisma.$transaction.mockResolvedValue(mockTransactionResult);

      const result = await creditsService.debitCredits(testOrgId, 100, 'OCR processing');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(900);
      expect(result.transactionId).toBe('tx-debit-1');
      expect(result.error).toBeUndefined();
    });

    test('должен возвращать ошибку при недостаточном балансе', async () => {
      const currentBalance = {
        id: '1',
        organizationId: testOrgId,
        balance: 50,
        balance_t_co2: new Decimal('50'),
        totalPurchased: 1000,
        totalUsed: 950,
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(currentBalance);

      const result = await creditsService.debitCredits(testOrgId, 100, 'OCR processing');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient credits. Required: 100, Available: 50');
      expect(result.transactionId).toBe('');
    });
  });

  describe('creditCredits', () => {
    test('должен успешно пополнять баланс кредитов', async () => {
      // Mock для транзакции - упрощенный подход
      const mockTransactionResult = {
        transaction: { id: 'tx-credit-1' },
        newBalance: new Decimal('700')
      };
      
      mockPrisma.$transaction.mockResolvedValue(mockTransactionResult);

      const result = await creditsService.creditCredits(testOrgId, 200, 'Balance top-up');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(700);
      expect(result.transactionId).toBe('tx-credit-1');
    });
  });

  describe('getTransactionHistory', () => {
    test('должен возвращать историю транзакций с правильной сортировкой', async () => {
      const mockTransactions = [
        {
          id: 'tx-2',
          organizationId: testOrgId,
          amount: new Decimal('-100'),
          transaction_type: CreditTransactionType.DEBIT,
          description: 'OCR processing',
          metadata: null,
          createdAt: new Date('2025-01-20'),
        },
        {
          id: 'tx-1',
          organizationId: testOrgId,
          amount: new Decimal('1000'),
          transaction_type: CreditTransactionType.BONUS,
          description: 'Initial credits',
          metadata: { source: 'registration' },
          createdAt: new Date('2025-01-15'),
        },
      ];

      mockPrisma.organization_credit_transactions.findMany.mockResolvedValue(mockTransactions);

      const result = await creditsService.getTransactionHistory(testOrgId, 10, 0);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-2');
      expect(result[0].amount).toBe(-100);
      expect(result[0].type).toBe(CreditTransactionType.DEBIT);
      expect(result[1].id).toBe('tx-1');
      expect(result[1].amount).toBe(1000);
      expect(result[1].type).toBe(CreditTransactionType.BONUS);
      expect(result[1].metadata).toEqual({ source: 'registration' });

      expect(mockPrisma.organization_credit_transactions.findMany).toHaveBeenCalledWith({
        where: { organizationId: testOrgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0
      });
    });
  });

  describe('getOperationCost', () => {
    test('должен рассчитывать правильную стоимость для разных типов операций', async () => {
      const ocrCost = await creditsService.getOperationCost('ocr', 1, 1);
      expect(ocrCost.baseCost).toBe(0.1);
      expect(ocrCost.finalCost).toBe(0.1);
      expect(ocrCost.pricePerTonRub).toBe(5);
      expect(ocrCost.surgePricingMultiplier).toBe(1);

      const reportCost = await creditsService.getOperationCost('report_generation', 1000, 1);
      expect(reportCost.baseCost).toBe(1); // 0.1% от 1000 т
      expect(reportCost.finalCost).toBe(1);

      const apiCost = await creditsService.getOperationCost('api_call', 1, 2);
      expect(apiCost.baseCost).toBe(0.01);
      expect(apiCost.finalCost).toBe(0.02); // С surge pricing ×2
      expect(apiCost.surgePricingMultiplier).toBe(2);
    });

    test('должен использовать минимальную стоимость для генерации отчетов', async () => {
      const smallReportCost = await creditsService.getOperationCost('report_generation', 10, 1);
      expect(smallReportCost.baseCost).toBe(0.1); // Минимум 0.1 т вместо 0.01 т (0.1% от 10)
    });
  });

  describe('calculateRequiredCredits', () => {
    test('должен учитывать бесплатный лимит для новых организаций', async () => {
      const mockOrgCredits = {
        id: '1',
        organizationId: testOrgId,
        balance: 1500,
        balance_t_co2: new Decimal('1500'),
        totalPurchased: 1500,
        totalUsed: 800, // Еще в пределах бесплатного лимита 1000
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(mockOrgCredits);

      const requiredCredits = await creditsService.calculateRequiredCredits(
        testOrgId, 
        'report_generation', 
        1000, 
        1
      );

      // Операция стоит 1 т CO₂, но у организации есть еще 200 т в рамках бесплатного лимита
      expect(requiredCredits).toBe(0);
    });

    test('должен рассчитывать требуемые кредиты сверх бесплатного лимита', async () => {
      const mockOrgCredits = {
        id: '1',
        organizationId: testOrgId,
        balance: 500,
        balance_t_co2: new Decimal('500'),
        totalPurchased: 1500,
        totalUsed: 1200, // Превышен бесплатный лимит 1000
        planType: 'LITE_ANNUAL',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(mockOrgCredits);

      const requiredCredits = await creditsService.calculateRequiredCredits(
        testOrgId, 
        'report_generation', 
        1000, 
        1
      );

      // Операция стоит 1 т CO₂, бесплатный лимит исчерпан
      expect(requiredCredits).toBe(1);
    });

    test('должен корректно работать с surge pricing', async () => {
      const mockOrgCredits = {
        id: '1',
        organizationId: testOrgId,
        balance: 500,
        balance_t_co2: new Decimal('500'),
        totalPurchased: 1500,
        totalUsed: 1200, // Превышен бесплатный лимит
        planType: 'LITE_ANNUAL',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(mockOrgCredits);

      const requiredCredits = await creditsService.calculateRequiredCredits(
        testOrgId, 
        'ocr', 
        1, 
        2 // Surge pricing ×2
      );

      // OCR стоит 0.1 т, с surge pricing = 0.2 т
      expect(requiredCredits).toBe(0.2);
    });
  });

  describe('error handling', () => {
    test('checkBalance должен выбрасывать ошибку при проблемах с БД', async () => {
      mockPrisma.organization_credits.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(creditsService.checkBalance(testOrgId))
        .rejects
        .toThrow('Failed to check credit balance for organization test-org-123');
    });

    test('debitCredits должен выбрасывать ошибку при проблемах с транзакцией', async () => {
      const currentBalance = {
        id: '1',
        organizationId: testOrgId,
        balance: 1000,
        balance_t_co2: new Decimal('1000'),
        totalPurchased: 1000,
        totalUsed: 0,
        planType: 'FREE',
        planExpiry: null,
        lastTopUp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization_credits.findUnique.mockResolvedValue(currentBalance);
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(creditsService.debitCredits(testOrgId, 100))
        .rejects
        .toThrow('Failed to debit credits for organization test-org-123');
    });

    test('getTransactionHistory должен выбрасывать ошибку при проблемах с БД', async () => {
      mockPrisma.organization_credit_transactions.findMany.mockRejectedValue(new Error('Database error'));

      await expect(creditsService.getTransactionHistory(testOrgId))
        .rejects
        .toThrow('Failed to get transaction history for organization test-org-123');
    });
  });
});
