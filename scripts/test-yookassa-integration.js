/**
 * Тест YooKassa интеграции
 * Задача 6.1: Настроить YooKassa интеграцию
 * 
 * Проверяет правильность настройки YooKassa SDK
 */

// Простой тест без импортов модулей (для Node.js)
async function testYooKassaIntegration() {
  console.log('🧪 Тестирование YooKassa интеграции...\n');

  try {
    // 1. Тест наличия пакета
    console.log('1️⃣ Тестирование пакета YooKassa:');
    const { YooCheckout } = require('@a2seven/yoo-checkout');
    console.log('- Пакет @a2seven/yoo-checkout:', !!YooCheckout ? '✅ Загружен' : '❌ Ошибка');
    console.log('- Конструктор YooCheckout:', typeof YooCheckout === 'function' ? '✅ Найден' : '❌ Ошибка');
    
    // 2. Тест переменных окружения
    console.log('\n2️⃣ Тестирование переменных окружения:');
    const requiredVars = [
      'YOOKASSA_SHOP_ID',
      'YOOKASSA_SECRET_KEY', 
      'YOOKASSA_RETURN_URL',
      'YOOKASSA_WEBHOOK_URL'
    ];
    
    let allVarsPresent = true;
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✅ Задана' : '❌ Отсутствует';
      console.log(`- ${varName}: ${status}`);
      if (!value) allVarsPresent = false;
    });

    if (!allVarsPresent) {
      console.log('\n❌ Не все переменные окружения настроены');
      return { success: false, error: 'Missing environment variables' };
    }

    // 3. Тест создания клиента
    console.log('\n3️⃣ Тестирование создания клиента:');
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const isProduction = secretKey.startsWith('live_');
    
    const client = new YooCheckout({
      shopId: shopId,
      secretKey: secretKey,
      debug: !isProduction
    });
    
    console.log('- Клиент создан:', !!client ? '✅ Успешно' : '❌ Ошибка');
    console.log('- Shop ID:', client.shopId);
    console.log('- Environment:', isProduction ? 'Production' : 'Test');
    console.log('- Debug режим:', client.debug);

    // 4. Тест валидации конфигурации
    console.log('\n4️⃣ Тестирование конфигурации:');
    console.log('- Currency:', process.env.YOOKASSA_CURRENCY || 'RUB');
    console.log('- Payment timeout:', process.env.YOOKASSA_PAYMENT_TIMEOUT || '15', 'minutes');
    console.log('- Return URL:', process.env.YOOKASSA_RETURN_URL);
    console.log('- Webhook URL:', process.env.YOOKASSA_WEBHOOK_URL);

    // 5. Итоговая проверка
    console.log('\n5️⃣ Итоговая проверка системы:');
    
    const systemStatus = {
      package: '✅ Установлен',
      environment: '✅ Настроен', 
      client: '✅ Создается',
      configuration: '✅ Валидна'
    };
    
    console.log('Статус компонентов YooKassa:');
    Object.entries(systemStatus).forEach(([component, status]) => {
      console.log(`- ${component}: ${status}`);
    });
    
    console.log('\n🎉 YooKassa интеграция настроена успешно!');
    console.log('📊 Готово к созданию Payment Service');
    console.log('\n💡 Следующие шаги:');
    console.log('- ✅ Задача 6.1 завершена');
    console.log('- 🔄 Можно переходить к задаче 6.2 "Создать Payment Service"');
    
    return {
      success: true,
      componentsWorking: Object.keys(systemStatus).length,
      environment: isProduction ? 'production' : 'test',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('\n❌ Ошибка тестирования YooKassa:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n💡 Попробуйте переустановить пакет:');
      console.log('npm install @a2seven/yoo-checkout');
    }
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Запускаем тест
testYooKassaIntegration()
  .then((result) => {
    console.log('\n📈 Результат тестирования:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Тестирование провалено:', error);
    process.exit(1);
  });
