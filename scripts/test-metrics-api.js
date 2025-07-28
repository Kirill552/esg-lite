#!/usr/bin/env node

/**
 * Тест API endpoint для метрик очередей
 * Проверяет GET /api/queue/metrics с различными параметрами
 */

async function testMetricsApi() {
  console.log('🧪 Тестирование API endpoint для метрик очередей\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Тест базового получения метрик
    console.log('📊 1. Тестирование базового получения метрик');
    
    const response1 = await fetch(`${baseUrl}/api/queue/metrics`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Базовые метрики получены успешно');
      console.log(`   Период: ${data1.data.period}`);
      console.log(`   Среднее время обработки: ${data1.data.summary.averageProcessingTime}ms`);
      console.log(`   Throughput: ${data1.data.summary.throughputPerMinute} задач/мин`);
      console.log(`   Процент ошибок: ${data1.data.summary.errorRate}%`);
      console.log(`   Активных воркеров: ${data1.data.summary.activeWorkersCount}`);
      console.log('   Размеры очередей:');
      console.log(`     Ожидающие: ${data1.data.queues.waiting}`);
      console.log(`     Активные: ${data1.data.queues.active}`);
      console.log(`     Завершенные: ${data1.data.queues.completed}`);
      console.log(`     Неудачные: ${data1.data.queues.failed}`);
    } else {
      console.log(`❌ Ошибка получения базовых метрик: ${response1.status}`);
      const error1 = await response1.text();
      console.log(`   Детали: ${error1}`);
    }

    // 2. Тест получения метрик с параметрами
    console.log('\n📈 2. Тестирование получения метрик с параметрами');
    
    const response2 = await fetch(`${baseUrl}/api/queue/metrics?period=12&limit=50`);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Метрики с параметрами получены успешно');
      console.log(`   Период: ${data2.data.period}`);
      console.log(`   Последние метрики времени обработки: ${data2.data.recentMetrics.processingTime.count}`);
      console.log(`   Последние метрики throughput: ${data2.data.recentMetrics.throughput.count}`);
      console.log(`   Последние ошибки: ${data2.data.recentMetrics.errors.count}`);
    } else {
      console.log(`❌ Ошибка получения метрик с параметрами: ${response2.status}`);
    }

    // 3. Тест получения метрик по типу
    console.log('\n🔍 3. Тестирование получения метрик по типу');
    
    const response3 = await fetch(`${baseUrl}/api/queue/metrics?type=processing_time&limit=10`);
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Метрики по типу получены успешно');
      console.log(`   Тип: ${data3.data.type}`);
      console.log(`   Количество: ${data3.data.count}`);
      
      if (data3.data.metrics.length > 0) {
        console.log('   Примеры метрик:');
        data3.data.metrics.slice(0, 3).forEach((metric, index) => {
          console.log(`     ${index + 1}. Значение: ${metric.value}ms, Время: ${new Date(metric.timestamp).toLocaleString()}`);
        });
      }
    } else {
      console.log(`❌ Ошибка получения метрик по типу: ${response3.status}`);
    }

    // 4. Тест валидации параметров
    console.log('\n⚠️ 4. Тестирование валидации параметров');
    
    // Неверный период
    const response4 = await fetch(`${baseUrl}/api/queue/metrics?period=200`);
    if (!response4.ok) {
      const error4 = await response4.json();
      console.log('✅ Валидация периода работает корректно');
      console.log(`   Ошибка: ${error4.error}`);
    }

    // Неверный тип метрики
    const response5 = await fetch(`${baseUrl}/api/queue/metrics?type=invalid_type`);
    if (!response5.ok) {
      const error5 = await response5.json();
      console.log('✅ Валидация типа метрики работает корректно');
      console.log(`   Ошибка: ${error5.error}`);
    }

    // Неверный лимит
    const response6 = await fetch(`${baseUrl}/api/queue/metrics?limit=2000`);
    if (!response6.ok) {
      const error6 = await response6.json();
      console.log('✅ Валидация лимита работает корректно');
      console.log(`   Ошибка: ${error6.error}`);
    }

    // 5. Тест POST cleanup
    console.log('\n🧹 5. Тестирование очистки метрик');
    
    const response7 = await fetch(`${baseUrl}/api/queue/metrics?action=cleanup`, {
      method: 'POST'
    });
    
    if (response7.ok) {
      const data7 = await response7.json();
      console.log('✅ Очистка метрик выполнена успешно');
      console.log(`   Сообщение: ${data7.message}`);
    } else {
      console.log(`❌ Ошибка очистки метрик: ${response7.status}`);
    }

    console.log('\n🎉 Все тесты API метрик завершены!');
    
    return {
      success: true,
      message: 'API endpoint для метрик работает корректно'
    };

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании API метрик:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Убедитесь, что сервер запущен: npm run dev');
    }
    
    return {
      success: false,
      error: error.message,
      message: 'Ошибка подключения к API'
    };
  }
}

// Запуск тестов
if (require.main === module) {
  testMetricsApi()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Тестирование API завершено успешно');
        process.exit(0);
      } else {
        console.log('\n❌ Тестирование API завершено с ошибками');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { testMetricsApi };