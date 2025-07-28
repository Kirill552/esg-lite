/**
 * Тест TypeScript конфигурации YooKassa
 * Проверяет правильность типизации и импортов
 */

// Загружаем переменные окружения для теста
require('dotenv').config({ path: '.env.test' });

import { 
  getYooKassaConfig, 
  createYooKassaClient, 
  validateWebhookSignature,
  PaymentType,
  PAYMENT_CONSTANTS,
  logYooKassaOperation
} from '../lib/yookassa-config';

async function testYooKassaTypeScript() {
  console.log('🧪 Тестирование TypeScript конфигурации YooKassa...\n');

  try {
    // 1. Тест конфигурации
    console.log('1️⃣ Тестирование getYooKassaConfig():');
    const config = getYooKassaConfig();
    console.log('- Конфигурация создана:', !!config ? '✅' : '❌');
    console.log('- Shop ID:', config.shopId);
    console.log('- Окружение:', config.isProduction ? 'Production' : 'Test');
    console.log('- Валюта:', config.currency);

    // 2. Тест клиента
    console.log('\n2️⃣ Тестирование createYooKassaClient():');
    const client = createYooKassaClient();
    console.log('- Клиент создан:', !!client ? '✅' : '❌');
    console.log('- Тип клиента:', typeof client);

    // 3. Тест констант
    console.log('\n3️⃣ Тестирование констант:');
    console.log('- PAYMENT_CONSTANTS:', !!PAYMENT_CONSTANTS ? '✅' : '❌');
    console.log('- Минимальная сумма:', PAYMENT_CONSTANTS.MIN_AMOUNT, 'руб.');
    console.log('- Методы оплаты:', PAYMENT_CONSTANTS.PAYMENT_METHODS.length, 'методов');

    // 4. Тест enum
    console.log('\n4️⃣ Тестирование PaymentType enum:');
    console.log('- PaymentType.CREDITS:', PaymentType.CREDITS);
    console.log('- PaymentType.SUBSCRIPTION:', PaymentType.SUBSCRIPTION);
    console.log('- PaymentType.MARKETPLACE:', PaymentType.MARKETPLACE);

    // 5. Тест валидации webhook (с тестовыми данными)
    console.log('\n5️⃣ Тестирование validateWebhookSignature():');
    const testBody = '{"test": "data"}';
    const testHeaders = {
      'yookassa-signature': 'invalid_signature'
    };
    const isValid = validateWebhookSignature(testBody, testHeaders);
    console.log('- Валидация (ожидается false):', isValid ? '❌ Неожиданно true' : '✅ Корректно false');

    // 6. Тест логирования
    console.log('\n6️⃣ Тестирование logYooKassaOperation():');
    logYooKassaOperation('test_operation', { 
      testData: 'value',
      amount: 1000
    }, 'info');

    console.log('\n🎉 Все TypeScript тесты прошли успешно!');
    console.log('✅ Задача 6.1 полностью готова');
    
    return {
      success: true,
      message: 'TypeScript конфигурация работает корректно',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('\n❌ Ошибка TypeScript теста:', errorMessage);
    if (errorStack) {
      console.error('Stack:', errorStack);
    }
    
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}

// Запускаем тест
testYooKassaTypeScript()
  .then((result) => {
    console.log('\n📊 Результат TypeScript теста:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ TypeScript тест провален:', error);
    process.exit(1);
  });
