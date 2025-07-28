/**
 * YooKassa Configuration
 * Задача 6.1: Настроить YooKassa интеграцию
 * 
 * Конфигурация для тестового и production окружения
 * Основана на официальной документации YooKassa API v3 2025
 */

import { YooCheckout } from '@a2seven/yoo-checkout';

export interface YooKassaConfig {
  shopId: string;
  secretKey: string;
  returnUrl: string;
  webhookUrl: string;
  paymentTimeout: number;
  currency: string;
  isProduction: boolean;
}

/**
 * Получить конфигурацию YooKassa из переменных окружения
 */
export function getYooKassaConfig(): YooKassaConfig {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const returnUrl = process.env.YOOKASSA_RETURN_URL;
  const webhookUrl = process.env.YOOKASSA_WEBHOOK_URL;
  const paymentTimeout = parseInt(process.env.YOOKASSA_PAYMENT_TIMEOUT || '15');
  const currency = process.env.YOOKASSA_CURRENCY || 'RUB';
  
  if (!shopId || !secretKey) {
    throw new Error(
      'YooKassa configuration error: YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY must be set'
    );
  }

  if (!returnUrl || !webhookUrl) {
    throw new Error(
      'YooKassa configuration error: YOOKASSA_RETURN_URL and YOOKASSA_WEBHOOK_URL must be set'
    );
  }

  // Определяем production по секретному ключу
  const isProduction = secretKey.startsWith('live_');

  return {
    shopId,
    secretKey,
    returnUrl,
    webhookUrl,
    paymentTimeout,
    currency,
    isProduction
  };
}

/**
 * Создать экземпляр YooKassa клиента
 */
export function createYooKassaClient(): YooCheckout {
  const config = getYooKassaConfig();
  
  const client = new YooCheckout({
    shopId: config.shopId,
    secretKey: config.secretKey,
    debug: !config.isProduction
  });

  return client;
}

/**
 * Валидация webhook подписи
 * Защита от подделки уведомлений от YooKassa
 */
export function validateWebhookSignature(
  requestBody: string,
  headers: Record<string, string | string[] | undefined>
): boolean {
  const config = getYooKassaConfig();
  
  // Получаем заголовки с подписью
  const signature = headers['yookassa-signature'] || headers['Yookassa-Signature'];
  
  if (!signature || typeof signature !== 'string') {
    console.error('❌ YooKassa webhook: отсутствует подпись');
    return false;
  }

  try {
    // Создаем ожидаемую подпись
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', config.secretKey)
      .update(requestBody)
      .digest('hex');

    // Сравниваем подписи (защита от timing attacks)
    const actualSignature = signature.toLowerCase();
    const expected = expectedSignature.toLowerCase();
    
    if (actualSignature.length !== expected.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < actualSignature.length; i++) {
      result |= actualSignature.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    
    const isValid = result === 0;
    
    if (!isValid) {
      console.error('❌ YooKassa webhook: неверная подпись');
    }
    
    return isValid;
    
  } catch (error) {
    console.error('❌ Ошибка валидации YooKassa webhook:', error);
    return false;
  }
}

/**
 * Типы платежей поддерживаемые в ESG-Lite
 */
export enum PaymentType {
  CREDITS = 'credits',           // Разовое пополнение кредитов
  SUBSCRIPTION = 'subscription', // Тариф (LITE_ANNUAL, CBAM_ADDON)
  MARKETPLACE = 'marketplace'    // Оплата услуг экспертов
}

/**
 * Метаданные для платежа
 */
export interface PaymentMetadata {
  type: PaymentType;
  organizationId: string;
  userId: string;
  
  // Для пополнения кредитов
  creditsAmount?: number;
  
  // Для подписок
  subscriptionPlan?: 'LITE_ANNUAL' | 'CBAM_ADDON';
  
  // Для marketplace
  expertId?: string;
  serviceId?: string;
  
  // Общие поля
  description: string;
  returnUrl?: string;
}

/**
 * Константы для платежей
 */
export const PAYMENT_CONSTANTS = {
  // Минимальная сумма платежа (в рублях)
  MIN_AMOUNT: 100,
  
  // Максимальная сумма платежа (в рублях)
  MAX_AMOUNT: 1000000,
  
  // Время жизни платежа (в минутах)
  DEFAULT_TIMEOUT: 15,
  
  // Поддерживаемые валюты
  CURRENCIES: ['RUB'] as const,
  
  // Методы оплаты
  PAYMENT_METHODS: [
    'bank_card',    // Банковские карты
    'yoo_money',    // ЮMoney
    'sberbank',     // Сбербанк Онлайн
    'alfabank',     // Альфа-Клик
    'tinkoff_bank', // Тинькофф
    'qiwi',         // QIWI Wallet
    'webmoney',     // WebMoney
    'sbp'           // Система быстрых платежей
  ] as const
} as const;

/**
 * Логирование операций с YooKassa
 */
export function logYooKassaOperation(
  operation: string,
  data: any,
  level: 'info' | 'error' | 'warn' = 'info'
) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    service: 'yookassa',
    operation,
    environment: getYooKassaConfig().isProduction ? 'production' : 'test',
    ...data
  };
  
  switch (level) {
    case 'error':
      console.error('❌ YooKassa:', JSON.stringify(logData, null, 2));
      break;
    case 'warn':
      console.warn('⚠️ YooKassa:', JSON.stringify(logData, null, 2));
      break;
    default:
      console.log('💳 YooKassa:', JSON.stringify(logData, null, 2));
  }
}

export default {
  getYooKassaConfig,
  createYooKassaClient,
  validateWebhookSignature,
  PaymentType,
  PAYMENT_CONSTANTS,
  logYooKassaOperation
};
