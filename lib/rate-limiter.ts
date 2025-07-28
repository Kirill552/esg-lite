/**
 * Rate Limiter - система ограничения запросов по организациям
 * Использует PostgreSQL для хранения счетчиков запросов
 * Интегрирован с CreditsService для проверки кредитов
 * Задача 2.3: Обновить Rate Limiter для учета кредитов
 */

import { prisma } from './prisma';
import { CreditsService } from './credits-service';

export interface RateLimitConfig {
  windowSizeMs: number;      // Размер временного окна в миллисекундах
  maxRequests: number;       // Максимальное количество запросов в окне
  cleanupIntervalMs: number; // Интервал очистки старых записей
  subscriptionLimits: {      // Лимиты для разных типов тарифов
    FREE: number;           // Бесплатный план
    LITE_ANNUAL: number;    // Annual Lite тариф
    CBAM_ADDON: number;     // CBAM Add-on тариф
    PREMIUM: number;        // Премиум тариф
  };
}

export interface RateLimitResult {
  allowed: boolean;          // Разрешен ли запрос
  remaining: number;         // Оставшееся количество запросов
  resetTime: Date;          // Время сброса счетчика
  retryAfter?: number;      // Через сколько секунд можно повторить (если отклонен)
  reason?: string;          // Причина отклонения
  subscriptionType?: string; // Тип подписки
  hasCredits?: boolean;     // Есть ли кредиты
}

export interface RateLimitStats {
  organizationId: string;
  currentCount: number;
  maxRequests: number;
  windowStart: Date;
  windowEnd: Date;
  hasCredits: boolean;
  isSurgePeriod: boolean;
  subscriptionType: string;
  creditsBalance: number;
}

/**
 * Rate Limiter класс для ограничения запросов по организациям
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private creditsService: CreditsService;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowSizeMs: config.windowSizeMs || 60 * 60 * 1000, // 1 час по умолчанию
      maxRequests: config.maxRequests || 100,               // 100 запросов в час
      cleanupIntervalMs: config.cleanupIntervalMs || 5 * 60 * 1000, // Очистка каждые 5 минут
      subscriptionLimits: config.subscriptionLimits || {
        FREE: 10,           // Бесплатный план - 10 запросов в час
        LITE_ANNUAL: 100,   // Annual Lite - 100 запросов в час
        CBAM_ADDON: 200,    // CBAM Add-on - 200 запросов в час
        PREMIUM: 500        // Премиум - 500 запросов в час
      }
    };

    this.creditsService = new CreditsService();

    console.log('🔧 Rate Limiter инициализирован:', {
      windowSizeMs: this.config.windowSizeMs,
      maxRequests: this.config.maxRequests,
      cleanupIntervalMs: this.config.cleanupIntervalMs,
      subscriptionLimits: this.config.subscriptionLimits
    });

    // Запускаем периодическую очистку старых записей
    this.startCleanupTimer();
  }

  /**
   * Проверка лимита запросов для организации
   */
  async checkLimit(organizationId: string): Promise<RateLimitResult> {
    try {
      console.log(`🔍 Проверка лимита для организации: ${organizationId}`);

      // 1. Проверяем баланс кредитов
      const creditBalance = await this.creditsService.checkBalance(organizationId);
      const hasCredits = creditBalance.balance > 0;
      
      if (!hasCredits) {
        console.log(`❌ Нулевой баланс кредитов для ${organizationId}: ${creditBalance.balance} т CO₂`);
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(),
          reason: 'INSUFFICIENT_CREDITS',
          subscriptionType: creditBalance.planType,
          hasCredits: false
        };
      }

      // 2. Получаем тип подписки и определяем лимиты
      const subscriptionType = creditBalance.planType || 'FREE';
      const maxRequests = await this.getEffectiveMaxRequests(organizationId, subscriptionType);

      // 3. Получаем текущее временное окно
      const windowStart = this.getCurrentWindowStart();
      const windowEnd = new Date(windowStart.getTime() + this.config.windowSizeMs);

      // 4. Получаем или создаем запись лимита
      const rateLimitRecord = await this.getOrCreateRateLimit(organizationId, windowStart);
      
      if (rateLimitRecord.requestCount >= maxRequests) {
        console.log(`❌ Превышен лимит для ${organizationId}: ${rateLimitRecord.requestCount}/${maxRequests} (Тариф: ${subscriptionType})`);
        
        const retryAfter = Math.ceil((windowEnd.getTime() - Date.now()) / 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowEnd,
          retryAfter,
          reason: 'RATE_LIMIT_EXCEEDED',
          subscriptionType,
          hasCredits: true
        };
      }

      // 5. Запрос разрешен
      const remaining = maxRequests - rateLimitRecord.requestCount;

      console.log(`✅ Лимит OK для ${organizationId}: ${rateLimitRecord.requestCount}/${maxRequests} (осталось: ${remaining}, Тариф: ${subscriptionType})`);

      return {
        allowed: true,
        remaining,
        resetTime: windowEnd,
        subscriptionType,
        hasCredits: true
      };

    } catch (error) {
      console.error(`❌ Ошибка проверки лимита для ${organizationId}:`, error);
      
      // В случае ошибки разрешаем запрос (fail-open)
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowSizeMs),
        reason: 'ERROR_FALLBACK'
      };
    }
  }

  /**
   * Увеличение счетчика запросов
   */
  async incrementCounter(organizationId: string): Promise<void> {
    try {
      console.log(`📈 Увеличение счетчика для ${organizationId}`);

      const windowStart = this.getCurrentWindowStart();
      
      // Увеличиваем счетчик в базе данных
      await prisma.rateLimit.upsert({
        where: {
          organizationId_windowStart: {
            organizationId,
            windowStart
          }
        },
        update: {
          requestCount: {
            increment: 1
          },
          updatedAt: new Date()
        },
        create: {
          organizationId,
          requestCount: 1,
          windowStart,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Счетчик увеличен для ${organizationId}`);

    } catch (error) {
      console.error(`❌ Ошибка увеличения счетчика для ${organizationId}:`, error);
      // Не прерываем выполнение, только логируем
    }
  }

  /**
   * Получение статистики лимитов для организации
   */
  async getStats(organizationId: string): Promise<RateLimitStats> {
    try {
      const windowStart = this.getCurrentWindowStart();
      const windowEnd = new Date(windowStart.getTime() + this.config.windowSizeMs);

      // Получаем текущую запись лимита
      const rateLimitRecord = await prisma.rateLimit.findUnique({
        where: {
          organizationId_windowStart: {
            organizationId,
            windowStart
          }
        }
      });

      // Получаем баланс кредитов и информацию о подписке
      const creditBalance = await this.creditsService.checkBalance(organizationId);
      const subscriptionType = creditBalance.planType || 'FREE';
      const maxRequests = await this.getEffectiveMaxRequests(organizationId, subscriptionType);
      
      const currentCount = rateLimitRecord?.requestCount || 0;
      const hasCredits = creditBalance.balance > 0;
      const operationCost = await this.creditsService.getOperationCost('ocr');
      const isSurgePeriod = operationCost.surgePricingMultiplier > 1;

      return {
        organizationId,
        currentCount,
        maxRequests,
        windowStart,
        windowEnd,
        hasCredits,
        isSurgePeriod,
        subscriptionType,
        creditsBalance: creditBalance.balance
      };

    } catch (error) {
      console.error(`❌ Ошибка получения статистики для ${organizationId}:`, error);
      
      // Возвращаем базовую статистику
      const windowStart = this.getCurrentWindowStart();
      return {
        organizationId,
        currentCount: 0,
        maxRequests: this.config.maxRequests,
        windowStart,
        windowEnd: new Date(windowStart.getTime() + this.config.windowSizeMs),
        hasCredits: false,
        isSurgePeriod: false,
        subscriptionType: 'FREE',
        creditsBalance: 0
      };
    }
  }

  /**
   * Сброс лимитов для организации (для тестирования)
   */
  async resetLimits(organizationId: string): Promise<void> {
    try {
      console.log(`🔄 Сброс лимитов для ${organizationId}`);

      await prisma.rateLimit.deleteMany({
        where: {
          organizationId
        }
      });

      console.log(`✅ Лимиты сброшены для ${organizationId}`);

    } catch (error) {
      console.error(`❌ Ошибка сброса лимитов для ${organizationId}:`, error);
    }
  }

  /**
   * Проверка возможности выполнения операции с учетом кредитов и лимитов
   */
  async canPerformOperation(organizationId: string, operationType: 'ocr' | 'report_generation' | 'api_call' = 'ocr'): Promise<{
    allowed: boolean;
    reason?: string;
    requiredCredits?: number;
    availableCredits?: number;
    rateLimitResult?: RateLimitResult;
  }> {
    try {
      // 1. Проверяем rate limit
      const rateLimitResult = await this.checkLimit(organizationId);
      
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          reason: rateLimitResult.reason,
          rateLimitResult
        };
      }

      // 2. Проверяем кредиты для операции
      const operationCost = await this.creditsService.getOperationCost(operationType);
      const creditBalance = await this.creditsService.checkBalance(organizationId);
      
      if (creditBalance.balance < operationCost.finalCost) {
        return {
          allowed: false,
          reason: 'INSUFFICIENT_CREDITS_FOR_OPERATION',
          requiredCredits: operationCost.finalCost,
          availableCredits: creditBalance.balance,
          rateLimitResult
        };
      }

      return {
        allowed: true,
        requiredCredits: operationCost.finalCost,
        availableCredits: creditBalance.balance,
        rateLimitResult
      };

    } catch (error) {
      console.error(`❌ Ошибка проверки возможности операции для ${organizationId}:`, error);
      return {
        allowed: false,
        reason: 'ERROR_CHECKING_OPERATION'
      };
    }
  }

  /**
   * Получение эффективного максимального количества запросов с учетом типа подписки и surge-pricing
   */
  private async getEffectiveMaxRequests(organizationId: string, subscriptionType?: string): Promise<number> {
    // Определяем базовый лимит по типу подписки
    const subType = subscriptionType || 'FREE';
    const baseLimitKey = subType.replace('_', '_') as keyof typeof this.config.subscriptionLimits;
    let baseLimit = this.config.subscriptionLimits[baseLimitKey] || this.config.subscriptionLimits.FREE;

    try {
      // Проверяем surge pricing через CreditsService
      const operationCost = await this.creditsService.getOperationCost('ocr');
      const isSurgePeriod = operationCost.surgePricingMultiplier > 1;
      
      if (isSurgePeriod) {
        // В период surge-pricing уменьшаем лимиты на 50%
        const surgeMaxRequests = Math.floor(baseLimit * 0.5);
        console.log(`⚡ Surge период: лимит уменьшен до ${surgeMaxRequests} для ${organizationId} (${subType})`);
        return surgeMaxRequests;
      }

      console.log(`📊 Лимит для ${organizationId}: ${baseLimit} (${subType})`);
      return baseLimit;
      
    } catch (error) {
      console.error(`❌ Ошибка получения surge pricing для ${organizationId}:`, error);
      return baseLimit;
    }
  }

  /**
   * Получение или создание записи лимита
   */
  private async getOrCreateRateLimit(organizationId: string, windowStart: Date) {
    return await prisma.rateLimit.upsert({
      where: {
        organizationId_windowStart: {
          organizationId,
          windowStart
        }
      },
      update: {},
      create: {
        organizationId,
        requestCount: 0,
        windowStart
      }
    });
  }

  /**
   * Получение начала текущего временного окна
   */
  private getCurrentWindowStart(): Date {
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowSizeMs) * this.config.windowSizeMs;
    return new Date(windowStart);
  }

  /**
   * Запуск таймера очистки старых записей
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupOldRecords();
    }, this.config.cleanupIntervalMs);

    console.log(`🧹 Таймер очистки запущен (интервал: ${this.config.cleanupIntervalMs}ms)`);
  }

  /**
   * Очистка старых записей лимитов
   */
  private async cleanupOldRecords(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - this.config.windowSizeMs * 2); // Удаляем записи старше 2 окон
      
      const result = await prisma.rateLimit.deleteMany({
        where: {
          windowStart: {
            lt: cutoffTime
          }
        }
      });

      if (result.count > 0) {
        console.log(`🧹 Очищено ${result.count} старых записей лимитов`);
      }

    } catch (error) {
      console.error('❌ Ошибка очистки старых записей:', error);
    }
  }

  /**
   * Остановка Rate Limiter и очистка ресурсов
   */
  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('🛑 Таймер очистки остановлен');
    }

    // Финальная очистка
    await this.cleanupOldRecords();
    console.log('✅ Rate Limiter остановлен');
  }
}

/**
 * Singleton instance для использования в приложении
 */
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Получение singleton экземпляра Rate Limiter
 */
export function getRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(config);
  }
  return rateLimiterInstance;
}

/**
 * Экспорт для удобного использования
 */
export const rateLimiter = getRateLimiter();