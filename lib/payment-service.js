/**
 * Payment Service (JavaScript версия)
 * Задача 6.2: Создать Payment Service
 * 
 * Сервис для обработки платежей через YooKassa:
 * - Разовые пополнения кредитов (one_off)
 * - Платежи за подписки (recurring/annual)
 * - Обработка webhook callback'ов
 */

const { 
  createYooKassaClient, 
  PaymentType, 
  PAYMENT_CONSTANTS,
  logYooKassaOperation,
  validateWebhookSignature 
} = require('./yookassa-config.js');

// Mock services for testing
const creditsService = {
  creditCredits: async (userId, amount) => {
    console.log(`Mock: Crediting ${amount} to user ${userId}`);
    return { success: true, newBalance: amount };
  }
};

const SubscriptionService = {
  activateSubscription: async (userId, subscriptionType) => {
    console.log(`Mock: Activating ${subscriptionType} for user ${userId}`);
    return { success: true, type: subscriptionType };
  }
};
const { v4: uuidv4 } = require('uuid');

// Создаем экземпляр Subscription Service
const subscriptionServiceInstance = SubscriptionService;

/**
 * Создание платежа для пополнения кредитов
 */
async function createCreditsPayment(
  organizationId,
  userId,
  creditsAmount,
  returnUrl
) {
  try {
    logYooKassaOperation('create_credits_payment_start', {
      organizationId,
      userId,
      creditsAmount
    });

    // Валидация суммы кредитов
    if (creditsAmount <= 0) {
      throw new Error('Количество кредитов должно быть больше 0');
    }

    if (creditsAmount > 10000) {
      throw new Error('Максимальное количество кредитов за один платеж: 10000 т CO₂');
    }

    // Расчет стоимости (5 рублей за тонну CO₂)
    const pricePerCredit = 5; // рублей за т CO₂
    const totalPrice = creditsAmount * pricePerCredit;

    // Проверка минимальной и максимальной суммы
    if (totalPrice < PAYMENT_CONSTANTS.MIN_AMOUNT) {
      throw new Error(`Минимальная сумма платежа: ${PAYMENT_CONSTANTS.MIN_AMOUNT} рублей`);
    }

    if (totalPrice > PAYMENT_CONSTANTS.MAX_AMOUNT) {
      throw new Error(`Максимальная сумма платежа: ${PAYMENT_CONSTANTS.MAX_AMOUNT} рублей`);
    }

    const client = createYooKassaClient();
    
    const paymentRequest = {
      amount: {
        value: totalPrice.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || process.env.YOOKASSA_RETURN_URL || 'http://localhost:3000/payment/success'
      },
      metadata: {
        type: PaymentType.CREDITS,
        organizationId,
        userId,
        creditsAmount,
        description: `Пополнение кредитов: ${creditsAmount} т CO₂`
      },
      description: `Пополнение кредитов ESG-Lite: ${creditsAmount} т CO₂`,
      capture: true
    };

    const idempotenceKey = uuidv4();
    const payment = await client.createPayment(paymentRequest, idempotenceKey);

    logYooKassaOperation('create_credits_payment_success', {
      paymentId: payment.id,
      amount: totalPrice,
      creditsAmount,
      organizationId
    });

    return payment;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logYooKassaOperation('create_credits_payment_error', {
      organizationId,
      creditsAmount,
      error: errorMessage
    }, 'error');

    throw new Error(`Ошибка создания платежа за кредиты: ${errorMessage}`);
  }
}

/**
 * Создание платежа для подписки
 */
async function createSubscriptionPayment(
  organizationId,
  userId,
  subscriptionPlan,
  returnUrl
) {
  try {
    logYooKassaOperation('create_subscription_payment_start', {
      organizationId,
      userId,
      subscriptionPlan
    });

    // Определение стоимости подписки
    const subscriptionPrices = {
      LITE_ANNUAL: 40000, // 40k рублей
      CBAM_ADDON: 15000   // 15k рублей
    };

    const totalPrice = subscriptionPrices[subscriptionPlan];
    
    if (!totalPrice) {
      throw new Error(`Неизвестный план подписки: ${subscriptionPlan}`);
    }

    const client = createYooKassaClient();

    const paymentRequest = {
      amount: {
        value: totalPrice.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || process.env.YOOKASSA_RETURN_URL || 'http://localhost:3000/payment/success'
      },
      metadata: {
        type: PaymentType.SUBSCRIPTION,
        organizationId,
        userId,
        subscriptionPlan,
        description: `Тариф ${subscriptionPlan}`
      },
      description: `Тариф ESG-Lite: ${subscriptionPlan}`,
      capture: true
    };

    const idempotenceKey = uuidv4();
    const payment = await client.createPayment(paymentRequest, idempotenceKey);

    logYooKassaOperation('create_subscription_payment_success', {
      paymentId: payment.id,
      amount: totalPrice,
      subscriptionPlan,
      organizationId
    });

    return payment;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logYooKassaOperation('create_subscription_payment_error', {
      organizationId,
      subscriptionPlan,
      error: errorMessage
    }, 'error');

    throw new Error(`Ошибка создания платежа за подписку: ${errorMessage}`);
  }
}

/**
 * Создание платежа для marketplace (услуги экспертов)
 */
async function createMarketplacePayment(
  organizationId,
  userId,
  expertId,
  serviceId,
  amount,
  description,
  returnUrl
) {
  try {
    logYooKassaOperation('create_marketplace_payment_start', {
      organizationId,
      userId,
      expertId,
      serviceId,
      amount
    });

    // Валидация суммы
    if (amount < PAYMENT_CONSTANTS.MIN_AMOUNT) {
      throw new Error(`Минимальная сумма платежа: ${PAYMENT_CONSTANTS.MIN_AMOUNT} рублей`);
    }

    if (amount > PAYMENT_CONSTANTS.MAX_AMOUNT) {
      throw new Error(`Максимальная сумма платежа: ${PAYMENT_CONSTANTS.MAX_AMOUNT} рублей`);
    }

    const client = createYooKassaClient();

    const paymentRequest = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl || process.env.YOOKASSA_RETURN_URL || 'http://localhost:3000/payment/success'
      },
      metadata: {
        type: PaymentType.MARKETPLACE,
        organizationId,
        userId,
        expertId,
        serviceId,
        description
      },
      description: `Услуга эксперта: ${description}`,
      capture: true
    };

    const idempotenceKey = uuidv4();
    const payment = await client.createPayment(paymentRequest, idempotenceKey);

    logYooKassaOperation('create_marketplace_payment_success', {
      paymentId: payment.id,
      amount,
      expertId,
      serviceId,
      organizationId
    });

    return payment;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logYooKassaOperation('create_marketplace_payment_error', {
      organizationId,
      expertId,
      serviceId,
      amount,
      error: errorMessage
    }, 'error');

    throw new Error(`Ошибка создания платежа за услугу эксперта: ${errorMessage}`);
  }
}

/**
 * Получение информации о платеже
 */
async function getPaymentInfo(paymentId) {
  try {
    const client = createYooKassaClient();
    const payment = await client.getPayment(paymentId);

    logYooKassaOperation('get_payment_info', {
      paymentId,
      status: payment.status,
      amount: payment.amount.value
    });

    return payment;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logYooKassaOperation('get_payment_info_error', {
      paymentId,
      error: errorMessage
    }, 'error');

    throw new Error(`Ошибка получения информации о платеже: ${errorMessage}`);
  }
}

/**
 * Обработка webhook callback'а от YooKassa
 */
async function processPaymentWebhook(requestBody, headers) {
  try {
    // Валидация подписи webhook
    if (!validateWebhookSignature(requestBody, headers)) {
      logYooKassaOperation('webhook_invalid_signature', {
        headers: Object.keys(headers)
      }, 'error');
      
      return {
        success: false,
        message: 'Неверная подпись webhook'
      };
    }

    const webhookData = JSON.parse(requestBody);
    const { type, event, object: payment } = webhookData;

    logYooKassaOperation('webhook_received', {
      type,
      event,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount.value
    });

    // Обрабатываем только успешные платежи
    if (event === 'payment.succeeded' && payment.status === 'succeeded') {
      await processSuccessfulPayment(payment);
      
      return {
        success: true,
        message: 'Платеж успешно обработан'
      };
    }

    // Обрабатываем отмененные платежи
    if (event === 'payment.canceled') {
      logYooKassaOperation('payment_canceled', {
        paymentId: payment.id,
        metadata: payment.metadata
      }, 'warn');
      
      return {
        success: true,
        message: 'Платеж отменен'
      };
    }

    return {
      success: true,
      message: `Событие ${event} обработано`
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logYooKassaOperation('webhook_processing_error', {
      error: errorMessage,
      requestBody: requestBody.substring(0, 500) // Логируем только первые 500 символов
    }, 'error');

    return {
      success: false,
      message: `Ошибка обработки webhook: ${errorMessage}`
    };
  }
}

/**
 * Обработка успешного платежа
 */
async function processSuccessfulPayment(payment) {
  const { metadata } = payment;
  
  try {
    switch (metadata.type) {
      case PaymentType.CREDITS:
        // Пополнение кредитов
        if (metadata.creditsAmount && metadata.organizationId) {
          await creditsService.creditCredits(
            metadata.organizationId,
            metadata.creditsAmount,
            `Пополнение кредитов через платеж ${payment.id}`
          );
          
          logYooKassaOperation('credits_added', {
            paymentId: payment.id,
            organizationId: metadata.organizationId,
            creditsAmount: metadata.creditsAmount
          });
        }
        break;

      case PaymentType.SUBSCRIPTION:
        // Активация подписки
        if (metadata.subscriptionPlan && metadata.organizationId) {
          const result = await subscriptionServiceInstance.activateSubscription(
            metadata.organizationId
          );
          
          logYooKassaOperation('subscription_activated', {
            paymentId: payment.id,
            organizationId: metadata.organizationId,
            subscriptionPlan: metadata.subscriptionPlan,
            success: result.success
          });
        }
        break;

      case PaymentType.MARKETPLACE:
        // Обработка marketplace платежа (эскроу)
        logYooKassaOperation('marketplace_payment_received', {
          paymentId: payment.id,
          organizationId: metadata.organizationId,
          expertId: metadata.expertId,
          serviceId: metadata.serviceId,
          amount: payment.amount.value
        });
        
        // TODO: Реализовать эскроу логику для marketplace
        // - Заблокировать средства
        // - Уведомить эксперта о новом заказе
        // - Создать задачу для выполнения услуги
        break;

      default:
        logYooKassaOperation('unknown_payment_type', {
          paymentId: payment.id,
          paymentType: metadata.type
        }, 'warn');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logYooKassaOperation('successful_payment_processing_error', {
      paymentId: payment.id,
      paymentType: metadata.type,
      error: errorMessage
    }, 'error');

    throw error;
  }
}

module.exports = {
  createCreditsPayment,
  createSubscriptionPayment,
  createMarketplacePayment,
  getPaymentInfo,
  processPaymentWebhook,
  processSuccessfulPayment
};
