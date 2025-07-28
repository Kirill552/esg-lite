# Health Check API Documentation

## Задача 7.2: API endpoint для health checks

### Описание
API endpoint для мониторинга здоровья системы очередей BullMQ + PostgreSQL.

### Требования выполнены
- ✅ **3.1**: Endpoint `/api/queue/health` возвращающий статус и количество задач
- ✅ **3.2**: Показ количества ожидающих, обрабатываемых и завершенных задач

## API Endpoints

### GET /api/queue/health

#### Полная проверка здоровья системы (по умолчанию)

```bash
GET /api/queue/health
```

**Ответ (200/500/503):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T12:00:00Z",
  "responseTime": "45ms",
  "type": "full",
  "components": {
    "queueStorage": {
      "status": "healthy",
      "message": "PostgreSQL хранилище очередей работает нормально",
      "connectionTime": 45,
      "version": "PostgreSQL 14.9",
      "memoryUsage": 25.5
    },
    "queue": {
      "status": "healthy",
      "message": "Очередь задач работает нормально",
      "stats": {
        "waiting": 5,
        "active": 2,
        "completed": 150,
        "failed": 3,
        "total": 160
      },
      "activeJobs": [...],
      "failedJobs": [...]
    },
    "database": {
      "status": "healthy",
      "message": "База данных работает нормально"
    }
  },
  "summary": {
    "totalIssues": 0,
    "criticalIssues": 0,
    "warnings": 0
  },
  "queueSummary": {
    "totalJobs": 160,
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "successRate": "93.8%"
  },
  "performance": {
    "responseTime": "45ms",
    "queueStorageResponseTime": "45ms",
    "databaseResponseTime": "32ms"
  },
  "recommendations": [
    "Система работает нормально, продолжайте мониторинг"
  ]
}
```

#### Проверка конкретного компонента

```bash
GET /api/queue/health?component=queue
GET /api/queue/health?component=queue-storage
GET /api/queue/health?component=database
```

**Ответ (200/500/503):**
```json
{
  "component": "queue",
  "status": "healthy",
  "message": "Очередь задач работает нормально",
  "timestamp": "2025-01-27T12:00:00Z",
  "responseTime": "25ms",
  "type": "component",
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "total": 160
  }
}
```

#### Быстрая проверка доступности

```bash
GET /api/queue/health?quick=true
```

**Ответ (200/503):**
```json
{
  "status": "healthy",
  "message": "Система доступна",
  "timestamp": "2025-01-27T12:00:00Z",
  "responseTime": "15ms",
  "type": "quick"
}
```

### HEAD /api/queue/health

Быстрая проверка только статуса (без тела ответа).

```bash
HEAD /api/queue/health
```

**Заголовки ответа:**
```
HTTP/1.1 200 OK
X-Health-Status: healthy
Cache-Control: no-cache, no-store, must-revalidate
```

## HTTP статусы

| Статус | Код | Описание |
|--------|-----|----------|
| `healthy` | 200 | Все компоненты работают нормально |
| `warning` | 200 | Есть предупреждения, но система работает |
| `critical` | 500 | Критические проблемы, требующие внимания |
| `unhealthy` | 503 | Один или более компонентов недоступны |

## Компоненты системы

### queue-storage (PostgreSQL)
- **Проверяет**: Подключение к PostgreSQL, время отклика, использование подключений
- **Статусы**: 
  - `healthy` - Нормальная работа
  - `warning` - Медленное подключение (>1s)
  - `critical` - Высокое использование подключений (>80%)
  - `unhealthy` - PostgreSQL недоступен

### queue (Очередь задач)
- **Проверяет**: Статистику задач, нагрузку, процент ошибок
- **Статусы**:
  - `healthy` - Нормальная нагрузка
  - `warning` - Высокая нагрузка (>100 задач) или застрявшие задачи
  - `critical` - Критическая нагрузка (>500 задач) или высокий процент ошибок (>10%)
  - `unhealthy` - Очередь недоступна

### database (Основная БД)
- **Проверяет**: Подключение к основной базе данных, время отклика
- **Статусы**:
  - `healthy` - Нормальная работа
  - `warning` - Медленный отклик (>500ms)
  - `critical` - Критически медленный отклик (>2s)
  - `unhealthy` - БД недоступна

## Заголовки ответа

| Заголовок | Описание |
|-----------|----------|
| `X-Health-Status` | Общий статус здоровья системы |
| `X-Response-Time` | Время выполнения проверки |
| `Cache-Control` | Запрет кэширования для актуальных данных |

## Рекомендации по устранению проблем

API автоматически генерирует рекомендации на основе обнаруженных проблем:

### PostgreSQL проблемы
- `unhealthy`: "Проверьте подключение к PostgreSQL"
- `critical`: "Увеличьте лимит подключений PostgreSQL"
- `warning`: "Мониторьте производительность PostgreSQL"

### Проблемы очереди
- `unhealthy`: "Проверьте работу системы очередей"
- `critical`: "Увеличьте количество worker процессов"
- `warning`: "Мониторьте нагрузку на очередь"

### Проблемы БД
- `unhealthy`: "Проверьте подключение к основной базе данных"
- `critical`: "Оптимизируйте запросы к базе данных"

## Использование для мониторинга

### Prometheus/Grafana
```bash
# Метрики для Prometheus
curl -s http://localhost:3000/api/queue/health | jq '.queueSummary'
```

### Простой мониторинг
```bash
# Проверка доступности
curl -I http://localhost:3000/api/queue/health

# Быстрая проверка
curl http://localhost:3000/api/queue/health?quick=true
```

### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /api/queue/health?quick=true
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/queue/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Load Balancer Health Checks
```bash
# Для HAProxy/Nginx
GET /api/queue/health?quick=true
```

## Примеры ответов

### Система здорова
```json
{
  "status": "healthy",
  "queueSummary": {
    "totalJobs": 160,
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "successRate": "93.8%"
  },
  "summary": {
    "totalIssues": 0,
    "criticalIssues": 0,
    "warnings": 0
  }
}
```

### Система с предупреждениями
```json
{
  "status": "warning",
  "queueSummary": {
    "totalJobs": 645,
    "waiting": 100,
    "active": 20,
    "completed": 500,
    "failed": 25,
    "successRate": "77.5%"
  },
  "summary": {
    "totalIssues": 1,
    "criticalIssues": 0,
    "warnings": 1
  },
  "recommendations": [
    "Мониторьте нагрузку на очередь",
    "Запланируйте устранение предупреждений"
  ]
}
```

### Система недоступна
```json
{
  "status": "unhealthy",
  "summary": {
    "totalIssues": 2,
    "criticalIssues": 2,
    "warnings": 0
  },
  "recommendations": [
    "Проверьте подключение к PostgreSQL",
    "Убедитесь, что PostgreSQL сервер запущен и доступен",
    "Проверьте работу системы очередей",
    "Немедленно устраните критические проблемы"
  ]
}
```

## Тестирование

```bash
# Запуск тестов
node scripts/test-health-api.js

# Проверка реального API (если сервер запущен)
curl http://localhost:3000/api/queue/health
curl http://localhost:3000/api/queue/health?component=queue
curl http://localhost:3000/api/queue/health?quick=true
```