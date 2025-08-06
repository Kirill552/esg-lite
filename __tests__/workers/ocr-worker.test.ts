/**
 * Unit тесты для OCR Worker
 * Задача 12.3: Создать тесты для OCR Worker
 * Требования: 1.2, 4.1, 4.2, 6.1
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock модули перед импортом
jest.mock('../../lib/pg-boss-config', () => ({
  createPgBoss: jest.fn(),
  QUEUE_NAMES: {
    OCR: 'ocr-queue'
  }
}));

jest.mock('../../lib/ocr', () => ({
  processS3File: jest.fn()
}));

jest.mock('../../lib/credits-service', () => ({
  creditsService: {
    hasCredits: jest.fn(),
    debitCredits: jest.fn(),
    getOperationCost: jest.fn(),
    checkBalance: jest.fn()
  }
}));

jest.mock('../../lib/surge-pricing', () => ({
  surgePricingService: {
    getSurgeMultiplier: jest.fn()
  }
}));

jest.mock('../../lib/prisma', () => ({
  prisma: {
    document: {
      update: jest.fn()
    }
  }
}));

jest.mock('../../lib/metrics', () => ({
  metricsCollector: {
    recordProcessingTime: jest.fn(),
    recordError: jest.fn()
  }
}));

import { OcrWorker, WorkerConfig } from '../../workers/ocr-worker';

// Получаем ссылки на моки после импорта
const mockCreatePgBoss = require('../../lib/pg-boss-config').createPgBoss;
const mockProcessS3File = require('../../lib/ocr').processS3File;
const mockCreditsService = require('../../lib/credits-service').creditsService;
const mockSurgePricingService = require('../../lib/surge-pricing').surgePricingService;
const mockPrisma = require('../../lib/prisma').prisma;
const mockMetricsCollector = require('../../lib/metrics').metricsCollector;

describe('OcrWorker', () => {
  let ocrWorker: OcrWorker;
  let mockBoss: any;
  
  const testConfig: WorkerConfig = {
    concurrency: 2,
    pollInterval: 1000,
    maxRetries: 2
  };

  beforeEach(() => {
    // Сбрасываем все моки
    jest.clearAllMocks();
    
    // Создаем мок pg-boss
    mockBoss = {
      work: jest.fn(),
      stop: jest.fn(),
      publish: jest.fn(),
      getQueueSize: jest.fn()
    };
    
    mockCreatePgBoss.mockResolvedValue(mockBoss);
    
    // Создаем новый экземпляр для каждого теста
    ocrWorker = new OcrWorker(testConfig);
    
    // Настройка моков по умолчанию
    mockCreditsService.hasCredits.mockResolvedValue(true);
    mockCreditsService.debitCredits.mockResolvedValue({ success: true, newBalance: 0 });
    mockCreditsService.checkBalance.mockResolvedValue({ balance: 0 });
    mockCreditsService.getOperationCost.mockResolvedValue({
      baseCost: 1,
      surgePricingMultiplier: 1,
      finalCost: 1,
      pricePerTonRub: 5
    });
    mockSurgePricingService.getSurgeMultiplier.mockReturnValue(1);
    mockProcessS3File.mockResolvedValue('Extracted text content from document');
    mockPrisma.document.update.mockResolvedValue({});
    mockMetricsCollector.recordProcessingTime.mockResolvedValue(undefined);
    mockMetricsCollector.recordError.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Останавливаем worker после каждого теста
    if (ocrWorker) {
      await ocrWorker.stop();
    }
  });

  describe('конструктор и конфигурация', () => {
    test('должен создаться с конфигурацией по умолчанию', () => {
      const defaultWorker = new OcrWorker();
      expect(defaultWorker).toBeInstanceOf(OcrWorker);
    });

    test('должен использовать переданную конфигурацию', () => {
      const customConfig = {
        concurrency: 5,
        pollInterval: 2000,
        maxRetries: 5
      };
      const customWorker = new OcrWorker(customConfig);
      expect(customWorker).toBeInstanceOf(OcrWorker);
    });
  });

  describe('start и stop', () => {
    test('должен запуститься и настроить обработчик задач', async () => {
      // Act
      await ocrWorker.start();

      // Assert
      expect(mockCreatePgBoss).toHaveBeenCalled();
      expect(mockBoss.work).toHaveBeenCalledWith(
        'ocr-queue',
        { teamSize: testConfig.concurrency },
        expect.any(Function)
      );
    });

    test('должен корректно остановиться', async () => {
      // Arrange
      await ocrWorker.start();

      // Act
      await ocrWorker.stop();

      // Assert
      expect(mockBoss.stop).toHaveBeenCalled();
    });

    test('не должен запускаться повторно если уже запущен', async () => {
      // Arrange
      await ocrWorker.start();
      mockCreatePgBoss.mockClear();

      // Act
      await ocrWorker.start();

      // Assert
      expect(mockCreatePgBoss).not.toHaveBeenCalled();
    });

    test('не должен останавливаться если уже остановлен', async () => {
      // Act
      await ocrWorker.stop();

      // Assert
      expect(mockBoss.stop).not.toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки при запуске', async () => {
      // Arrange
      mockCreatePgBoss.mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(ocrWorker.start()).rejects.toThrow('Connection failed');
    });
  });

  describe('processOcrJob', () => {
    let mockJob: any;
    let processOcrJobMethod: any;

    beforeEach(async () => {
      await ocrWorker.start();
      
      // Получаем ссылку на метод processOcrJob из вызова work
      const workCall = mockBoss.work.mock.calls[0];
      processOcrJobMethod = workCall[2]; // третий аргумент - это callback функция
      
      mockJob = {
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };
    });

    test('должен успешно обработать OCR задачу', async () => {
      // Act
      const result = await processOcrJobMethod(mockJob);

      // Assert
      expect(result).toEqual({
        documentId: 'doc-123',
        text: 'Extracted text content from document',
        textLength: 36,
        confidence: 0.95,
        processedAt: expect.any(String)
      });

      // Проверяем вызовы зависимостей
      expect(mockCreditsService.hasCredits).toHaveBeenCalledWith('org-123', 1);
      expect(mockProcessS3File).toHaveBeenCalledWith('files/test.pdf');
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: {
          status: 'PROCESSED',
          ocrProcessed: true,
          ocrData: {
            fullText: 'Extracted text content from document',
            textPreview: 'Extracted text content from document',
            textLength: 36,
            processedAt: expect.any(String)
          },
          ocrConfidence: 0.95
        }
      });
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'org-123',
        1,
        expect.stringContaining('OCR обработка документа'),
        expect.objectContaining({ documentId: 'doc-123' })
      );
      expect(mockMetricsCollector.recordProcessingTime).toHaveBeenCalledWith('job-123', expect.any(Number));
    });

    test('должен отклонить задачу при недостатке кредитов', async () => {
      // Arrange
      mockCreditsService.hasCredits.mockResolvedValue(false);
      mockCreditsService.checkBalance.mockResolvedValue({ balance: 0 });

      // Act & Assert
      await expect(processOcrJobMethod(mockJob)).rejects.toThrow('INSUFFICIENT_CREDITS');
      
      // Проверяем что OCR не вызывался
      expect(mockProcessS3File).not.toHaveBeenCalled();
      expect(mockCreditsService.debitCredits).not.toHaveBeenCalled();
    });

    test('должен обработать ошибку OCR', async () => {
      // Arrange
      mockProcessS3File.mockRejectedValue(new Error('OCR processing failed'));

      // Act & Assert
      await expect(processOcrJobMethod(mockJob)).rejects.toThrow('OCR processing failed');
      
      // Проверяем что ошибка записана
      expect(mockMetricsCollector.recordError).toHaveBeenCalledWith(
        'job-123', 
        'Error', 
        'OCR processing failed'
      );
      
      // Проверяем что статус документа обновлен на ошибку
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: {
          status: 'FAILED',
          ocrData: {
            error: 'OCR processing failed',
            processedAt: expect.any(String)
          }
        }
      });
    });

    test('должен отклонить задачу если OCR вернул слишком мало текста', async () => {
      // Arrange
      mockProcessS3File.mockResolvedValue('short'); // Меньше 10 символов

      // Act & Assert
      await expect(processOcrJobMethod(mockJob)).rejects.toThrow('OCR_FAILED');
    });

    test('должен использовать userId если organizationId отсутствует', async () => {
      // Arrange
      const jobWithoutOrgId = {
        ...mockJob,
        data: {
          ...mockJob.data,
          organizationId: undefined
        }
      };

      // Act
      await processOcrJobMethod(jobWithoutOrgId);

      // Assert
      expect(mockCreditsService.hasCredits).toHaveBeenCalledWith('user-123', 1);
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'user-123',
        1,
        expect.stringContaining('OCR обработка документа'),
        expect.objectContaining({ documentId: 'doc-123' })
      );
    });

    test('должен применить surge pricing множитель', async () => {
      // Arrange
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 2,
        finalCost: 2,
        pricePerTonRub: 5
      });

      // Act
      await processOcrJobMethod(mockJob);

      // Assert
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'org-123',
        2,
        expect.stringContaining('OCR обработка документа'),
        expect.objectContaining({ documentId: 'doc-123' })
      );
    });

    test('должен обрабатывать длинный текст и создавать preview', async () => {
      // Arrange
      const longText = 'A'.repeat(300); // 300 символов
      mockProcessS3File.mockResolvedValue(longText);

      // Act
      const result = await processOcrJobMethod(mockJob);

      // Assert
      expect(result.textLength).toBe(300);
      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: {
          status: 'PROCESSED',
          ocrProcessed: true,
          ocrData: {
            fullText: longText,
            textPreview: 'A'.repeat(200), // Первые 200 символов
            textLength: 300,
            processedAt: expect.any(String)
          },
          ocrConfidence: 0.95
        }
      });
    });
  });

  describe('updateProgress', () => {
    test('должен публиковать прогресс в очередь', async () => {
      // Arrange
      await ocrWorker.start();
      const mockJob = { id: 'job-123' };
      const progress = {
        stage: 'processing' as const,
        progress: 50,
        message: 'Processing file'
      };

      // Получаем доступ к приватному методу через processOcrJob
      const workCall = mockBoss.work.mock.calls[0];
      const processOcrJobMethod = workCall[2];
      
      // Мокаем updateProgress через вызов processOcrJob
      mockCreditsService.hasCredits.mockResolvedValue(true);
      mockProcessS3File.mockResolvedValue('Test content for progress');

      // Act
      await processOcrJobMethod({
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      });

      // Assert - проверяем что publish вызывался для прогресса
      expect(mockBoss.publish).toHaveBeenCalledWith('job-progress', expect.objectContaining({
        jobId: 'job-123'
      }));
    });
  });

  describe('getWorkerStats', () => {
    test('должен вернуть статистику остановленного worker', async () => {
      // Act
      const stats = await ocrWorker.getWorkerStats();

      // Assert
      expect(stats).toEqual({
        isRunning: false,
        config: testConfig,
        queueSize: undefined
      });
    });

    test('должен вернуть статистику запущенного worker с размером очереди', async () => {
      // Arrange
      await ocrWorker.start();
      mockBoss.getQueueSize.mockResolvedValue(5);

      // Act
      const stats = await ocrWorker.getWorkerStats();

      // Assert
      expect(stats).toEqual({
        isRunning: true,
        config: testConfig,
        queueSize: 5
      });
      expect(mockBoss.getQueueSize).toHaveBeenCalledWith('ocr-queue');
    });

    test('должен обработать ошибку получения размера очереди', async () => {
      // Arrange
      await ocrWorker.start();
      mockBoss.getQueueSize.mockRejectedValue(new Error('Queue error'));

      // Act
      const stats = await ocrWorker.getWorkerStats();

      // Assert
      expect(stats).toEqual({
        isRunning: true,
        config: testConfig,
        queueSize: undefined
      });
    });
  });

  describe('обработка ошибок', () => {
    test('должен корректно обрабатывать ошибки сохранения результатов', async () => {
      // Arrange
      await ocrWorker.start();
      mockPrisma.document.update.mockRejectedValue(new Error('Database error'));
      
      const workCall = mockBoss.work.mock.calls[0];
      const processOcrJobMethod = workCall[2];
      
      const mockJob = {
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      // Act & Assert
      await expect(processOcrJobMethod(mockJob)).rejects.toThrow('Database error');
      
      // Проверяем что метрики ошибки записаны
      expect(mockMetricsCollector.recordError).toHaveBeenCalledWith(
        'job-123',
        'Error',
        'Database error'
      );
    });

    test('должен обрабатывать ошибки списания кредитов', async () => {
      // Arrange
      await ocrWorker.start();
      mockCreditsService.debitCredits.mockRejectedValue(new Error('Credits error'));
      
      const workCall = mockBoss.work.mock.calls[0];
      const processOcrJobMethod = workCall[2];
      
      const mockJob = {
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      // Act & Assert
      await expect(processOcrJobMethod(mockJob)).rejects.toThrow('Credits error');
    });
  });

  describe('интеграция с зависимостями', () => {
    test('должен корректно интегрироваться с credits service', async () => {
      // Arrange
      await ocrWorker.start();
      const workCall = mockBoss.work.mock.calls[0];
      const processOcrJobMethod = workCall[2];
      
      const mockJob = {
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      // Act
      await processOcrJobMethod(mockJob);

      // Assert
      expect(mockCreditsService.hasCredits).toHaveBeenCalledWith('org-123', 1);
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'org-123',
        1,
        expect.stringContaining('OCR обработка документа'),
        expect.objectContaining({ documentId: 'doc-123' })
      );
    });

    test('должен корректно интегрироваться с surge pricing service', async () => {
      // Arrange
      await ocrWorker.start();
      mockCreditsService.getOperationCost.mockResolvedValue({
        baseCost: 1,
        surgePricingMultiplier: 1.5,
        finalCost: 1.5,
        pricePerTonRub: 5
      });
      
      const workCall = mockBoss.work.mock.calls[0];
      const processOcrJobMethod = workCall[2];
      
      const mockJob = {
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      // Act
      await processOcrJobMethod(mockJob);

      // Assert
      expect(mockCreditsService.getOperationCost).toHaveBeenCalledWith('ocr');
      expect(mockCreditsService.debitCredits).toHaveBeenCalledWith(
        'org-123',
        1.5,
        expect.stringContaining('OCR обработка документа'),
        expect.objectContaining({ documentId: 'doc-123' })
      );
    });

    test('должен корректно интегрироваться с metrics collector', async () => {
      // Arrange
      await ocrWorker.start();
      const workCall = mockBoss.work.mock.calls[0];
      const processOcrJobMethod = workCall[2];
      
      const mockJob = {
        id: 'job-123',
        data: {
          documentId: 'doc-123',
          fileKey: 'files/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024,
          userId: 'user-123',
          organizationId: 'org-123'
        }
      };

      // Act
      await processOcrJobMethod(mockJob);

      // Assert
      expect(mockMetricsCollector.recordProcessingTime).toHaveBeenCalledWith(
        'job-123',
        expect.any(Number)
      );
    });
  });
});