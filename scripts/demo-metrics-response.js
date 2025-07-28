#!/usr/bin/env node

/**
 * Демонстрация ответа API метрик
 * Показывает, как будет выглядеть JSON ответ от /api/queue/metrics
 */

function demoMetricsResponse() {
  console.log('📊 Демонстрация ответа API метрик\n');

  // Симулируем реальный ответ API
  const mockResponse = {
    success: true,
    data: {
      period: "24h",
      summary: {
        averageProcessingTime: 1847,
        throughputPerMinute: 8.5,
        errorRate: 2.3,
        failedJobsCount: 12,
        activeWorkersCount: 3
      },
      queues: {
        waiting: 15,
        active: 7,
        completed: 1250,
        failed: 12
      },
      recentMetrics: {
        processingTime: {
          count: 45,
          latest: [
            { value: 1200, timestamp: "2025-07-27T15:30:00.000Z" },
            { value: 2100, timestamp: "2025-07-27T15:25:00.000Z" },
            { value: 890, timestamp: "2025-07-27T15:20:00.000Z" },
            { value: 1650, timestamp: "2025-07-27T15:15:00.000Z" },
            { value: 2300, timestamp: "2025-07-27T15:10:00.000Z" }
          ]
        },
        throughput: {
          count: 24,
          latest: [
            { value: 8.5, timestamp: "2025-07-27T15:30:00.000Z" },
            { value: 9.2, timestamp: "2025-07-27T15:25:00.000Z" },
            { value: 7.8, timestamp: "2025-07-27T15:20:00.000Z" },
            { value: 8.1, timestamp: "2025-07-27T15:15:00.000Z" },
            { value: 9.5, timestamp: "2025-07-27T15:10:00.000Z" }
          ]
        },
        errors: {
          count: 8,
          latest: [
            {
              type: "OCR_PROCESSING_ERROR",
              message: "Не удалось обработать файл",
              timestamp: "2025-07-27T15:28:00.000Z"
            },
            {
              type: "FILE_NOT_FOUND",
              message: "Файл не найден в хранилище",
              timestamp: "2025-07-27T15:22:00.000Z"
            },
            {
              type: "NETWORK_ERROR",
              message: "Таймаут подключения",
              timestamp: "2025-07-27T15:18:00.000Z"
            }
          ]
        }
      },
      periodInfo: {
        start: "2025-07-26T15:30:00.000Z",
        end: "2025-07-27T15:30:00.000Z",
        duration: "24 hours"
      }
    },
    timestamp: "2025-07-27T15:30:15.123Z"
  };

  console.log('✅ Пример ответа GET /api/queue/metrics:');
  console.log(JSON.stringify(mockResponse, null, 2));

  console.log('\n📈 Ключевые метрики из ответа:');
  console.log(`   Среднее время обработки: ${mockResponse.data.summary.averageProcessingTime}ms`);
  console.log(`   Пропускная способность: ${mockResponse.data.summary.throughputPerMinute} задач/мин`);
  console.log(`   Процент ошибок: ${mockResponse.data.summary.errorRate}%`);
  console.log(`   Неудачных задач: ${mockResponse.data.summary.failedJobsCount}`);
  console.log(`   Активных воркеров: ${mockResponse.data.summary.activeWorkersCount}`);

  console.log('\n📊 Состояние очередей:');
  console.log(`   Ожидающие: ${mockResponse.data.queues.waiting}`);
  console.log(`   Активные: ${mockResponse.data.queues.active}`);
  console.log(`   Завершенные: ${mockResponse.data.queues.completed}`);
  console.log(`   Неудачные: ${mockResponse.data.queues.failed}`);

  console.log('\n🔍 Последние метрики времени обработки:');
  mockResponse.data.recentMetrics.processingTime.latest.forEach((metric, index) => {
    const time = new Date(metric.timestamp).toLocaleTimeString();
    console.log(`   ${index + 1}. ${metric.value}ms в ${time}`);
  });

  console.log('\n❌ Последние ошибки:');
  mockResponse.data.recentMetrics.errors.latest.forEach((error, index) => {
    const time = new Date(error.timestamp).toLocaleTimeString();
    console.log(`   ${index + 1}. ${error.type}: ${error.message} в ${time}`);
  });

  // Демонстрация ответа для конкретного типа метрики
  console.log('\n\n🔍 Пример ответа GET /api/queue/metrics?type=processing_time:');
  
  const typeResponse = {
    success: true,
    data: {
      type: "processing_time",
      period: "24h",
      count: 45,
      metrics: [
        {
          id: "processing_time_1753614039701_1",
          value: 1200,
          metadata: { jobId: "job_123" },
          timestamp: "2025-07-27T15:30:00.000Z",
          expiresAt: "2025-08-03T15:30:00.000Z"
        },
        {
          id: "processing_time_1753614039701_2", 
          value: 2100,
          metadata: { jobId: "job_124" },
          timestamp: "2025-07-27T15:25:00.000Z",
          expiresAt: "2025-08-03T15:25:00.000Z"
        }
      ]
    },
    timestamp: "2025-07-27T15:30:15.123Z"
  };

  console.log(JSON.stringify(typeResponse, null, 2));

  console.log('\n💡 Использование API:');
  console.log('   GET /api/queue/metrics - общие метрики');
  console.log('   GET /api/queue/metrics?period=12 - метрики за 12 часов');
  console.log('   GET /api/queue/metrics?type=processing_time - метрики времени обработки');
  console.log('   GET /api/queue/metrics?limit=50 - ограничить количество записей');
  console.log('   POST /api/queue/metrics?action=cleanup - очистить устаревшие метрики');

  console.log('\n🎉 Демонстрация завершена!');
}

// Запуск демонстрации
if (require.main === module) {
  demoMetricsResponse();
}

module.exports = { demoMetricsResponse };