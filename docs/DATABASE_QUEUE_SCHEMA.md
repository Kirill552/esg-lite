# Database Schema Updates for Queue System

## Задача 8.1: Добавление полей для отслеживания задач в таблицу documents

### Описание
Обновление схемы базы данных для поддержки системы очередей с отслеживанием статуса и времени обработки задач.

### Требования выполнены
- ✅ **1.1**: Поддержка асинхронной обработки с отслеживанием задач
- ✅ **4.1**: Возможность запроса статуса задачи по jobId
- ✅ **4.2**: Отслеживание времени начала и завершения обработки

## Обновления модели Document

### Новые поля

```prisma
model Document {
  // ... существующие поля ...
  
  // Новые поля для отслеживания задач
  jobId                 String?        // ID задачи в очереди
  queueStatus           QueueStatus?   // Статус задачи в очереди
  processingStartedAt   DateTime?      // Время начала обработки
  processingCompletedAt DateTime?      // Время завершения обработки
  
  // ... остальные поля ...
}
```

### Новый Enum QueueStatus

```prisma
enum QueueStatus {
  WAITING    // Задача ожидает в очереди
  ACTIVE     // Задача активно обрабатывается
  COMPLETED  // Задача успешно завершена
  FAILED     // Задача завершилась с ошибкой
  DELAYED    // Задача отложена (retry)
  STALLED    // Задача зависла (требует вмешательства)
}
```

### Новые индексы для производительности

```prisma
@@index([jobId])                    // Быстрый поиск по ID задачи
@@index([queueStatus])              // Фильтрация по статусу очереди
@@index([userId, queueStatus])      // Задачи пользователя по статусу
@@index([processingStage])          // Существующий индекс (сохранен)
```

## Жизненный цикл задачи

### 1. Создание задачи
```typescript
await prisma.document.update({
  where: { id: documentId },
  data: {
    jobId: 'job-abc123',
    queueStatus: 'WAITING',
    status: 'QUEUED',
    processingProgress: 0,
    processingStage: 'queued',
    processingMessage: 'Задача добавлена в очередь'
  }
});
```

### 2. Начало обработки
```typescript
await prisma.document.update({
  where: { jobId: 'job-abc123' },
  data: {
    queueStatus: 'ACTIVE',
    status: 'PROCESSING',
    processingStartedAt: new Date(),
    processingProgress: 10,
    processingStage: 'processing',
    processingMessage: 'Обработка OCR началась'
  }
});
```

### 3. Обновление прогресса
```typescript
await prisma.document.update({
  where: { jobId: 'job-abc123' },
  data: {
    processingProgress: 65,
    processingMessage: 'OCR обработка: 65%'
  }
});
```

### 4. Завершение обработки
```typescript
await prisma.document.update({
  where: { jobId: 'job-abc123' },
  data: {
    queueStatus: 'COMPLETED',
    status: 'PROCESSED',
    processingCompletedAt: new Date(),
    processingProgress: 100,
    processingStage: 'completed',
    processingMessage: 'OCR обработка завершена успешно',
    ocrProcessed: true,
    ocrConfidence: 0.95
  }
});
```

## Эффективные запросы

### Поиск документа по jobId
```typescript
const document = await prisma.document.findFirst({
  where: { jobId: 'job-abc123' }
});
```
**Использует индекс**: `jobId`

### Активные задачи пользователя
```typescript
const activeTasks = await prisma.document.findMany({
  where: {
    userId: 'user123',
    queueStatus: 'ACTIVE'
  }
});
```
**Использует индекс**: `userId + queueStatus`

### Завершенные задачи за период
```typescript
const completedTasks = await prisma.document.findMany({
  where: {
    queueStatus: 'COMPLETED',
    processingCompletedAt: {
      gte: startDate,
      lte: endDate
    }
  }
});
```
**Использует индекс**: `queueStatus`

### Проблемные задачи
```typescript
const problematicTasks = await prisma.document.findMany({
  where: {
    queueStatus: {
      in: ['FAILED', 'STALLED']
    }
  }
});
```
**Использует индекс**: `queueStatus`

### Статистика времени обработки
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as avg_processing_time,
  COUNT(*) as total_completed,
  MIN(processing_completed_at) as earliest_completion,
  MAX(processing_completed_at) as latest_completion
FROM documents 
WHERE queue_status = 'COMPLETED'
  AND processing_started_at IS NOT NULL
  AND processing_completed_at IS NOT NULL;
```

## Мониторинг и аналитика

### Статистика очереди
```typescript
const queueStats = await prisma.document.groupBy({
  by: ['queueStatus'],
  _count: {
    id: true
  },
  where: {
    queueStatus: {
      not: null
    }
  }
});
```

### Производительность по пользователям
```typescript
const userPerformance = await prisma.document.groupBy({
  by: ['userId'],
  _count: {
    id: true
  },
  _avg: {
    processingProgress: true
  },
  where: {
    queueStatus: 'COMPLETED',
    processingStartedAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // последние 24 часа
    }
  }
});
```

### Задачи, требующие внимания
```typescript
const stalledTasks = await prisma.document.findMany({
  where: {
    OR: [
      {
        queueStatus: 'STALLED'
      },
      {
        queueStatus: 'ACTIVE',
        processingStartedAt: {
          lt: new Date(Date.now() - 10 * 60 * 1000) // активные более 10 минут
        }
      }
    ]
  },
  include: {
    user: {
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    }
  }
});
```

## Миграция данных

### Обновление существующих записей
```sql
-- Установка queueStatus для существующих документов
UPDATE documents 
SET queue_status = CASE 
  WHEN status = 'QUEUED' THEN 'WAITING'
  WHEN status = 'PROCESSING' THEN 'ACTIVE'
  WHEN status = 'PROCESSED' THEN 'COMPLETED'
  WHEN status = 'FAILED' THEN 'FAILED'
  ELSE NULL
END
WHERE queue_status IS NULL;
```

### Очистка старых данных
```sql
-- Удаление старых завершенных задач (старше 30 дней)
DELETE FROM documents 
WHERE queue_status = 'COMPLETED' 
  AND processing_completed_at < NOW() - INTERVAL '30 days';
```

## Рекомендации по использованию

### Индексы
- Используйте составные индексы для частых комбинаций фильтров
- Мониторьте производительность запросов с помощью `EXPLAIN ANALYZE`
- Регулярно обновляйте статистику таблиц

### Очистка данных
- Настройте автоматическую очистку старых завершенных задач
- Архивируйте данные о задачах для аналитики
- Мониторьте размер таблицы documents

### Мониторинг
- Отслеживайте количество задач в каждом статусе
- Мониторьте среднее время обработки
- Настройте алерты на застрявшие задачи

## Совместимость

### Обратная совместимость
- Все новые поля nullable, существующий код продолжит работать
- Существующие индексы сохранены
- Enum DocumentStatus остался без изменений

### Будущие расширения
- Поддержка приоритетов задач
- Метаданные задач (JSON поле)
- История изменений статуса
- Группировка связанных задач

## Применение изменений

```bash
# Применение изменений к базе данных
npx prisma db push

# Генерация нового Prisma Client
npx prisma generate

# Проверка схемы
npx prisma db pull
```

## Тестирование

```bash
# Запуск тестов новых полей
node scripts/test-document-queue-fields.js

# Проверка производительности индексов
node scripts/test-database-performance.js
```