# Настройка системы очередей BullMQ

## Обзор

Система очередей используется для асинхронной обработки OCR задач и генерации PDF отчетов. Поддерживает два варианта хранилища:

- **PostgreSQL** (рекомендуется для начала) - использует существующую БД, 0 ₽ дополнительных расходов
- **Redis** - более производительный вариант для высоких нагрузок, ≈ 280 ₽/мес за VM

## Вариант А: PostgreSQL очереди (по умолчанию)

### Преимущества
- ✅ Нулевые дополнительные расходы
- ✅ Использует существующую БД SberCloud
- ✅ Автоматические бэкапы вместе с основными данными
- ✅ Простая настройка

### Настройка

1. **Переменные окружения** (уже настроено):
```bash
QUEUE_STORAGE_TYPE=postgres
QUEUE_DATABASE_URL=${DATABASE_URL}
QUEUE_TABLE_PREFIX=bullmq_
```

2. **Создание таблиц** (выполняется автоматически при первом запуске):
```sql
-- Таблицы создаются автоматически BullMQ
-- bullmq_jobs - основная таблица задач
-- bullmq_job_logs - логи выполнения
```

3. **Проверка работы**:
```bash
npm run dev
curl http://localhost:3000/api/queue/health
```

## Вариант Б: Redis на VM (для высоких нагрузок)

### Когда использовать
- Более 1000 задач в день
- Требуется высокая производительность
- Готовы платить ≈ 280 ₽/мес

### Настройка Yandex Cloud VM

1. **Создание VM**:
```bash
# Создать VM d1-c1-m1 (1 vCPU/1 GB)
yc compute instance create \
  --name redis-queue \
  --zone ru-central1-a \
  --network-interface subnet-name=default,nat-ip-version=ipv4 \
  --create-boot-disk image-folder-id=standard-images,image-family=ubuntu-20-04-lts,size=10 \
  --memory 1GB \
  --cores 1 \
  --core-fraction 20
```

2. **Установка Redis через Docker**:
```bash
# Подключиться к VM
yc compute ssh --name redis-queue

# Установить Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker

# Создать docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass your_password_here
    
volumes:
  redis_data:
EOF

# Запустить Redis
sudo docker-compose up -d
```

3. **Переменные окружения**:
```bash
QUEUE_STORAGE_TYPE=redis
REDIS_URL=redis://:your_password_here@vm_ip_address:6379
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000
```

## Вариант В: SberCloud MIC (бета)

### Настройка
1. Зарегистрироваться в SberCloud MIC (бета)
2. Создать Redis instance
3. Получить connection string
4. Обновить переменные окружения:

```bash
QUEUE_STORAGE_TYPE=redis
REDIS_URL=redis://username:password@sbercloud_host:6379
```

## Конфигурация BullMQ

### Основные параметры
```bash
# Производительность
BULLMQ_CONCURRENCY=5          # Количество одновременных задач
BULLMQ_MAX_JOBS=1000          # Максимум задач в очереди
BULLMQ_JOB_TTL=3600000        # TTL задач (1 час)

# Rate limiting
RATE_LIMIT_WINDOW=90000       # Окно лимита (90 сек)
RATE_LIMIT_MAX_REQUESTS=10    # Максимум запросов в окне

# Мониторинг
HEALTH_CHECK_INTERVAL=30000   # Интервал health check (30 сек)
METRICS_RETENTION_DAYS=7      # Хранение метрик (7 дней)
```

### Настройка для разных нагрузок

**Низкая нагрузка** (< 100 задач/день):
```bash
BULLMQ_CONCURRENCY=2
BULLMQ_MAX_JOBS=100
QUEUE_STORAGE_TYPE=postgres
```

**Средняя нагрузка** (100-1000 задач/день):
```bash
BULLMQ_CONCURRENCY=5
BULLMQ_MAX_JOBS=500
QUEUE_STORAGE_TYPE=postgres
```

**Высокая нагрузка** (> 1000 задач/день):
```bash
BULLMQ_CONCURRENCY=10
BULLMQ_MAX_JOBS=2000
QUEUE_STORAGE_TYPE=redis
```

## Мониторинг

### Health Check
```bash
# Проверка состояния очередей
curl http://localhost:3000/api/queue/health

# Ответ:
{
  "status": "healthy",
  "storage": "postgres",
  "queues": {
    "ocr": {
      "waiting": 5,
      "active": 2,
      "completed": 150,
      "failed": 3
    }
  },
  "uptime": 3600
}
```

### Метрики
```bash
# Получение метрик производительности
curl http://localhost:3000/api/queue/metrics

# Ответ:
{
  "throughput": 45.2,
  "averageProcessingTime": 12.5,
  "errorRate": 0.02,
  "queueSizes": {
    "waiting": 5,
    "active": 2
  }
}
```

## Troubleshooting

### PostgreSQL очереди

**Проблема**: Медленная обработка задач
```bash
# Проверить индексы
SELECT * FROM pg_stat_user_indexes WHERE relname LIKE 'bullmq_%';

# Добавить недостающие индексы
CREATE INDEX IF NOT EXISTS idx_bullmq_jobs_status ON bullmq_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bullmq_jobs_created ON bullmq_jobs(created_at);
```

**Проблема**: Переполнение таблиц
```bash
# Очистка старых задач (выполнять регулярно)
DELETE FROM bullmq_jobs WHERE status = 'completed' AND created_at < NOW() - INTERVAL '7 days';
DELETE FROM bullmq_job_logs WHERE created_at < NOW() - INTERVAL '7 days';
```

### Redis очереди

**Проблема**: Превышение памяти
```bash
# Проверить использование памяти
redis-cli INFO memory

# Настроить автоочистку
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

**Проблема**: Потеря соединения
```bash
# Проверить статус Redis
sudo docker-compose ps
sudo docker-compose logs redis

# Перезапустить при необходимости
sudo docker-compose restart redis
```

## Миграция между хранилищами

### Из PostgreSQL в Redis
1. Остановить worker процессы
2. Дождаться завершения активных задач
3. Изменить `QUEUE_STORAGE_TYPE=redis`
4. Настроить `REDIS_URL`
5. Перезапустить приложение

### Из Redis в PostgreSQL
1. Остановить worker процессы
2. Дождаться завершения активных задач
3. Изменить `QUEUE_STORAGE_TYPE=postgres`
4. Убрать `REDIS_URL` из конфигурации
5. Перезапустить приложение

## Безопасность

### PostgreSQL
- ✅ Использует существующие настройки безопасности БД
- ✅ SSL соединение настроено
- ✅ Ограничения доступа по IP

### Redis
- 🔧 Настроить пароль: `requirepass your_strong_password`
- 🔧 Ограничить доступ по IP в Security Groups
- 🔧 Использовать SSL/TLS для production
- 🔧 Регулярно обновлять Redis до последней версии