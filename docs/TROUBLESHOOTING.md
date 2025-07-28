# Troubleshooting Guide - ESG-Lite Queue System

## 🎯 Обзор

Это руководство поможет диагностировать и устранить проблемы с системой очередей ESG-Lite, которая использует PostgreSQL для хранения задач и современный стек мониторинга 2025 года.

## 🔧 Быстрая диагностика

### 1. Проверка общего состояния системы
```bash
# Проверить health check
curl http://localhost:3000/api/queue/health

# Проверить метрики
curl http://localhost:3000/api/queue/metrics?period=hour

# Проверить статус очередей
curl http://localhost:3000/api/queue/status
```

### 2. Проверка логов
```bash
# Посмотреть последние логи очередей
tail -f ./logs/queue-$(date +%Y-%m-%d).log

# Посмотреть логи worker'ов
tail -f ./logs/worker-$(date +%Y-%m-%d).log

# Поиск ошибок в логах
grep -i "error\|failed" ./logs/*.log | tail -20
```

### 3. Проверка базы данных
```bash
# Подключиться к PostgreSQL
psql $DATABASE_URL

# Проверить активные задачи
SELECT name, state, createdon, completedon FROM pgboss.job WHERE state != 'completed' ORDER BY createdon DESC LIMIT 10;

# Проверить статистику очередей
SELECT name, COUNT(*) as count, state FROM pgboss.job GROUP BY name, state ORDER BY name, state;
```

## 🚨 Распространенные проблемы

### Проблема 1: Задачи застревают в очереди

**Симптомы:**
- Задачи остаются в статусе "queued" долгое время
- API `/api/queue/health` показывает много задач в ожидании
- Нет активных worker'ов

**Диагностика:**
```bash
# Проверить количество worker'ов
curl http://localhost:3000/api/queue/status | jq '.workers'

# Проверить логи worker'ов
grep "Worker started\|Worker stopped" ./logs/worker-*.log

# Проверить процессы Node.js
ps aux | grep node
```

**Решение:**
```bash
# Запустить OCR worker вручную
npm run worker:ocr

# Или через screen для фонового режима
screen -S ocr-worker npm run worker:ocr

# Проверить переменные окружения
echo $BULLMQ_CONCURRENCY
```

**Код для restart worker'а:**
```javascript
// scripts/restart-workers.js
const { spawn } = require('child_process');

console.log('🔄 Перезапуск OCR worker...');
const worker = spawn('npm', ['run', 'worker:ocr'], {
  stdio: 'inherit',
  env: process.env
});

worker.on('error', (error) => {
  console.error('❌ Ошибка запуска worker:', error);
});
```

### Проблема 2: Ошибки OCR обработки

**Симптомы:**
- Высокий процент неудачных задач
- Ошибки "OCR_PROCESSING_FAILED" в логах
- Низкая confidence в результатах

**Диагностика:**
```bash
# Проверить ошибки OCR
grep "OCR_PROCESSING_FAILED\|confidence" ./logs/worker-*.log | tail -10

# Проверить размеры файлов
ls -la ./uploads/ | head -20

# Проверить Tesseract
node -e "console.log(require('tesseract.js'))"
```

**Решение:**
```bash
# Проверить качество изображений
# Добавить в worker логику предобработки:
```

```javascript
// В worker/ocr-worker.ts добавить:
import sharp from 'sharp';

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(2000, null, { withoutEnlargement: true })
    .normalize()
    .sharpen()
    .toBuffer();
}
```

### Проблема 3: Проблемы с подключением к PostgreSQL

**Симптомы:**
- Ошибки "connection refused" в логах
- Health check показывает database: "unhealthy"
- Приложение не может добавить задачи в очередь

**Диагностика:**
```bash
# Проверить подключение к БД
psql $DATABASE_URL -c "SELECT version();"

# Проверить количество соединений
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Проверить таблицы pg-boss
psql $DATABASE_URL -c "\\dt pgboss.*"
```

**Решение:**
```bash
# Проверить максимальное количество соединений
psql $DATABASE_URL -c "SHOW max_connections;"

# Оптимизировать connection pool
# В prisma/schema.prisma:
```

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Добавить параметры подключения:
  // ?connection_limit=20&pool_timeout=20&socket_timeout=20
}
```

### Проблема 4: Переполнение диска логами

**Симптомы:**
- Ошибка "No space left on device"
- Большие файлы логов в ./logs/
- Система работает медленно

**Диагностика:**
```bash
# Проверить размер логов
du -sh ./logs/
ls -lah ./logs/ | head -10

# Проверить свободное место
df -h .
```

**Решение:**
```bash
# Очистить старые логи
find ./logs/ -name "*.log" -mtime +7 -delete

# Настроить автоочистку (добавить в crontab):
# 0 2 * * * cd /path/to/project && find ./logs/ -name "*.log" -mtime +7 -delete

# Или использовать logrotate
sudo tee /etc/logrotate.d/esg-lite << EOF
/path/to/project/logs/*.log {
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

## 🔍 Monitoring и Metrics

### Настройка алертов Yandex Cloud

**1. Создать алерт на количество неудачных задач:**
```yaml
# yandex-monitoring-alert.yaml
name: "ESG-Lite High Error Rate"
condition:
  query: "queue.failed_jobs_rate"
  threshold: 0.1  # 10% ошибок
  comparison: ">"
notification:
  webhook: "https://your-alerts-endpoint.com/webhook"
```

**2. Алерт на время ожидания в очереди:**
```bash
# В Yandex Cloud Console создать алерт:
# Метрика: queue.avg_wait_time
# Условие: > 300 (5 минут)
# Действие: отправить уведомление
```

### Кастомные метрики для отладки

```javascript
// lib/debug-metrics.ts
import { metricsCollector } from './metrics';

export class DebugMetrics {
  static trackSlowQuery(duration: number, query: string) {
    if (duration > 1000) {
      console.warn(`🐌 Медленный запрос (${duration}ms): ${query}`);
      metricsCollector.recordCustomMetric('slow_query_count', 1, {
        query_type: query.split(' ')[0].toLowerCase()
      });
    }
  }
  
  static trackMemoryUsage() {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn(`🧠 Высокое использование памяти: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    }
  }
}
```

## 📊 Performance Optimization

### 1. Оптимизация PostgreSQL для очередей

```sql
-- Создать индексы для производительности
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pgboss_job_name_state 
ON pgboss.job (name, state) WHERE state != 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pgboss_job_createdon 
ON pgboss.job (createdon) WHERE state = 'created';

-- Настроить автовакуум
ALTER TABLE pgboss.job SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE pgboss.job SET (autovacuum_analyze_scale_factor = 0.05);
```

### 2. Мониторинг производительности очередей

```javascript
// scripts/performance-monitor.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function monitorPerformance() {
  const stats = await prisma.$queryRaw`
    SELECT 
      name,
      state,
      COUNT(*) as count,
      AVG(EXTRACT(EPOCH FROM (completedon - startedon))) as avg_processing_time
    FROM pgboss.job 
    WHERE createdon > NOW() - INTERVAL '1 hour'
    GROUP BY name, state
    ORDER BY name, state
  `;
  
  console.table(stats);
  
  // Проверить медленные задачи
  const slowJobs = await prisma.$queryRaw`
    SELECT id, name, createdon, startedon, completedon,
           EXTRACT(EPOCH FROM (completedon - startedon)) as processing_time
    FROM pgboss.job 
    WHERE completedon IS NOT NULL 
      AND EXTRACT(EPOCH FROM (completedon - startedon)) > 300
    ORDER BY processing_time DESC 
    LIMIT 10
  `;
  
  if (slowJobs.length > 0) {
    console.log('\n🐌 Медленные задачи (>5 минут):');
    console.table(slowJobs);
  }
}

// Запускать каждые 5 минут
setInterval(monitorPerformance, 5 * 60 * 1000);
```

## 🆘 Emergency Procedures

### При критических проблемах:

**1. Остановить все worker'ы:**
```bash
pkill -f "worker:ocr"
screen -wipe
```

**2. Очистить застрявшие задачи:**
```sql
-- Сбросить застрявшие задачи
UPDATE pgboss.job 
SET state = 'created', startedon = null 
WHERE state = 'active' AND startedon < NOW() - INTERVAL '1 hour';
```

**3. Экстренный restart всей системы:**
```bash
# Backup текущих логов
cp -r ./logs ./logs-backup-$(date +%Y%m%d-%H%M%S)

# Restart приложения
pm2 restart all
# или
systemctl restart esg-lite
```

## 📞 Получение помощи

### Сбор информации для поддержки:

```bash
# Создать диагностический отчет
./scripts/create-diagnostic-report.sh
```

**Создайте scripts/create-diagnostic-report.sh:**
```bash
#!/bin/bash
echo "🔍 Создание диагностического отчета..."

REPORT_DIR="./diagnostic-report-$(date +%Y%m%d-%H%M%S)"
mkdir -p $REPORT_DIR

# Системная информация
echo "=== SYSTEM INFO ===" > $REPORT_DIR/system.txt
node --version >> $REPORT_DIR/system.txt
npm --version >> $REPORT_DIR/system.txt
psql --version >> $REPORT_DIR/system.txt

# Состояние очередей
curl -s http://localhost:3000/api/queue/health > $REPORT_DIR/health.json
curl -s http://localhost:3000/api/queue/status > $REPORT_DIR/status.json

# Логи (последние 100 строк)
tail -100 ./logs/*.log > $REPORT_DIR/recent-logs.txt

# Конфигурация (без секретов)
env | grep -E "(QUEUE|BULLMQ|DATABASE|LOG)" | sed 's/=.*/=***/' > $REPORT_DIR/config.txt

echo "✅ Отчет создан в: $REPORT_DIR"
```

### Контакты для экстренных случаев:
- **Техническая поддержка**: admin@esg-lite.com
- **Telegram**: @esg_lite_support
- **GitHub Issues**: https://github.com/Kirill552/ESG-Lite/issues

---

**💡 Совет**: Регулярно проверяйте метрики и логи, чтобы выявлять проблемы до того, как они станут критическими.
