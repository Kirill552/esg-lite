# OCR Status API Documentation

## Задача 6.2: Обновленный GET /api/ocr для проверки статуса задач

### Описание
API endpoint для проверки статуса задач OCR в системе очередей BullMQ + PostgreSQL.

### Требования выполнены
- ✅ **4.1**: Возврат текущего состояния (queued/processing/completed/failed)
- ✅ **4.2**: Предоставление результатов OCR для завершенных задач
- ✅ **4.3**: Возврат описания ошибки и кода для диагностики

## API Endpoints

### GET /api/ocr

#### Параметры запроса
- `jobId` (string, optional) - ID задачи в очереди (приоритет)
- `documentId` (string, optional) - ID документа в БД (fallback)

**Примечание**: Должен быть указан либо `jobId`, либо `documentId`.

#### Примеры запросов

```bash
# Проверка статуса по jobId
GET /api/ocr?jobId=job-123

# Проверка статуса по documentId  
GET /api/ocr?documentId=doc-456
```

#### Структура ответа

##### Успешный ответ (200)
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "status": "processing",
    "progress": 65,
    "priority": "normal",
    "createdAt": "2025-01-27T10:00:00Z",
    "processedAt": "2025-01-27T10:01:00Z",
    "finishedAt": null,
    "document": {
      "id": "doc-456",
      "fileName": "invoice.pdf",
      "fileSize": 1024000,
      "dbStatus": "PROCESSING",
      "processingProgress": 65,
      "processingStage": "processing",
      "processingMessage": "Обработка OCR..."
    },
    "ocrResults": null,
    "error": null,
    "metadata": {
      "documentId": "doc-456",
      "fileKey": "uploads/invoice.pdf",
      "userId": "user_123",
      "organizationId": "org_456"
    }
  }
}
```

##### Завершенная задача с результатами OCR
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "status": "completed",
    "progress": 100,
    "ocrResults": {
      "text": "Полный распознанный текст...",
      "textLength": 1500,
      "confidence": 0.95,
      "processedAt": "2025-01-27T10:05:00Z",
      "textPreview": "Пример распознанного текста..."
    },
    "error": null
  }
}
```

##### Задача с ошибкой
```json
{
  "success": true,
  "data": {
    "jobId": "job-123",
    "status": "failed",
    "progress": 0,
    "ocrResults": null,
    "error": {
      "message": "OCR processing failed: file corrupted",
      "code": "PROCESSING_ERROR",
      "retryable": true,
      "occurredAt": "2025-01-27T10:03:00Z"
    }
  }
}
```

#### Коды ошибок

##### 400 - Bad Request
```json
{
  "success": false,
  "error": "Either documentId or jobId is required",
  "code": "MISSING_PARAMETERS"
}
```

##### 403 - Forbidden
```json
{
  "success": false,
  "error": "Access denied to this job",
  "code": "ACCESS_DENIED"
}
```

##### 404 - Not Found
```json
{
  "success": false,
  "error": "Job not found in queue",
  "code": "JOB_NOT_FOUND"
}
```

```json
{
  "success": false,
  "error": "Document not found",
  "code": "DOCUMENT_NOT_FOUND"
}
```

##### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Failed to get job status",
  "code": "JOB_STATUS_ERROR",
  "details": "Connection timeout"
}
```

##### 503 - Service Unavailable
```json
{
  "success": false,
  "error": "Queue service temporarily unavailable",
  "code": "QUEUE_UNAVAILABLE",
  "retryAfter": 30
}
```

## Статусы задач

### Маппинг статусов очереди → API
- `waiting` → `queued`
- `active` → `processing`
- `completed` → `completed`
- `failed` → `failed`

### Маппинг статусов БД → API
- `QUEUED` → `queued`
- `PROCESSING` → `processing`
- `PROCESSED` → `completed`
- `FAILED` → `failed`

## Логика работы

1. **Приоритет jobId**: Если указан `jobId`, проверяется статус в очереди
2. **Fallback documentId**: Если указан только `documentId`, ищется документ в БД
3. **Синхронизация**: Статус из очереди имеет приоритет над статусом в БД
4. **Права доступа**: Проверяется, что пользователь имеет доступ к задаче/документу
5. **Обработка ошибок**: Детальная обработка различных типов ошибок

## Дополнительные возможности

- **Информация о прогрессе**: Процент выполнения задачи (0-100)
- **Приоритет задач**: normal/high (surge-pricing)
- **Метаданные**: Дополнительная информация о задаче
- **Информация о документе**: Детали файла из БД
- **Результаты OCR**: Полные результаты для завершенных задач
- **Детальные ошибки**: Коды ошибок и возможность повтора

## Использование

```javascript
// Проверка статуса задачи
const response = await fetch('/api/ocr?jobId=job-123');
const result = await response.json();

if (result.success) {
  console.log('Статус:', result.data.status);
  console.log('Прогресс:', result.data.progress + '%');
  
  if (result.data.ocrResults) {
    console.log('OCR завершен:', result.data.ocrResults.textLength, 'символов');
  }
  
  if (result.data.error) {
    console.log('Ошибка:', result.data.error.message);
  }
}
```

## Тестирование

Запустите тесты для проверки функциональности:

```bash
# Симуляция различных сценариев
node scripts/test-ocr-get-status.js

# Проверка логики API
node scripts/test-ocr-status-real.js
```