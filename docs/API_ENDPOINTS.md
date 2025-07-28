# API Endpoints для системы очередей

## 📋 Обзор

ESG-Lite использует PostgreSQL-based систему очередей для асинхронной обработки OCR задач. Все API endpoints работают с JSON и требуют аутентификации через Clerk.

## 🔐 Аутентификация

Все API endpoints требуют валидный Clerk токен в заголовке:
```
Authorization: Bearer <clerk_token>
```

## 📊 OCR Processing API

### POST /api/ocr
Добавляет новую задачу OCR в очередь.

**Request Body:**
```json
{
  "documentId": "doc_123",
  "fileUrl": "https://storage.yandexcloud.net/bucket/file.pdf",
  "priority": "normal" | "high",
  "organizationId": "org_456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "jobId": "job_789",
  "status": "queued",
  "estimatedProcessingTime": "2-5 minutes",
  "position": 3
}
```

**Response (Rate Limited - 429):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "currentUsage": {
    "requests": 10,
    "limit": 10,
    "windowStart": "2025-07-27T10:00:00Z"
  }
}
```

### GET /api/ocr?jobId={jobId}
Получает статус задачи OCR.

**Response (Processing - 200):**
```json
{
  "jobId": "job_789",
  "status": "processing",
  "progress": 45,
  "startedAt": "2025-07-27T10:05:00Z",
  "estimatedCompletion": "2025-07-27T10:08:00Z"
}
```

**Response (Completed - 200):**
```json
{
  "jobId": "job_789",
  "status": "completed",
  "progress": 100,
  "result": {
    "extractedText": "Текст из документа...",
    "confidence": 0.92,
    "pageCount": 5,
    "processingTime": 180
  },
  "completedAt": "2025-07-27T10:08:00Z"
}
```

**Response (Failed - 200):**
```json
{
  "jobId": "job_789",
  "status": "failed",
  "error": {
    "code": "OCR_PROCESSING_FAILED",
    "message": "Не удалось распознать текст в документе",
    "details": "Low image quality or unsupported format"
  },
  "failedAt": "2025-07-27T10:07:00Z"
}
```

## 🏥 Health Monitoring API

### GET /api/queue/health
Проверяет состояние системы очередей и базы данных.

**Response:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-07-27T10:15:00Z",
  "components": {
    "database": {
      "status": "healthy",
      "responseTime": 12,
      "connections": {
        "active": 5,
        "idle": 10,
        "max": 20
      }
    },
    "queue": {
      "status": "healthy",
      "jobs": {
        "waiting": 3,
        "processing": 2,
        "completed": 150,
        "failed": 2
      },
      "workers": {
        "active": 2,
        "available": 5
      }
    },
    "storage": {
      "status": "healthy",
      "freeSpace": "85%"
    }
  },
  "uptime": 86400
}
```

## 📈 Metrics API

### GET /api/queue/metrics
Получает метрики производительности системы очередей.

**Query Parameters:**
- `period` - временной период (`hour`, `day`, `week`, `month`)
- `from` - начальная дата (ISO 8601)
- `to` - конечная дата (ISO 8601)

**Example:**
```
GET /api/queue/metrics?period=day&from=2025-07-26T00:00:00Z&to=2025-07-27T00:00:00Z
```

**Response:**
```json
{
  "period": {
    "from": "2025-07-26T00:00:00Z",
    "to": "2025-07-27T00:00:00Z"
  },
  "performance": {
    "totalJobs": 1250,
    "completedJobs": 1200,
    "failedJobs": 25,
    "averageProcessingTime": 165,
    "throughput": {
      "jobsPerHour": 52,
      "peakHour": "2025-07-26T14:00:00Z",
      "peakThroughput": 85
    }
  },
  "errors": {
    "errorRate": 0.02,
    "topErrors": [
      {
        "code": "OCR_PROCESSING_FAILED",
        "count": 15,
        "percentage": 60
      },
      {
        "code": "TIMEOUT_ERROR",
        "count": 8,
        "percentage": 32
      }
    ]
  },
  "resources": {
    "cpu": {
      "average": 45,
      "peak": 78
    },
    "memory": {
      "average": 512,
      "peak": 768,
      "unit": "MB"
    },
    "database": {
      "connectionsUsed": 15,
      "queryTime": 25
    }
  }
}
```

## 🔄 Queue Management API

### GET /api/queue/status
Получает общий статус очередей и активных задач.

**Response:**
```json
{
  "queues": {
    "ocr": {
      "waiting": 5,
      "processing": 3,
      "completed": 1200,
      "failed": 25
    }
  },
  "workers": {
    "total": 5,
    "active": 3,
    "idle": 2
  },
  "performance": {
    "averageWaitTime": 45,
    "averageProcessingTime": 165,
    "successRate": 0.98
  }
}
```

### POST /api/queue/retry
Повторно запускает неудавшуюся задачу.

**Request Body:**
```json
{
  "jobId": "job_789",
  "reason": "manual_retry"
}
```

**Response:**
```json
{
  "success": true,
  "newJobId": "job_790",
  "status": "queued"
}
```

## 🚨 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `QUEUE_FULL` | Очередь переполнена | 503 |
| `RATE_LIMIT_EXCEEDED` | Превышен лимит запросов | 429 |
| `INVALID_DOCUMENT` | Некорректный формат документа | 400 |
| `OCR_PROCESSING_FAILED` | Ошибка обработки OCR | 422 |
| `TIMEOUT_ERROR` | Превышено время ожидания | 408 |
| `INSUFFICIENT_CREDITS` | Недостаточно кредитов | 402 |
| `STORAGE_ERROR` | Ошибка доступа к хранилищу | 503 |

## 📝 Rate Limiting

- **Лимит**: 10 запросов на OCR за 90 секунд на организацию
- **Заголовки ответа**:
  ```
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 7
  X-RateLimit-Reset: 1690459200
  ```

## 🔍 Monitoring Integration

Все API endpoints интегрированы с:
- **Yandex Cloud Monitoring** - метрики производительности
- **Structured Logging** - детальные логи для отладки
- **Health Checks** - автоматическая проверка состояния системы

Подробнее: [MONITORING_SETUP.md](MONITORING_SETUP.md)
