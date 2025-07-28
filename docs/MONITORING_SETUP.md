# Настройка современного мониторинга ESG-Lite (2025)

## 🎯 Обзор

ESG-Lite использует современный стек мониторинга 2025 года, который включает:
- **Yandex Cloud Monitoring** - для системных метрик и алертов
- **Structured Logging** - для детального анализа и отладки
- **Health Checks** - для проверки состояния компонентов

Этот подход заменяет устаревшие решения (UptimeRobot, LogRocket) и обеспечивает:
- ✅ Экономию $888-4140/год
- ✅ Локализацию данных в России
- ✅ Vendor lock-in отсутствует
- ✅ OpenTelemetry совместимость

## 🚀 Быстрый старт

### 1. Настройка Yandex Cloud

**Создание сервисного аккаунта:**
```bash
# Через Yandex CLI
yc iam service-account create --name esg-lite-monitoring

# Назначить роли
yc resource-manager folder add-access-binding $YC_FOLDER_ID \
  --role monitoring.editor \
  --subject serviceAccount:$SERVICE_ACCOUNT_ID

# Создать JSON ключ
yc iam key create --service-account-id $SERVICE_ACCOUNT_ID \
  --output authorized_key.json
```

**Через веб-интерфейс:**
1. Перейдите в [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Выберите папку → IAM и доступы → Сервисные аккаунты
3. Создайте аккаунт `esg-lite-monitoring`
4. Назначьте роль `monitoring.editor`
5. Создайте и скачайте JSON ключ как `authorized_key.json`

### 2. Настройка переменных окружения

```bash
# В .env файле добавьте:
YANDEX_CLOUD_FOLDER_ID=b1gacp8dl45ek81c5rv0
YANDEX_CLOUD_SA_KEY_FILE=./authorized_key.json
YANDEX_MONITORING_ENDPOINT=https://monitoring.api.cloud.yandex.net/monitoring/v2/data/write
YANDEX_MONITORING_ENABLED=true
YANDEX_MONITORING_INTERVAL=300000     # 5 минут
YANDEX_MONITORING_PG_INTERVAL=600000  # 10 минут для PostgreSQL

# Structured Logging
LOG_TO_FILE=true
LOG_DIRECTORY=./logs
LOG_MAX_FILE_SIZE=10485760  # 10MB
LOG_MAX_FILES=5
```

### 3. Проверка настройки

```bash
# Запустить приложение
npm run dev

# Проверить health check
curl http://localhost:3000/api/queue/health

# Проверить метрики
curl http://localhost:3000/api/queue/metrics

# Проверить создание логов
ls -la ./logs/
```

## 📊 Yandex Cloud Monitoring

### Основные метрики

Система автоматически отправляет следующие метрики:

**Метрики очередей:**
```javascript
// Отправляемые метрики:
{
  "queue.jobs.waiting": 5,          // Задачи в ожидании
  "queue.jobs.processing": 2,       // Обрабатываемые задачи
  "queue.jobs.completed": 1200,     // Завершенные задачи
  "queue.jobs.failed": 25,          // Неудачные задачи
  "queue.processing_time_avg": 165, // Среднее время обработки (сек)
  "queue.throughput": 52,           // Задач в час
  "queue.error_rate": 0.02          // Процент ошибок
}
```

**Метрики PostgreSQL:**
```javascript
{
  "postgres.connections.active": 5,   // Активные соединения
  "postgres.connections.idle": 10,    // Простаивающие соединения
  "postgres.query_time_avg": 25,      // Среднее время запроса (мс)
  "postgres.table_size.pgboss_job": 1024000  // Размер таблицы очередей
}
```

### Создание дашборда

1. Перейдите в [Yandex Monitoring](https://console.cloud.yandex.ru/folders/{folder-id}/monitoring)
2. Создайте новый дашборд "ESG-Lite Monitoring"
3. Добавьте виджеты:

**График производительности очередей:**
```yaml
title: "Queue Performance"
queries:
  - targets:
    - expr: "queue.throughput"
      legendFormat: "Jobs/hour"
    - expr: "queue.processing_time_avg"
      legendFormat: "Avg Processing Time (sec)"
```

**График ошибок:**
```yaml
title: "Error Monitoring"
queries:
  - targets:
    - expr: "queue.error_rate * 100"
      legendFormat: "Error Rate %"
    - expr: "queue.jobs.failed"
      legendFormat: "Failed Jobs"
```

### Настройка алертов

**Алерт на высокий уровень ошибок:**
```yaml
name: "ESG-Lite High Error Rate"
condition:
  query: "queue.error_rate"
  threshold: 0.1  # 10%
  comparison: ">"
  for: "5m"
notification:
  channels:
    - telegram
    - email
message: "🚨 Высокий уровень ошибок в очередях ESG-Lite: {{ $value }}%"
```

**Алерт на переполнение очереди:**
```yaml
name: "ESG-Lite Queue Overflow"
condition:
  query: "queue.jobs.waiting"
  threshold: 50
  comparison: ">"
  for: "3m"
notification:
  channels:
    - telegram
message: "⚠️ Очередь ESG-Lite переполнена: {{ $value }} задач в ожидании"
```

## 📝 Structured Logging

### Конфигурация логирования

Система создает специализированные логгеры для разных компонентов:

```javascript
// Автоматически создаются файлы:
./logs/app-2025-07-27.log          // Общие логи приложения
./logs/queue-2025-07-27.log        // Логи системы очередей
./logs/worker-2025-07-27.log       // Логи worker процессов
./logs/health-2025-07-27.log       // Логи health monitor
./logs/error-2025-07-27.log        // Все ошибки системы
```

### Структура логов

Все логи имеют JSON формат для машинного анализа:

```json
{
  "timestamp": "2025-07-27T10:15:30.123Z",
  "level": "info",
  "component": "queue",
  "message": "Job added to queue",
  "context": {
    "jobId": "job_789",
    "organizationId": "org_456",
    "priority": "normal",
    "estimatedTime": "2-5 minutes"
  },
  "metadata": {
    "correlationId": "req_abc123",
    "userId": "user_def456",
    "requestId": "req_789"
  }
}
```

### Анализ логов

**Поиск ошибок:**
```bash
# Найти все ошибки за последний час
grep '"level":"error"' ./logs/error-$(date +%Y-%m-%d).log | \
  jq -r '"\(.timestamp) \(.component) \(.message)"'

# Анализ производительности
grep '"message":"Job completed"' ./logs/queue-*.log | \
  jq -r '.context.processingTime' | \
  awk '{sum+=$1; count++} END {print "Avg processing time:", sum/count, "seconds"}'
```

**Корреляция событий:**
```bash
# Отследить жизненный цикл задачи
CORRELATION_ID="req_abc123"
grep "$CORRELATION_ID" ./logs/*.log | \
  jq -r '"\(.timestamp) \(.component) \(.message)"' | \
  sort
```

## 🔍 Health Checks

### Конфигурация health monitor

Health monitor автоматически проверяет:

```javascript
// lib/health-monitor.ts выполняет проверки:
{
  "database": {
    "responseTime": "< 100ms",
    "connections": "healthy",
    "tableSize": "monitored"
  },
  "queue": {
    "jobProcessing": "active",
    "errorRate": "< 5%",
    "waitTime": "< 5 minutes"
  },
  "storage": {
    "logDirectory": "accessible",
    "freeSpace": "> 1GB"
  },
  "external": {
    "yandexCloud": "connected",
    "objectStorage": "accessible"
  }
}
```

### Интеграция с внешними системами

**Webhook для алертов:**
```javascript
// scripts/health-webhook.js
const express = require('express');
const app = express();

app.post('/health-alert', (req, res) => {
  const { status, component, message } = req.body;
  
  if (status === 'unhealthy') {
    // Отправить в Telegram
    sendTelegramAlert(component, message);
    
    // Записать в логи
    console.error(`🚨 Health Alert: ${component} - ${message}`);
  }
  
  res.status(200).send('OK');
});

app.listen(3001, () => {
  console.log('Health webhook server running on port 3001');
});
```

## 🚀 Production Deployment

### Docker конфигурация

```dockerfile
# Dockerfile.monitoring
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
COPY authorized_key.json ./

# Создать директорию для логов
RUN mkdir -p ./logs && chown node:node ./logs

USER node

# Запустить с мониторингом
CMD ["npm", "start"]
```

### Environment Variables для production

```bash
# .env.production
NODE_ENV=production

# Yandex Cloud Monitoring
YANDEX_MONITORING_ENABLED=true
YANDEX_MONITORING_INTERVAL=300000
YANDEX_MONITORING_PG_INTERVAL=600000

# Structured Logging
LOG_TO_FILE=true
LOG_DIRECTORY=/var/log/esg-lite
LOG_MAX_FILE_SIZE=50485760  # 50MB для production
LOG_MAX_FILES=10

# Health Checks
HEALTH_CHECK_INTERVAL=30000
```

### Kubernetes Health Checks

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: esg-lite
spec:
  template:
    spec:
      containers:
      - name: esg-lite
        image: esg-lite:latest
        ports:
        - containerPort: 3000
        
        # Health checks
        livenessProbe:
          httpGet:
            path: /api/queue/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 5
          
        readinessProbe:
          httpGet:
            path: /api/queue/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          
        # Resource limits
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
            
        # Volumes для логов
        volumeMounts:
        - name: logs
          mountPath: /var/log/esg-lite
          
      volumes:
      - name: logs
        persistentVolumeClaim:
          claimName: esg-lite-logs
```

## 📈 Optimization Tips

### 1. Настройка интервалов мониторинга

```javascript
// Для разных окружений:
const intervals = {
  development: {
    monitoring: 60000,    // 1 минута
    postgres: 120000,     // 2 минуты
    health: 30000         // 30 секунд
  },
  production: {
    monitoring: 300000,   // 5 минут
    postgres: 600000,     // 10 минут  
    health: 60000         // 1 минута
  }
};
```

### 2. Оптимизация размера логов

```javascript
// lib/log-optimization.ts
export const logLevels = {
  development: 'debug',
  testing: 'info', 
  production: 'warn'
};

// Фильтрация чувствительных данных
export function sanitizeLogData(data: any) {
  const sensitive = ['password', 'token', 'key', 'secret'];
  // ... логика очистки
}
```

### 3. Кэширование метрик

```javascript
// lib/metrics-cache.ts
class MetricsCache {
  private cache = new Map();
  private ttl = 60000; // 1 минута
  
  async getCachedMetrics(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    return null;
  }
}
```

## 🔧 Troubleshooting

### Проблемы с Yandex Cloud

**Ошибка авторизации:**
```bash
# Проверить JSON ключ
cat authorized_key.json | jq .

# Проверить права сервисного аккаунта
yc resource-manager folder list-access-bindings $YC_FOLDER_ID | grep monitoring
```

**Метрики не отправляются:**
```bash
# Проверить connectivity
curl -v https://monitoring.api.cloud.yandex.net/monitoring/v2/data/write

# Проверить логи отправки
grep "metrics sent\|metric error" ./logs/app-*.log
```

### Проблемы с логированием

**Логи не создаются:**
```bash
# Проверить права на директорию
ls -la ./logs/
chmod 755 ./logs/

# Проверить настройки
echo $LOG_TO_FILE $LOG_DIRECTORY
```

**Переполнение диска:**
```bash
# Настроить logrotate
sudo tee /etc/logrotate.d/esg-lite << EOF
/var/log/esg-lite/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF
```

## 🆘 Emergency Contacts

- **Yandex Cloud Support**: https://cloud.yandex.ru/support
- **Техническая поддержка ESG-Lite**: admin@esg-lite.com
- **Документация**: [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**💡 Best Practices:**
1. Регулярно проверяйте дашборды метрик
2. Настройте алерты для критических показателей
3. Анализируйте логи для выявления паттернов
4. Используйте correlation ID для трассировки запросов
5. Мониторьте производительность PostgreSQL отдельно
