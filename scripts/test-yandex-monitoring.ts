/**
 * Тест интеграции с Yandex Cloud Monitoring
 * Проверяет отправку метрик PostgreSQL очередей
 */

import { yandexMonitoring } from '../lib/yandex-monitoring';
import { metricsCollector } from '../lib/metrics';

async function testYandexMonitoring() {
  console.log('🧪 Начинаем тест Yandex Cloud Monitoring...\n');

  try {
    // 1. Проверяем конфигурацию
    console.log('1️⃣ Проверка конфигурации...');
    console.log(`   YANDEX_CLOUD_FOLDER_ID: ${process.env.YANDEX_CLOUD_FOLDER_ID || 'НЕ ЗАДАН'}`);
    console.log(`   YANDEX_MONITORING_ENABLED: ${process.env.YANDEX_MONITORING_ENABLED || 'НЕ ЗАДАН'}`);
    console.log(`   Мониторинг включен: ${yandexMonitoring.isEnabled()}`);
    
    if (!yandexMonitoring.isEnabled()) {
      console.error('❌ Yandex Cloud Monitoring не настроен или отключен');
      console.log('\n📋 Проверьте переменные окружения:');
      console.log('   - YANDEX_CLOUD_FOLDER_ID');
      console.log('   - YANDEX_CLOUD_SA_KEY_FILE');
      console.log('   - YANDEX_MONITORING_ENABLED=true');
      return;
    }

    // 2. Тестовая отправка одной метрики
    console.log('\n2️⃣ Отправка тестовой метрики...');
    await yandexMonitoring.writeMetric('test_connection', 1, { 
      'test': 'true',
      'source': 'test_script'
    });
    console.log('✅ Тестовая метрика отправлена');

    // 3. Отправка реальных метрик системы
    console.log('\n3️⃣ Отправка системных метрик...');
    await metricsCollector.sendToYandexCloud();
    console.log('✅ Системные метрики отправлены');

    // 4. Отправка PostgreSQL метрик
    console.log('\n4️⃣ Отправка PostgreSQL метрик...');
    await metricsCollector.sendPostgreSQLMetrics();
    console.log('✅ PostgreSQL метрики отправлены');

    // 5. Тест массовой отправки метрик
    console.log('\n5️⃣ Тест массовой отправки метрик...');
    const batchMetrics = [
      { name: 'test_batch_1', value: Math.random() * 100 },
      { name: 'test_batch_2', value: Math.random() * 100 },
      { name: 'test_batch_3', value: Math.random() * 100 }
    ];
    
    await yandexMonitoring.writeMetricsWithRetry(batchMetrics);
    console.log('✅ Массовая отправка метрик выполнена');

    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('\n📊 Проверьте метрики в Yandex Cloud Console:');
    console.log(`   https://console.cloud.yandex.ru/folders/${process.env.YANDEX_CLOUD_FOLDER_ID}/monitoring`);

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('IAM token')) {
        console.log('\n🔧 Возможные причины ошибки IAM токена:');
        console.log('   1. Неправильный Service Account ключ');
        console.log('   2. У Service Account нет роли monitoring.editor');
        console.log('   3. Неправильный FOLDER_ID');
      }
      
      if (error.message.includes('403') || error.message.includes('401')) {
        console.log('\n🔧 Ошибка доступа:');
        console.log('   1. Проверьте роли Service Account в Yandex Cloud Console');
        console.log('   2. Убедитесь, что назначена роль monitoring.editor');
        console.log('   3. Проверьте правильность FOLDER_ID');
      }
    }
  }
}

// Запуск теста
if (require.main === module) {
  testYandexMonitoring()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

export { testYandexMonitoring };
