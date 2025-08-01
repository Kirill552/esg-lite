/**
 * End-to-End тесты для системы очередей
 * Задача 13.1: Написать end-to-end тесты
 * Требования: 1.1, 1.2, 4.1, 4.2, 4.3
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock модули для e2e тестов
jest.mock('../../lib/prisma', () => ({
  prisma: {
    document: {
      create: jest.fn() as jest.MockedFunction<any>,
      update: jest.fn() as jest.MockedFunction<any>,
      findUnique: jest.fn() as jest.MockedFunction<any>
    },
    user: {
      findUnique: jest.fn() as jest.MockedFunction<any>
    },
    rateLimit: {
      upsert: jest.fn() as jest.MockedFunction<any>,
      findUnique: jest.fn() as jest.MockedFunction<any>,
      deleteMany: jest.fn() as jest.MockedFunction<any>
    }
  }
}));

jest.mock('../../lib/pg-boss-config', () => ({
  createPgBoss: jest.fn() as jest.MockedFunction<any>,
  QUEUE_NAMES: {
    OCR: 'ocr-queue'
  },
  JOB_PRIORITIES: {
    NORMAL: 5,
    HIGH: 10,
    URGENT: 15
  }
}));

jest.mock('../../lib/ocr', () => ({
  processS3File: jest.fn() as jest.MockedFunction<any>
}));

jest.mock('../../lib/credits-service', () => ({
  creditsService: {
    hasCredits: jest.fn() as jest.MockedFunction<any>,
    debitCredits: jest.fn() as jest.MockedFunction<any>
  }
}));

jest.mock('../../lib/surge-pricing', () => ({
  surgePricingService: {
    getSurgeMultiplier: jest.fn() as jest.MockedFunction<any>,
    isSurgePeriod: jest.fn() as jest.MockedFunction<any>,
    getJobPriority: jest.fn() as jest.MockedFunction<any>
  }
}));

jest.mock('../../lib/metrics', () => ({
  metricsCollector: {
    recordProcessingTime: jest.fn() as jest.MockedFunction<any>,
    recordError: jest.fn() as jest.MockedFunction<any>
  }
}));

// Импорты после моков
import { QueueManager } from '../../lib/queue';
import { OcrWorker } from '../../workers/ocr-worker';
import { RateLimiter } from '../../lib/rate-limiter';

// Получаем ссылки на моки
const mockPrisma = require('../../lib/prisma').prisma;
const mockCreatePgBoss = require('../../lib/pg-boss-config').createPgBoss;
const mockProcessS3File = require('../../lib/ocr').processS3File;
const mockCreditsService = require('../../lib/credits-service').creditsService;
const mockSurgePricingService = require('../../lib/surge-pricing').surgePricingService;
const mockMetricsCollector = require('../../lib/metrics').metricsCollector;

describe('Queue E2E Tests', () => {
  let queueManager: QueueManager;
  let ocrWorker: OcrWorker;
  let rateLimiter: RateLimiter;
  let mockBoss: any;

  beforeEach(async () => {
    // Сбрасываем моки перед каждым тестом
    jest.clearAllMocks();
    
    // Создаем мок pg-boss
    mockBoss = {
      send: jest.fn(),
      work: jest.fn(),
      stop: jest.fn(),
      getQueueSize: jest.fn(),
      publish: jest.fn(),
      getJobById: jest.fn(),
      deleteQueue: jest.fn()
    };
    
    mockCreatePgBoss.mockResolvedValue(mockBoss);
    
    // Создаем новые экземпляры для каждого теста
    queueManager = new QueueManager();
    ocrWorker = new OcrWorker({ concurrency: 1, pollInterval: 100, maxRetries: 2 });
    rateLimiter = new RateLimiter({ windowSizeMs: 60000, maxRequests: 10, cleanupIntervalMs: 30000 });
    
    // Настройка моков по умолчанию
    mockCreditsService.hasCredits.mockResolvedValue(true);
    mockCreditsService.debitCredits.mockResolvedValue(undefined);
    mockSurgePricingService.getSurgeMultiplier.mockReturnValue(1);
    mockSurgePricingService.isSurgePeriod.mockReturnValue(false);
    mockSurgePricingService.getJobPriority.mockReturnValue('normal');
    mockProcessS3File.mockResolvedValue('Extracted text from document');
    mockMetricsCollector.recordProcessingTime.mockResolvedValue(undefined);
    mockMetricsCollector.recordError.mockResolvedValue(undefined);
    
    // Настройка моков Prisma
    mockPrisma.document.create.mockResolvedValue({
      id: 'doc-123',
      fileName: 'test.pdf',
      fileSize: 1024,
      status: 'QUEUED',
      userId: 'user-123',
      organizationId: 'org-123'
    });
    
    mockPrisma.document.update.mockResolvedValue({
      id: 'doc-123',
      status: 'PROCESSED',
      ocrProcessed: true
    });
    
    mockPrisma.document.findUnique.mockResolvedValue({
      id: 'doc-123',
      fileName: 'test.pdf',
      status: 'PROCESSED',
      ocrProcessed: true,
      ocrData: {
        fullText: 'Extracted text from document',
        textLength: 28
      }
    });
    
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      organizationId: 'org-123'
    });
    
    // Настройка моков для rate limiting
    mockPrisma.rateLimit.upsert.mockResolvedValue({
      organizationId: 'org-123',
      requestCount: 5,
      windowStart: new Date(),
      updatedAt: new Date()
    });
    
    mockPrisma.rateLimit.deleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(async () => {
    // Очистка после каждого теста
    try {
      if (queueManager) {
        await queueManager.stop();
      }
    } catch (error) {
      // Игнорируем ошибки при остановке в тестах
    }
    
    try {
      if (ocrWorker) {
        await ocrWorker.stop();
      }
    } catch (error) {
      // Игнорируем ошибки при остановке в тестах
    }
    
    try {
      if (rateLimiter) {
        await rateLimiter.stop();
      }
    } catch (error) {
      // Игнорируем ошибки при остановке в тестах
    }
    
    // Даём время на завершение асинхронных операций
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Полный цикл обработки OCR задачи', () => {
    test('должен обработать документ от загрузки до получения результата', async () => {
      // Arrange - подготовка данных
      const fileData = {
        documentId: 'doc-123',
        fileKey: 'files/test-document.pdf',
        fileName: 'test-document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        userId: 'user-123',
        organizationId: 'org-123'
      };

      mockBoss.send.mockResolvedValue('job-123');

      // Act 1: Добавление задачи в очередь (требование 1.1)
      await queueManager.initialize();
      const jobId = await queueManager.addOcrJob(fileData);

      // Assert 1: Задача добавлена в очередь
      expect(jobId).toBe('job-123');
      expect(mockBoss.send).toHaveBeenCalledWith('ocr-queue', expect.objectContaining({
        fileName: 'test-document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        userId: 'user-123',
        organizationId: 'org-123'
      }), expect.any(Object));

      // Act 2: Запуск worker и обработка задачи (требование 1.2)
      await ocrWorker.start();
      
      // Симулируем обработку задачи worker'ом
      const workCall = mockBoss.work.mock.calls[0];
      const processJobCallback = workCall[2];
      
      const mockJob = {
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test-document.pdf',
          fileName: 'test-document.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      const result = await processJobCallback(mockJob);

      // Assert 2: Задача обработана успешно
      expect(result).toEqual({
        documentId: 'doc-123',
        text: 'Extracted text from document',
        textLength: 28,
        confidence: 0.95,
        processedAt: expect.any(String)
      });

      // Assert 3: Статус документа обновлен (требование 1.3)
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: {
          status: 'PROCESSED',
          ocrProcessed: true,
          ocrData: {
            fullText: 'Extracted text from document',
            textPreview: 'Extracted text from document',
            textLength: 28,
            processedAt: expect.any(String)
          },
          ocrConfidence: 0.95
        }
      });

      // Assert 4: Кредиты списаны
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'org-123',
        1,
        'OCR processing: doc-123'
      );

      // Assert 5: Метрики записаны
      expect(mockMetricsCollector.recordProcessingTime).toHaveBeenCalledWith(
        'job-123',
        expect.any(Number)
      );
    });

    test('должен обработать ошибку OCR и обновить статус документа', async () => {
      // Arrange
      mockProcessS3File.mockRejectedValue(new Error('OCR processing failed'));
      
      const fileData = {
        documentId: 'doc-456',
        fileKey: 'files/corrupted.pdf',
        fileName: 'corrupted.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        userId: 'user-123',
        organizationId: 'org-123'
      };

      mockBoss.send.mockResolvedValue('job-456');

      // Act 1: Добавление задачи
      await queueManager.initialize();
      await queueManager.addOcrJob(fileData);

      // Act 2: Обработка с ошибкой
      await ocrWorker.start();
      
      const workCall = mockBoss.work.mock.calls[0];
      const processJobCallback = workCall[2];
      
      const mockJob = {
        id: 'job-456',
        data: {
          documentId: 'doc-456',
          fileKey: 'files/corrupted.pdf',
          fileName: 'corrupted.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      // Assert: Ошибка обработана корректно
      await expect(processJobCallback(mockJob)).rejects.toThrow('OCR processing failed');

      // Assert: Статус документа обновлен на ошибку
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-456' },
        data: {
          status: 'FAILED',
          ocrData: {
            error: 'OCR processing failed',
            processedAt: expect.any(String)
          }
        }
      });

      // Assert: Метрика ошибки записана
      expect(mockMetricsCollector.recordError).toHaveBeenCalledWith(
        'job-456',
        'Error',
        'OCR processing failed'
      );
    });
  });

  describe('Интеграция с Rate Limiting', () => {
    test('должен отклонить задачу при превышении лимита запросов', async () => {
      // Arrange
      const organizationId = 'org-123';
      
      // Настраиваем мок для превышения лимита
      mockPrisma.rateLimit = {
        upsert: jest.fn() as jest.MockedFunction<any>,
        findUnique: jest.fn() as jest.MockedFunction<any>,
        deleteMany: jest.fn() as jest.MockedFunction<any>
      };
      
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 10, // Достигнут лимит
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('должен разрешить задачу при наличии кредитов и в пределах лимита', async () => {
      // Arrange
      const organizationId = 'org-123';
      
      mockPrisma.rateLimit = {
        upsert: jest.fn() as jest.MockedFunction<any>,
        findUnique: jest.fn() as jest.MockedFunction<any>,
        deleteMany: jest.fn() as jest.MockedFunction<any>
      };
      
      mockPrisma.rateLimit.upsert.mockResolvedValue({
        organizationId,
        requestCount: 5, // В пределах лимита
        windowStart: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await rateLimiter.checkLimit(organizationId);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // 10 - 5 = 5
    });
  });

  describe('Интеграция с системой кредитов', () => {
    test('должен отклонить задачу при недостатке кредитов', async () => {
      // Arrange
      mockCreditsService.hasCredits.mockResolvedValue(false);
      
      const fileData = {
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        userId: 'user-123',
        organizationId: 'org-123'
      };

      // Act & Assert
      await queueManager.initialize();
      await ocrWorker.start();
      
      const workCall = mockBoss.work.mock.calls[0];
      const processJobCallback = workCall[2];
      
      const mockJob = {
        id: 'job-789',
        data: {
          documentId: 'doc-789',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      await expect(processJobCallback(mockJob)).rejects.toThrow('INSUFFICIENT_CREDITS');
      
      // Проверяем что кредиты не списались
      expect(mockCreditsService.debitCredits).not.toHaveBeenCalled();
    });
  });

  describe('Получение статуса задач', () => {
    test('должен вернуть статус обработанной задачи', async () => {
      // Arrange
      const jobId = 'job-123'; // Используем jobId вместо documentId
      
      // Настроим мок для pg-boss.getJobById
      mockBoss.getJobById.mockResolvedValue({
        id: 'job-123',
        state: 'completed',
        data: { documentId: 'doc-123', fileName: 'test.pdf' },
        output: {
          documentId: 'doc-123',
          text: 'Extracted text from document',
          textLength: 28,
          confidence: 0.95
        },
        createdOn: new Date(),
        completedOn: new Date(),
        priority: 5
      });
      
      await queueManager.initialize();

      // Act
      const status = await queueManager.getJobStatus(jobId);

      // Assert
      expect(status).toEqual({
        id: 'job-123',
        status: 'completed',
        progress: undefined,
        result: {
          documentId: 'doc-123',
          text: 'Extracted text from document',
          textLength: 28,
          confidence: 0.95
        },
        error: undefined,
        createdAt: expect.any(Date),
        processedAt: expect.any(Date),
        priority: 5
      });
      
      expect(mockBoss.getJobById).toHaveBeenCalledWith('ocr-queue', jobId);
    });

    test('должен вернуть null для несуществующей задачи', async () => {
      // Arrange
      mockBoss.getJobById.mockResolvedValue(null);
      await queueManager.initialize();

      // Act
      const status = await queueManager.getJobStatus('non-existent-job');

      // Assert
      expect(status).toBeNull();
    });
  });

  describe('Статистика очередей', () => {
    test('должен вернуть статистику очередей', async () => {
      // Arrange
      mockBoss.getQueueSize.mockResolvedValue(5);
      
      // Act
      await queueManager.initialize();
      const stats = await queueManager.getQueueStats();

      // Assert
      expect(stats).toEqual({
        waiting: 5,
        active: 0,
        completed: 0,
        failed: 0,
        total: 5
      });
    });
  });

  describe('Очистка завершенных задач', () => {
    test('должен очистить старые завершенные задачи', async () => {
      // Arrange - здесь нужно настроить мок db.query
      const mockDb = {
        query: jest.fn() as jest.MockedFunction<any>
      };
      
      mockDb.query.mockResolvedValue({ rowCount: 5 });
      
      // Настраиваем мок pg-boss с db
      mockBoss.db = mockDb;

      // Act
      await queueManager.initialize();
      const result = await queueManager.cleanCompletedJobs();

      // Assert
      expect(result).toBe(5);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM pgboss.job'),
        expect.arrayContaining(['ocr-queue', expect.any(Date)])
      );
    });
  });
});