/**
 * CBAM Pricing Service
 * Обрабатывает расчет стоимости CBAM отчетов в рублях
 * Тариф: 255₽/т CO₂ (фиксированная цена в рублях)
 */

import { PrismaClient, ReportType } from '@prisma/client';
import { SubscriptionService } from './subscription-service';

const prisma = new PrismaClient();

// Фиксированная цена CBAM в рублях (3€ * 85₽/€)
export const CBAM_RATE_RUB_PER_TON = 255;

export interface CBAMLineItem {
  id?: string;
  productName: string;
  carbonIntensity: number; // т CO₂/т продукции
  quantity: number; // тонны продукции
  emissionsFactor?: number; // кг CO₂/кг продукции (опционально)
  totalEmissions: number; // т CO₂
  price?: number; // цена за строку в рублях
}

export interface CBAMPricingCalculation {
  lineItems: CBAMLineItem[];
  totalEmissions: number; // общие выбросы в т CO₂
  totalPrice: number; // общая стоимость в рублях
  currency: 'RUB';
  ratePerTon: number; // тариф ₽/т CO₂
  hasSubscription: boolean;
  organizationId: string;
}

export interface CBAMPricingRequest {
  organizationId: string;
  lineItems: Omit<CBAMLineItem, 'price'>[];
  reportType: 'CBAM_XML' | 'CBAM_CSV';
}

/**
 * Проверяет наличие активной CBAM подписки у организации
 */
export async function checkCBAMSubscription(organizationId: string): Promise<boolean> {
  try {
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.getActiveSubscription(organizationId);
    
    if (!subscription) {
      return false;
    }

    // Проверяем активность подписки
    const now = new Date();
    const isActive = subscription.status === 'ACTIVE' && 
                    subscription.expiresAt && subscription.expiresAt > now;

    // Проверяем наличие CBAM addon
    const hasCBAMAddon = subscription.hasCbamAddon === true;

    return Boolean(isActive && hasCBAMAddon);
  } catch (error) {
    console.error('Error checking CBAM subscription:', error);
    return false;
  }
}

/**
 * Рассчитывает стоимость CBAM отчета по строкам
 */
export async function calculateCBAMPricing(
  request: CBAMPricingRequest
): Promise<CBAMPricingCalculation> {
  const { organizationId, lineItems, reportType } = request;

  // Проверяем подписку
  const hasSubscription = await checkCBAMSubscription(organizationId);

  // Рассчитываем цену для каждой строки
  const pricedLineItems: CBAMLineItem[] = lineItems.map((item, index) => {
    const linePrice = hasSubscription ? 0 : item.totalEmissions * CBAM_RATE_RUB_PER_TON;
    
    return {
      ...item,
      id: item.id || `line_${index + 1}`,
      price: Math.round(linePrice * 100) / 100 // округляем до копеек
    };
  });

  // Общие расчеты
  const totalEmissions = pricedLineItems.reduce((sum, item) => sum + item.totalEmissions, 0);
  const totalPrice = hasSubscription ? 0 : totalEmissions * CBAM_RATE_RUB_PER_TON;

  return {
    lineItems: pricedLineItems,
    totalEmissions: Math.round(totalEmissions * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: 'RUB',
    ratePerTon: CBAM_RATE_RUB_PER_TON,
    hasSubscription,
    organizationId
  };
}

/**
 * Валидирует данные CBAM отчета перед расчетом
 */
export function validateCBAMLineItems(lineItems: Omit<CBAMLineItem, 'price'>[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!lineItems || lineItems.length === 0) {
    errors.push('Отсутствуют строки для расчета CBAM');
    return { valid: false, errors };
  }

  lineItems.forEach((item, index) => {
    const lineNumber = index + 1;

    if (!item.productName || item.productName.trim() === '') {
      errors.push(`Строка ${lineNumber}: отсутствует название продукта`);
    }

    if (typeof item.carbonIntensity !== 'number' || item.carbonIntensity < 0) {
      errors.push(`Строка ${lineNumber}: некорректная углеродная интенсивность`);
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Строка ${lineNumber}: некорректное количество продукции`);
    }

    if (typeof item.totalEmissions !== 'number' || item.totalEmissions < 0) {
      errors.push(`Строка ${lineNumber}: некорректные общие выбросы`);
    }

    // Проверяем соответствие расчетов
    const expectedEmissions = item.carbonIntensity * item.quantity;
    const tolerance = 0.01; // 1% допуск на округления
    
    if (Math.abs(item.totalEmissions - expectedEmissions) > tolerance) {
      errors.push(
        `Строка ${lineNumber}: несоответствие расчетов выбросов ` +
        `(${item.totalEmissions} != ${expectedEmissions})`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Создает записи в системе учета для CBAM платежей
 */
export async function recordCBAMCharges(
  calculation: CBAMPricingCalculation,
  reportId: string
): Promise<void> {
  if (calculation.hasSubscription || calculation.totalPrice === 0) {
    // Для подписчиков CBAM бесплатно
    return;
  }

  try {
    // Записываем информацию о начислении в базу
    await prisma.report.update({
      where: { id: reportId },
      data: {
        emissionData: JSON.parse(JSON.stringify({
          ...calculation,
          chargedAt: new Date().toISOString(),
          paymentStatus: 'PENDING'
        }))
      }
    });

    console.log(`CBAM charges recorded: ${calculation.totalPrice}₽ for report ${reportId}`);
  } catch (error) {
    console.error('Error recording CBAM charges:', error);
    throw new Error('Не удалось записать начисления CBAM');
  }
}

/**
 * Получает информацию о тарифах CBAM
 */
export function getCBAMPricingInfo() {
  return {
    ratePerTon: CBAM_RATE_RUB_PER_TON,
    currency: 'RUB',
    description: 'Стоимость обработки строки CBAM отчета',
    subscriptionBenefit: 'Для владельцев CBAM подписки - бесплатно',
    calculationMethod: 'Цена = количество тонн CO₂ × 255₽/т',
    supportedReports: ['CBAM_XML', 'CBAM_CSV']
  };
}
