/**
 * Интеграционные тесты для проверки rate limiting в API endpoints
 * Задача 2: Тестирование rate limiting в /api/upload и /api/ocr
 */

import { POST as uploadPOST } from '../../app/api/upload/route';
import { POST as ocrPOST } from '../../app/api/ocr/route';
import { RateLimiter } from '../../lib/rate-limiter';
import { getUserInternalId } from '../../lib/user-utils';
import { NextRequest } from 'next/server';

// Мокируем зависимости
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

jest.mock('../../lib/user-utils', () => ({
  getUserInternalId: jest.fn()
}));

jest.mock('../../lib/rate-limiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    checkLimit: jest.fn(),
    incrementCounter: jest.fn()
  }))
}));

// Мокируем другие зависимости
jest.mock('../../lib/prisma', () => ({
  prisma: {
    document: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    }
  }
}));

jest.mock('../../lib/credits-service', () => ({
  creditsService: {
    hasCredits: jest.fn(),
    debitCredits: jest.fn()
  }
}));

jest.mock('../../lib/queue', () => ({
  getQueueManager: jest.fn()
}));

describe('Rate Limiting Integration Tests', () => {
  let mockAuth: jest.MockedFunction<any>;
  let mockGetUserInternalId: jest.MockedFunction<typeof getUserInternalId>;
  let mockRateLimiter: jest.MockedClass<typeof RateLimiter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuth = require('@clerk/nextjs/server').auth;
    mockGetUserInternalId = getUserInternalId as jest.MockedFunction<typeof getUserInternalId>;
    mockRateLimiter = RateLimiter as jest.MockedClass<typeof RateLimiter>;
  });

  describe('Upload API Rate Limiting', () => {
    it('должен применять rate limiting к upload API', async () => {
      // Настройка мок
      mockAuth.mockResolvedValue({ userId: 'test-user', orgId: null });
      mockGetUserInternalId.mockResolvedValue('internal-user-123');
      
      const mockCheckLimit = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: new Date(),
        subscriptionType: 'FREE'
      });
      
      const mockIncrementCounter = jest.fn().mockResolvedValue(void 0);
      
      mockRateLimiter.mockImplementation(() => ({
        checkLimit: mockCheckLimit,
        incrementCounter: mockIncrementCounter
      } as any));

      // Мокируем creditsService.hasCredits для успешного выполнения
      const { creditsService } = require('../../lib/credits-service');
      creditsService.hasCredits.mockResolvedValue(true);

      // Создаем тестовый запрос
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: mockFormData
      });

      // Выполняем запрос
      const response = await uploadPOST(request);

      // Проверяем, что rate limiter был инициализирован правильно
      expect(mockRateLimiter).toHaveBeenCalledWith({
        cleanupIntervalMs: 300000,
        maxRequests: 10,
        subscriptionLimits: {
          FREE: 5,
          LITE_ANNUAL: 10,
          CBAM_ADDON: 15,
          PREMIUM: 25
        },
        windowSizeMs: 60000
      });

      // Проверяем, что checkLimit был вызван с правильным organizationId
      expect(mockCheckLimit).toHaveBeenCalledWith('internal-user-123');
    });

    it('должен блокировать запросы при превышении лимита', async () => {
      // Настройка мок
      mockAuth.mockResolvedValue({ userId: 'test-user', orgId: null });
      mockGetUserInternalId.mockResolvedValue('internal-user-123');
      
      const mockCheckLimit = jest.fn().mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        retryAfter: 60,
        reason: 'RATE_LIMIT_EXCEEDED',
        subscriptionType: 'FREE'
      });
      
      mockRateLimiter.mockImplementation(() => ({
        checkLimit: mockCheckLimit,
        incrementCounter: jest.fn()
      } as any));

      // Создаем тестовый запрос
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: mockFormData
      });

      // Выполняем запрос
      const response = await uploadPOST(request);
      const result = await response.json();

      // Проверяем блокировку
      expect(response.status).toBe(429);
      expect(result.error).toBe('Превышен лимит загрузок');
      expect(result.details).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('OCR API Rate Limiting', () => {
    it('должен применять rate limiting к OCR API с более строгими лимитами', async () => {
      // Настройка мок
      mockAuth.mockResolvedValue({ userId: 'test-user', orgId: null });
      mockGetUserInternalId.mockResolvedValue('internal-user-123');
      
      const mockCheckLimit = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetTime: new Date(),
        subscriptionType: 'FREE'
      });
      
      const mockIncrementCounter = jest.fn().mockResolvedValue(void 0);
      
      mockRateLimiter.mockImplementation(() => ({
        checkLimit: mockCheckLimit,
        incrementCounter: mockIncrementCounter
      } as any));

      // Мокируем зависимости OCR API
      const { creditsService } = require('../../lib/credits-service');
      creditsService.hasCredits.mockResolvedValue(true);
      
      const { prisma } = require('../../lib/prisma');
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-123',
        fileName: 'test.pdf',
        filePath: 'path/to/file',
        fileSize: 1024,
        status: 'UPLOADED'
      });

      const mockQueueManager = {
        addOcrJob: jest.fn().mockResolvedValue('job-123')
      };
      const { getQueueManager } = require('../../lib/queue');
      getQueueManager.mockResolvedValue(mockQueueManager);

      // Создаем тестовый запрос
      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: 'doc-123' })
      });

      // Выполняем запрос
      const response = await ocrPOST(request);

      // Проверяем, что rate limiter был инициализирован с более строгими лимитами для OCR
      expect(mockRateLimiter).toHaveBeenCalledWith({
        windowSizeMs: 60000, // 1 минута
        subscriptionLimits: {
          FREE: 3,           // Меньше чем у upload (5)
          LITE_ANNUAL: 8,    // Меньше чем у upload (10)  
          CBAM_ADDON: 12,    // Меньше чем у upload (15)
          PREMIUM: 20        // Меньше чем у upload (25)
        }
      });

      // Проверяем, что checkLimit был вызван
      expect(mockCheckLimit).toHaveBeenCalledWith('internal-user-123');
    });

    it('должен блокировать OCR запросы при превышении лимита', async () => {
      // Настройка мок
      mockAuth.mockResolvedValue({ userId: 'test-user', orgId: null });
      mockGetUserInternalId.mockResolvedValue('internal-user-123');
      
      const mockCheckLimit = jest.fn().mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        retryAfter: 60,
        reason: 'RATE_LIMIT_EXCEEDED',
        subscriptionType: 'FREE',
        hasCredits: true
      });
      
      mockRateLimiter.mockImplementation(() => ({
        checkLimit: mockCheckLimit,
        incrementCounter: jest.fn()
      } as any));

      // Создаем тестовый запрос
      const request = new NextRequest('http://localhost:3000/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: 'doc-123' })
      });

      // Выполняем запрос
      const response = await ocrPOST(request);
      const result = await response.json();

      // Проверяем блокировку
      expect(response.status).toBe(429);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.details.subscriptionType).toBe('FREE');
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('User ID Resolution', () => {
    it('должен правильно использовать organizationId когда доступно', async () => {
      // Настройка мок с orgId
      mockAuth.mockResolvedValue({ userId: 'test-user', orgId: 'org-456' });
      mockGetUserInternalId.mockResolvedValue('internal-user-123');
      
      const mockCheckLimit = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: new Date()
      });
      
      mockRateLimiter.mockImplementation(() => ({
        checkLimit: mockCheckLimit,
        incrementCounter: jest.fn()
      } as any));

      const { creditsService } = require('../../lib/credits-service');
      creditsService.hasCredits.mockResolvedValue(true);

      // Создаем тестовый запрос
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: mockFormData
      });

      // Выполняем запрос
      await uploadPOST(request);

      // В upload API всегда используется internalUserId, независимо от наличия orgId
      expect(mockCheckLimit).toHaveBeenCalledWith('internal-user-123');
    });

    it('должен использовать internalUserId как fallback когда orgId отсутствует', async () => {
      // Настройка мок без orgId
      mockAuth.mockResolvedValue({ userId: 'test-user', orgId: null });
      mockGetUserInternalId.mockResolvedValue('internal-user-123');
      
      const mockCheckLimit = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: new Date()
      });
      
      mockRateLimiter.mockImplementation(() => ({
        checkLimit: mockCheckLimit,
        incrementCounter: jest.fn()
      } as any));

      const { creditsService } = require('../../lib/credits-service');
      creditsService.hasCredits.mockResolvedValue(true);

      // Создаем тестовый запрос
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: mockFormData
      });

      // Выполняем запрос
      await uploadPOST(request);

      // Проверяем, что использовался internalUserId
      expect(mockCheckLimit).toHaveBeenCalledWith('internal-user-123');
    });
  });
});
