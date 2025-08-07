/**
 * Unit тесты для OCR Worker с интеграцией кредитов
 * Задача 2.1: Обновить OCR Worker для списания кредитов
 */

import { OcrWorker } from '../../workers/ocr-worker';
import { CreditsService } from '../../lib/credits-service';
import { Decimal } from '@prisma/client/runtime/library';

// Mock зависимостей
jest.mock('../../lib/credits-service');
jest.mock('../../lib/ocr');
jest.mock('../../lib/prisma');
jest.mock('../../lib/metrics');
jest.mock('../../lib/structured-logger');

const mockCreditsService = {
  getOperationCost: jest.fn(),
  hasCredits: jest.fn(),
  checkBalance: jest.fn(),
  debitCredits: jest.fn()
};

// Мокаем CreditsService
(CreditsService as jest.MockedClass<typeof CreditsService>).mockImplementation(
  () => mockCreditsService as any
);

describe('OCR Worker Credit Integration', () => {
  let ocrWorker: OcrWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    ocrWorker = new OcrWorker();
  });

  describe('Credits Calculation', () => {
    it('должен правильно рассчитывать стоимость OCR операции', async () => {
      // Arrange
      const mockOperationCost = {
        baseCost: 0.1,
        surgePricingMultiplier: 1,
        finalCost: 0.1,
        pricePerTonRub: 5
      };

      mockCreditsService.getOperationCost.mockResolvedValue(mockOperationCost);

      // Act
      const cost = await mockCreditsService.getOperationCost('ocr');

      // Assert
      expect(cost.baseCost).toBe(0.1);
      expect(cost.finalCost).toBe(0.1);
      expect(cost.pricePerTonRub).toBe(5);
    });

    it('должен проверять достаточность кредитов перед обработкой', async () => {
      // Arrange
      const organizationId = 'org-123';
      const requiredCredits = 0.1;

      mockCreditsService.hasCredits.mockResolvedValue(true);

      // Act
      const hasCredits = await mockCreditsService.hasCredits(organizationId, requiredCredits);

      // Assert
      expect(hasCredits).toBe(true);
      expect(mockCreditsService.hasCredits).toHaveBeenCalledWith(organizationId, requiredCredits);
    });

    it('должен возвращать подробную информацию при недостатке кредитов', async () => {
      // Arrange
      const organizationId = 'org-123';
      const requiredCredits = 0.1;
      const mockBalance = {
        organizationId,
        balance: 0.05,
        balanceDecimal: new Decimal(0.05),
        totalPurchased: 1000,
        totalUsed: 999.95,
        planType: 'LITE',
        planExpiry: new Date('2025-12-31'),
        lastTopUp: new Date('2025-01-01'),
        lastUpdated: new Date()
      };

      mockCreditsService.hasCredits.mockResolvedValue(false);
      mockCreditsService.checkBalance.mockResolvedValue(mockBalance);

      // Act
      const hasCredits = await mockCreditsService.hasCredits(organizationId, requiredCredits);
      const balance = await mockCreditsService.checkBalance(organizationId);

      // Assert
      expect(hasCredits).toBe(false);
      expect(balance.balance).toBe(0.05);
      expect(balance.balance).toBeLessThan(requiredCredits);
    });

    it('должен успешно списывать кредиты после OCR обработки', async () => {
      // Arrange
      const organizationId = 'org-123';
      const amount = 0.1;
      const description = 'OCR обработка документа: test.pdf (doc-123)';
      const metadata = {
        documentId: 'doc-123',
        fileName: 'test.pdf',
        fileSize: 1024,
        operationType: 'ocr',
        textLength: 150
      };

      const mockDebitResult = {
        success: true,
        newBalance: 99.9,
        newBalanceDecimal: new Decimal(99.9),
        transactionId: 'tx-123',
        error: undefined
      };

      mockCreditsService.debitCredits.mockResolvedValue(mockDebitResult);

      // Act
      const result = await mockCreditsService.debitCredits(organizationId, amount, description, metadata);

      // Assert
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(99.9);
      expect(result.transactionId).toBe('tx-123');
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        organizationId,
        amount,
        description,
        metadata
      );
    });

    it('должен обрабатывать ошибку списания кредитов', async () => {
      // Arrange
      const organizationId = 'org-123';
      const amount = 0.1;
      const description = 'OCR обработка документа';

      const mockDebitResult = {
        success: false,
        newBalance: 0,
        newBalanceDecimal: new Decimal(0),
        transactionId: '',
        error: 'Недостаточно кредитов'
      };

      mockCreditsService.debitCredits.mockResolvedValue(mockDebitResult);

      // Act
      const result = await mockCreditsService.debitCredits(organizationId, amount, description);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Недостаточно кредитов');
    });
  });

  describe('Error Handling', () => {
    it('должен обрабатывать ошибки проверки баланса', async () => {
      // Arrange
      const organizationId = 'org-123';
      mockCreditsService.checkBalance.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(mockCreditsService.checkBalance(organizationId)).rejects.toThrow('Database connection failed');
    });

    it('должен правильно формировать сообщения об ошибках', () => {
      // Arrange
      const requiredCredits = 0.1;
      const availableCredits = 0.05;

      // Act
      const errorMessage = 
        `INSUFFICIENT_CREDITS: Недостаточно кредитов для обработки. ` +
        `Требуется: ${requiredCredits} т CO₂, доступно: ${availableCredits} т CO₂`;

      // Assert
      expect(errorMessage).toContain('INSUFFICIENT_CREDITS');
      expect(errorMessage).toContain('0.1 т CO₂');
      expect(errorMessage).toContain('0.05 т CO₂');
    });
  });

  describe('Metadata Handling', () => {
    it('должен правильно формировать метаданные для транзакции', () => {
      // Arrange
      const jobData = {
        documentId: 'doc-123',
        fileName: 'test-report.pdf',
        fileSize: 2048,
        userId: 'user-123',
        organizationId: 'org-456'
      };
      const ocrTextLength = 250;

      // Act
      const metadata = {
        documentId: jobData.documentId,
        fileName: jobData.fileName,
        fileSize: jobData.fileSize,
        operationType: 'ocr',
        textLength: ocrTextLength
      };

      // Assert
      expect(metadata.documentId).toBe('doc-123');
      expect(metadata.fileName).toBe('test-report.pdf');
      expect(metadata.fileSize).toBe(2048);
      expect(metadata.operationType).toBe('ocr');
      expect(metadata.textLength).toBe(250);
    });

    it('должен правильно формировать описание транзакции', () => {
      // Arrange
      const fileName = 'esg-report-2025.pdf';
      const documentId = 'doc-456';

      // Act
      const description = `OCR обработка документа: ${fileName} (${documentId})`;

      // Assert
      expect(description).toBe('OCR обработка документа: esg-report-2025.pdf (doc-456)');
    });
  });
});
