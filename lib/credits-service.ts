/**
 * Credits Service - система управления кредитами ESG-Lite
 * Задача 1.2: Реализовать Credits Service
 * Задача 5.2: Интегрировать surge pricing в кредитную систему
 * Требования: 1.2 Кредиты (Credits Ledger) - 5 ₽/т CO₂-экв сверх 1 000 т
 */

import { prisma } from './prisma';
import { CreditTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { surgePricingService } from './surge-pricing';

export interface CreditBalance {
  organizationId: string;
  balance: number; // В тоннах CO₂
  balanceDecimal: Decimal; // Точный баланс из БД
  totalPurchased: number;
  totalUsed: number;
  planType: string;
  planExpiry?: Date;
  lastTopUp?: Date;
  lastUpdated: Date;
}

export interface CreditTransaction {
  id: string;
  organizationId: string;
  amount: number; // В тоннах CO₂
  amountDecimal: Decimal; // Точная сумма из БД
  type: CreditTransactionType;
  description: string;
  metadata?: any;
  timestamp: Date;
}

export interface DebitResult {
  success: boolean;
  newBalance: number;
  newBalanceDecimal: Decimal;
  transactionId: string;
  error?: string;
}

export interface CreditOperationCost {
  baseCost: number; // В тоннах CO₂
  surgePricingMultiplier: number;
  finalCost: number;
  pricePerTonRub: number; // 5 ₽/т CO₂
}

export class CreditsService {
  private readonly BASE_PRICE_RUB_PER_TON = 5; // 5 ₽/т CO₂-экв
  private readonly FREE_TIER_LIMIT = 1000; // 1000 т CO₂ бесплатно

  /**
   * Проверить баланс кредитов организации
   */
  async checkBalance(organizationId: string): Promise<CreditBalance> {
    try {
      const orgCredits = await this.ensureOrganizationCredits(organizationId);
      
      return {
        organizationId,
        balance: Number(orgCredits.balance_t_co2),
        balanceDecimal: orgCredits.balance_t_co2,
        totalPurchased: orgCredits.totalPurchased,
        totalUsed: orgCredits.totalUsed,
        planType: orgCredits.planType,
        planExpiry: orgCredits.planExpiry || undefined,
        lastTopUp: orgCredits.lastTopUp || undefined,
        lastUpdated: orgCredits.updatedAt
      };
    } catch (error) {
      console.error('Error checking credit balance:', error);
      throw new Error(`Failed to check credit balance for organization ${organizationId}`);
    }
  }

  /**
   * Списать кредиты с баланса организации
   */
  async debitCredits(
    organizationId: string, 
    amount: number, 
    description: string = 'OCR processing',
    metadata?: any
  ): Promise<DebitResult> {
    try {
      const amountDecimal = new Decimal(amount);
      
      // Проверяем текущий баланс
      const currentBalance = await this.checkBalance(organizationId);
      
      if (currentBalance.balanceDecimal.lessThan(amountDecimal)) {
        return {
          success: false,
          newBalance: currentBalance.balance,
          newBalanceDecimal: currentBalance.balanceDecimal,
          transactionId: '',
          error: `Insufficient credits. Required: ${amount}, Available: ${currentBalance.balance}`
        };
      }

      // Выполняем списание в транзакции
      const result = await prisma.$transaction(async (tx) => {
        // Создаем транзакцию списания
        const transaction = await tx.organization_credit_transactions.create({
          data: {
            organizationId,
            amount: amountDecimal.negated(), // Отрицательная сумма для списания
            transaction_type: CreditTransactionType.DEBIT,
            description,
            metadata: metadata || {}
          }
        });

        // Обновляем баланс
        const updatedCredits = await tx.organization_credits.update({
          where: { organizationId },
          data: {
            balance_t_co2: {
              decrement: amountDecimal
            },
            totalUsed: {
              increment: Number(amountDecimal)
            },
            updatedAt: new Date()
          }
        });

        return {
          transaction,
          newBalance: updatedCredits.balance_t_co2
        };
      });

      return {
        success: true,
        newBalance: Number(result.newBalance),
        newBalanceDecimal: result.newBalance,
        transactionId: result.transaction.id
      };

    } catch (error) {
      console.error('Error debiting credits:', error);
      throw new Error(`Failed to debit credits for organization ${organizationId}: ${error}`);
    }
  }

  /**
   * Пополнить баланс кредитов
   */
  async creditCredits(
    organizationId: string, 
    amount: number, 
    description: string = 'Balance top-up',
    transactionType: CreditTransactionType = CreditTransactionType.PURCHASE,
    metadata?: any
  ): Promise<DebitResult> {
    try {
      const amountDecimal = new Decimal(amount);

      // Выполняем пополнение в транзакции
      const result = await prisma.$transaction(async (tx) => {
        // Создаем транзакцию пополнения
        const transaction = await tx.organization_credit_transactions.create({
          data: {
            organizationId,
            amount: amountDecimal, // Положительная сумма для пополнения
            transaction_type: transactionType,
            description,
            metadata: metadata || {}
          }
        });

        // Обновляем баланс
        const updatedCredits = await tx.organization_credits.update({
          where: { organizationId },
          data: {
            balance_t_co2: {
              increment: amountDecimal
            },
            totalPurchased: {
              increment: Number(amountDecimal)
            },
            lastTopUp: new Date(),
            updatedAt: new Date()
          }
        });

        return {
          transaction,
          newBalance: updatedCredits.balance_t_co2
        };
      });

      return {
        success: true,
        newBalance: Number(result.newBalance),
        newBalanceDecimal: result.newBalance,
        transactionId: result.transaction.id
      };

    } catch (error) {
      console.error('Error crediting credits:', error);
      throw new Error(`Failed to credit credits for organization ${organizationId}: ${error}`);
    }
  }

  /**
   * Проверить, достаточно ли кредитов для операции
   */
  async hasCredits(organizationId: string, requiredAmount: number = 1): Promise<boolean> {
    try {
      const balance = await this.checkBalance(organizationId);
      return balance.balance >= requiredAmount;
    } catch (error) {
      console.error('Error checking if organization has credits:', error);
      return false;
    }
  }

  /**
   * Получить историю транзакций
   */
  async getTransactionHistory(
    organizationId: string, 
    limit: number = 20,
    offset: number = 0
  ): Promise<CreditTransaction[]> {
    try {
      const transactions = await prisma.organization_credit_transactions.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return transactions.map(tx => ({
        id: tx.id,
        organizationId: tx.organizationId,
        amount: Number(tx.amount),
        amountDecimal: tx.amount,
        type: tx.transaction_type,
        description: tx.description,
        metadata: tx.metadata,
        timestamp: tx.createdAt
      }));

    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error(`Failed to get transaction history for organization ${organizationId}`);
    }
  }

  /**
   * Получить стоимость операции с учетом surge pricing
   */
  async getOperationCost(
    operationType: 'ocr' | 'report_generation' | 'api_call',
    emissionVolumeTons: number = 1,
    surgePricingMultiplier?: number, // Опциональный явный множитель
    operationDate: Date = new Date() // Дата операции для расчета surge
  ): Promise<CreditOperationCost> {
    // Базовые стоимости в тоннах CO₂
    const baseCosts = {
      ocr: 0.1, // 0.1 т CO₂ за OCR
      report_generation: Math.max(0.1, emissionVolumeTons * 0.001), // 0.1% от объема выбросов, минимум 0.1 т
      api_call: 0.01 // 0.01 т CO₂ за API вызов
    };
    
    const baseCost = baseCosts[operationType] || 0.1;
    
    // Если множитель не передан явно, получаем его из surge pricing service
    const actualMultiplier = surgePricingMultiplier ?? surgePricingService.getSurgeMultiplier(operationDate);
    
    const finalCost = baseCost * actualMultiplier;
    
    return {
      baseCost,
      surgePricingMultiplier: actualMultiplier,
      finalCost,
      pricePerTonRub: this.BASE_PRICE_RUB_PER_TON
    };
  }

  /**
   * Создать или получить запись кредитов для организации
   */
  private async ensureOrganizationCredits(organizationId: string) {
    let orgCredits = await prisma.organization_credits.findUnique({
      where: { organizationId }
    });

    if (!orgCredits) {
      // Создаем новую запись с начальными 1000 т CO₂ кредитов
      orgCredits = await prisma.organization_credits.create({
        data: {
          organizationId,
          balance_t_co2: new Decimal(1000),
          totalPurchased: 1000,
          totalUsed: 0,
          planType: 'FREE'
        }
      });

      // Создаем первоначальную транзакцию
      await prisma.organization_credit_transactions.create({
        data: {
          organizationId,
          amount: new Decimal(1000),
          transaction_type: CreditTransactionType.BONUS,
          description: 'Initial free credits for new organization',
          metadata: { source: 'registration_bonus' }
        }
      });
    }

    return orgCredits;
  }

  /**
   * Рассчитать требуемые кредиты для операции с учетом бесплатного лимита
   */
  async calculateRequiredCredits(
    organizationId: string,
    operationType: 'ocr' | 'report_generation' | 'api_call',
    emissionVolumeTons: number = 1,
    surgePricingMultiplier?: number, // Опциональный явный множитель  
    operationDate: Date = new Date() // Дата операции для расчета surge
  ): Promise<number> {
    const balance = await this.checkBalance(organizationId);
    const operationCost = await this.getOperationCost(operationType, emissionVolumeTons, surgePricingMultiplier, operationDate);
    
    // Если у организации есть кредиты в рамках бесплатного лимита
    if (balance.totalUsed < this.FREE_TIER_LIMIT) {
      const remainingFreeCredits = this.FREE_TIER_LIMIT - balance.totalUsed;
      return Math.max(0, operationCost.finalCost - remainingFreeCredits);
    }
    
    return operationCost.finalCost;
  }

  /**
   * Получить информацию о surge pricing для UI
   */
  async getSurgePricingInfo(date: Date = new Date()) {
    const status = surgePricingService.getSurgePricingStatus(date);
    const bannerInfo = surgePricingService.getBannerInfo(date);
    const notification = surgePricingService.getSurgePricingNotification(date);
    
    return {
      status,
      bannerInfo,
      notification,
      isActive: status.isActive,
      multiplier: status.multiplier,
      reason: status.reason
    };
  }

  /**
   * Рассчитать стоимость с surge pricing для отображения в UI
   */
  async calculatePriceWithSurge(
    operationType: 'ocr' | 'report_generation' | 'api_call',
    emissionVolumeTons: number = 1,
    date: Date = new Date()
  ) {
    const operationCost = await this.getOperationCost(operationType, emissionVolumeTons, undefined, date);
    const surgePricingInfo = await this.getSurgePricingInfo(date);
    
    return {
      baseCost: operationCost.baseCost,
      multiplier: operationCost.surgePricingMultiplier,
      finalCost: operationCost.finalCost,
      priceInRubles: operationCost.finalCost * operationCost.pricePerTonRub,
      surgeAddition: operationCost.finalCost - operationCost.baseCost,
      surgeAdditionRubles: (operationCost.finalCost - operationCost.baseCost) * operationCost.pricePerTonRub,
      surgePricingInfo,
      operationType
    };
  }
}

// Singleton instance для использования в приложении
export const creditsService = new CreditsService();