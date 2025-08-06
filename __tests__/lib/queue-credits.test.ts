/**
 * Тесты для Queue Manager с интеграцией Credits Service
 * Задача 2.2: Тестирование проверки кредитов перед добавлением в очередь
 */

import { QueueManager } from '../../lib/queue';
import { creditsService } from '../../lib/credits-service';

// Мокируем pg-boss
jest.mock('pg-boss');

// Мокируем CreditsService
jest.mock('../../lib/credits-service', () => ({
  creditsService: {
    hasCredits: jest.fn(),
    getOperationCost: jest.fn(),
    debitCredits: jest.fn(),
    checkBalance: jest.fn()
  }
}));

// Мокируем createPgBoss
jest.mock('../../lib/pg-boss-config', () => ({
  createPgBoss: jest.fn().mockResolvedValue({
    send: jest.fn(),
    work: jest.fn(),
    stop: jest.fn(),
    createQueue: jest.fn()
  }),
  QUEUE_NAMES: {
    OCR: 'ocr'
  },
  JOB_PRIORITIES: {
    NORMAL: 0,
    HIGH: 1,
    URGENT: 2
  }
}));

describe('Queue Manager - Credits Integration', () => {
  let queueManager: QueueManager;
  let mockCreditsService: jest.Mocked<typeof creditsService>;
  let mockBoss: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    queueManager = new QueueManager();
    await queueManager.initialize();

    // Получаем мок CreditsService
    mockCreditsService = (queueManager as any).creditsService;
    
    // Получаем мок pg-boss
    mockBoss = (queueManager as any).boss;
  });

  describe('addOcrJob', () => {
    const mockJobData = {
      documentId: 'test-doc-123',
      fileKey: 'uploads/test-file.pdf',
      fileName: 'test-file.pdf',
      fileSize: 1024000,
      organizationId: 'org-123',
      userId: 'user-456'
    };

    it('должен успешно добавить задачу при достаточном балансе кредитов', async () => {
      // Настройка моков
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 1,
        finalCost: 1,
        pricePerTonRub: 5
      });
      
      mockCreditsService.hasCredits.mockResolvedValue(true);
      
      mockCreditsService.debitCredits.mockResolvedValue({
        success: true,
        newBalance: 9,
        newBalanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(9),
        transactionId: 'trans-123'
      });
      
      mockBoss.send.mockResolvedValue('job-123');

      // Выполнение
      const jobId = await queueManager.addOcrJob(mockJobData);

      // Проверки
      expect(jobId).toBe('job-123');
      expect(mockCreditsService.getOperationCost).toHaveBeenCalledWith('ocr');
      expect(mockCreditsService.hasCredits).toHaveBeenCalledWith('org-123', 1);
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'org-123',
        1,
        'Credits blocked for OCR job: test-doc-123'
      );
      expect(mockBoss.send).toHaveBeenCalledWith(
        'ocr',
        expect.objectContaining({
          ...mockJobData,
          _credits: expect.objectContaining({
            organizationId: 'org-123',
            blockedAmount: 1,
            blockingTransactionId: 'trans-123'
          })
        }),
        expect.objectContaining({
          priority: 0,
          retryLimit: 3,
          expireInHours: 1
        })
      );
    });

    it('должен отклонить задачу при недостаточном балансе', async () => {
      // Настройка моков
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 2,
        finalCost: 2,
        pricePerTonRub: 5
      });
      
      mockCreditsService.hasCredits.mockResolvedValue(false);
      
      mockCreditsService.checkBalance.mockResolvedValue({
        organizationId: 'org-123',
        balance: 1,
        balanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(1),
        totalPurchased: 10,
        totalUsed: 9,
        planType: 'BASIC',
        lastUpdated: new Date()
      });

      // Выполнение и проверка
      await expect(queueManager.addOcrJob(mockJobData))
        .rejects.toThrow('INSUFFICIENT_CREDITS: Недостаточно кредитов для добавления задачи в очередь. Требуется: 2 т CO₂, доступно: 1 т CO₂');

      expect(mockCreditsService.hasCredits).toHaveBeenCalledWith('org-123', 2);
      expect(mockCreditsService.checkBalance).toHaveBeenCalledWith('org-123');
      expect(mockBoss.send).not.toHaveBeenCalled();
    });

    it('должен обработать ошибку блокировки кредитов', async () => {
      // Настройка моков
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 1,
        finalCost: 1,
        pricePerTonRub: 5
      });
      
      mockCreditsService.hasCredits.mockResolvedValue(true);
      
      mockCreditsService.debitCredits.mockResolvedValue({
        success: false,
        newBalance: 10,
        newBalanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(10),
        transactionId: '',
        error: 'Database connection failed'
      });

      // Выполнение и проверка
      await expect(queueManager.addOcrJob(mockJobData))
        .rejects.toThrow('CREDITS_BLOCKING_FAILED: Database connection failed');

      expect(mockBoss.send).not.toHaveBeenCalled();
    });

    it('должен разблокировать кредиты при ошибке добавления в очередь', async () => {
      // Настройка моков
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 1,
        finalCost: 1,
        pricePerTonRub: 5
      });
      
      mockCreditsService.hasCredits.mockResolvedValue(true);
      
      mockCreditsService.debitCredits.mockResolvedValue({
        success: true,
        newBalance: 9,
        newBalanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(9),
        transactionId: 'trans-123'
      });
      
      mockBoss.send.mockRejectedValue(new Error('Queue is full'));

      // Выполнение и проверка
      await expect(queueManager.addOcrJob(mockJobData))
        .rejects.toThrow('Queue is full');

      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'org-123',
        1,
        'Credits blocked for OCR job: test-doc-123'
      );
      
      // Проверяем, что задача не была добавлена
      expect(mockBoss.send).toHaveBeenCalledTimes(1);
    });

    it('должен использовать приоритет urgent с surge pricing', async () => {
      // Настройка моков  
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 2,
        finalCost: 2,
        pricePerTonRub: 5
      });
      
      mockCreditsService.hasCredits.mockResolvedValue(true);
      
      mockCreditsService.debitCredits.mockResolvedValue({
        success: true,
        newBalance: 8,
        newBalanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(8),
        transactionId: 'trans-123'
      });
      
      mockBoss.send.mockResolvedValue('job-urgent-123');

      // Выполнение
      const jobId = await queueManager.addOcrJob(mockJobData, { priority: 'urgent' });

      // Проверки
      expect(jobId).toBe('job-urgent-123');
      expect(mockBoss.send).toHaveBeenCalledWith(
        'ocr',
        expect.objectContaining({
          _credits: expect.objectContaining({
            blockedAmount: 2,
            operationCost: expect.objectContaining({
              surgePricingMultiplier: 2
            })
          })
        }),
        expect.objectContaining({
          priority: 2, // URGENT priority
        })
      );
    });

    it('должен корректно обрабатывать userId вместо organizationId', async () => {
      const jobDataWithUserId = {
        documentId: 'test-doc-123',
        fileKey: 'uploads/test-file.pdf',
        fileName: 'test-file.pdf',
        fileSize: 1024000,
        userId: 'user-456'
      };

      // Настройка моков
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 1,
        finalCost: 1,
        pricePerTonRub: 5
      });
      
      mockCreditsService.hasCredits.mockResolvedValue(true);
      
      mockCreditsService.debitCredits.mockResolvedValue({
        success: true,
        newBalance: 9,
        newBalanceDecimal: new (require('@prisma/client/runtime/library').Decimal)(9),
        transactionId: 'trans-123'
      });
      
      mockBoss.send.mockResolvedValue('job-123');

      // Выполнение
      await queueManager.addOcrJob(jobDataWithUserId);

      // Проверки - должен использовать userId как organizationId
      expect(mockCreditsService.hasCredits).toHaveBeenCalledWith('user-456', 1);
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'user-456',
        1,
        'Credits blocked for OCR job: test-doc-123'
      );
    });
  });

  describe('getSurgePricingInfo', () => {
    it('должен возвращать информацию о surge pricing', async () => {
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 2,
        finalCost: 2,
        pricePerTonRub: 5
      });

      const info = await queueManager.getSurgePricingInfo();

      expect(info).toEqual({
        isSurge: true,
        multiplier: 2
      });
      expect(mockCreditsService.getOperationCost).toHaveBeenCalledWith('ocr');
    });

    it('должен возвращать информацию без surge pricing', async () => {
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 1,
        finalCost: 1,
        pricePerTonRub: 5
      });

      const info = await queueManager.getSurgePricingInfo();

      expect(info).toEqual({
        isSurge: false,
        multiplier: 1
      });
    });
  });
});
