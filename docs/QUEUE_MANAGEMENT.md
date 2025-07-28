# Управление очередями - Расширенные методы

## Обзор

Расширенные методы управления очередями предоставляют детальный контроль над задачами, статистику производительности и инструменты для мониторинга.

## Методы управления задачами

### `getDetailedQueueStats()`

Получение детальной статистики с разбивкой по статусам:

```typescript
const stats = await queueManager.getDetailedQueueStats();
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   completed: 150,
//   failed: 3,
//   total: 160,
//   byStatus: {
//     created: 5,
//     active: 2,
//     completed: 150,
//     failed: 3
//   }
// }
```

### `getActiveJobs(limit?)`

Получение списка активных задач:

```typescript
const activeJobs = await queueManager.getActiveJobs(10);
activeJobs.forEach(job => {
  console.log(`Job ${job.id}: ${job.data.documentId}, Priority: ${job.priority}`);
});
```

### `getFailedJobs(limit?)`

Получение списка неудачных задач для анализа:

```typescript
const failedJobs = await queueManager.getFailedJobs(5);
failedJobs.forEach(job => {
  console.log(`Failed job ${job.id}: ${job.error}, Retries: ${job.retryCount}`);
});
```

### `retryFailedJob(jobId)`

Повторная обработка неудачной задачи:

```typescript
const newJobId = await queueManager.retryFailedJob('failed-job-123');
if (newJobId) {
  console.log(`Job restarted with new ID: ${newJobId}`);
}
```

### `cancelJob(jobId)`

Отмена задачи (если она еще не начала выполняться):

```typescript
const cancelled = await queueManager.cancelJob('job-123');
if (cancelled) {
  console.log('Job cancelled successfully');
}
```

## Методы очистки и обслуживания

### `cleanCompletedJobs(olderThanHours?)`

Очистка завершенных задач старше указанного времени:

```typescript
// Очистить задачи старше 24 часов
const cleanedCount = await queueManager.cleanCompletedJobs(24);
console.log(`Cleaned ${cleanedCount} old jobs`);

// Очистить задачи старше 1 часа
const recentCleanup = await queueManager.cleanCompletedJobs(1);
```

**Что очищается:**
- Задачи в статусе `completed`
- Задачи в статусе `failed`
- Задачи старше указанного времени

**Что НЕ очищается:**
- Активные задачи (`active`)
- Задачи в очереди (`created`, `retry`)
- Недавние задачи

## Метрики производительности

### `getPerformanceMetrics()`

Получение метрик производительности за последние 24 часа:

```typescript
const metrics = await queueManager.getPerformanceMetrics();
console.log(metrics);
// {
//   averageProcessingTime: 12.5, // секунды
//   throughputPerHour: 45,       // задач в час
//   errorRate: 0.02,             // 2% ошибок
//   queueHealth: 'healthy'       // healthy | warning | critical
// }
```

**Критерии здоровья очереди:**
- `healthy`: error rate < 10%
- `warning`: error rate 10-30%
- `critical`: error rate > 30%

## Интеграция с заглушками монетизации

### Проверка кредитов

Все методы добавления задач автоматически проверяют баланс кредитов:

```typescript
try {
  const jobId = await queueManager.addOcrJob(jobData);
} catch (error) {
  if (error.message === 'INSUFFICIENT_CREDITS') {
    console.log('Недостаточно кредитов для обработки');
  }
}
```

### Surge-pricing

В период 15-30 июня задачи автоматически получают высокий приоритет:

```typescript
const surgeInfo = queueManager.getSurgePricingInfo();
if (surgeInfo.isSurge) {
  console.log(`Surge период активен, множитель: x${surgeInfo.multiplier}`);
}
```

## Мониторинг и алерты

### Настройка мониторинга

```typescript
// Проверка здоровья очереди каждые 5 минут
setInterval(async () => {
  const metrics = await queueManager.getPerformanceMetrics();
  
  if (metrics.queueHealth === 'critical') {
    console.error('🚨 CRITICAL: Queue health is critical!');
    // Отправить алерт
  } else if (metrics.queueHealth === 'warning') {
    console.warn('⚠️ WARNING: Queue health needs attention');
  }
}, 5 * 60 * 1000);
```

### Автоматическая очистка

```typescript
// Очистка старых задач каждые 6 часов
setInterval(async () => {
  const cleaned = await queueManager.cleanCompletedJobs(24);
  console.log(`🧹 Cleaned ${cleaned} old jobs`);
}, 6 * 60 * 60 * 1000);
```

## API Endpoints

Для интеграции с фронтендом можно создать API endpoints:

### `GET /api/queue/stats`

```typescript
// app/api/queue/stats/route.ts
export async function GET() {
  const queueManager = await getQueueManager();
  const stats = await queueManager.getDetailedQueueStats();
  return NextResponse.json(stats);
}
```

### `GET /api/queue/metrics`

```typescript
// app/api/queue/metrics/route.ts
export async function GET() {
  const queueManager = await getQueueManager();
  const metrics = await queueManager.getPerformanceMetrics();
  return NextResponse.json(metrics);
}
```

### `POST /api/queue/retry/:jobId`

```typescript
// app/api/queue/retry/[jobId]/route.ts
export async function POST(request: Request, { params }: { params: { jobId: string } }) {
  const queueManager = await getQueueManager();
  const newJobId = await queueManager.retryFailedJob(params.jobId);
  
  if (newJobId) {
    return NextResponse.json({ success: true, newJobId });
  } else {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
```

## Лучшие практики

### 1. Регулярная очистка

```typescript
// Настройте автоматическую очистку
const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 часов
const CLEANUP_AGE_HOURS = 24; // 24 часа

setInterval(async () => {
  try {
    const cleaned = await queueManager.cleanCompletedJobs(CLEANUP_AGE_HOURS);
    console.log(`Cleaned ${cleaned} old jobs`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}, CLEANUP_INTERVAL);
```

### 2. Мониторинг производительности

```typescript
// Логирование метрик каждый час
setInterval(async () => {
  const metrics = await queueManager.getPerformanceMetrics();
  console.log('Queue metrics:', {
    avgTime: `${metrics.averageProcessingTime}s`,
    throughput: `${metrics.throughputPerHour}/h`,
    errorRate: `${(metrics.errorRate * 100).toFixed(1)}%`,
    health: metrics.queueHealth
  });
}, 60 * 60 * 1000);
```

### 3. Обработка неудачных задач

```typescript
// Автоматический retry для критических задач
const failedJobs = await queueManager.getFailedJobs(10);

for (const job of failedJobs) {
  if (job.retryCount < 3 && job.data.priority === 'urgent') {
    console.log(`Retrying urgent failed job: ${job.id}`);
    await queueManager.retryFailedJob(job.id);
  }
}
```

## Troubleshooting

### Высокий error rate

1. Проверьте неудачные задачи:
```typescript
const failedJobs = await queueManager.getFailedJobs(20);
// Анализируйте типичные ошибки
```

2. Проверьте доступность внешних сервисов (S3, OCR)

### Медленная обработка

1. Проверьте активные задачи:
```typescript
const activeJobs = await queueManager.getActiveJobs(10);
// Проверьте, не зависли ли задачи
```

2. Увеличьте concurrency в конфигурации

### Переполнение очереди

1. Увеличьте частоту очистки
2. Проверьте, не создаются ли дублирующиеся задачи
3. Рассмотрите увеличение лимитов