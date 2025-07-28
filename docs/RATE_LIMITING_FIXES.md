# Rate Limiting Integration - Исправления ошибок

## Исправленные TypeScript ошибки

### 1. DocumentStatus enum
**Проблема**: `Type '"QUEUED"' is not assignable to type 'DocumentStatus'`

**Решение**: Использовали существующий статус `PROCESSING` вместо добавления нового `QUEUED`. Логика:
- При добавлении в очередь: `status = 'PROCESSING'`
- При проверке статуса: если есть `jobId`, то `status = 'queued'`, иначе `processing`

### 2. Async/await для QueueManager
**Проблема**: `Property 'addOcrJob' does not exist on type 'Promise<QueueManager>'`

**Решение**: Добавили `await` перед `getQueueManager()`:
```typescript
// Было:
const queueManager = getQueueManager();

// Стало:
const queueManager = await getQueueManager();
```

### 3. Отсутствующие поля в Prisma схеме
**Проблема**: `Property 'processingProgress' does not exist`

**Решение**: Убрали использование несуществующих полей:
- `processingProgress` 
- `processingStage`
- `processingMessage`

Вместо этого используем:
- Статус из `document.status`
- Прогресс из статуса очереди (`jobStatus`)
- Сообщения генерируем динамически

### 4. Неиспользуемые импорты
**Проблема**: `'creditsService' is declared but its value is never read`

**Решение**: Убрали неиспользуемый импорт из `middleware.ts`

## Текущая архитектура

### API POST /api/ocr
1. Проверка авторизации
2. Проверка кредитов (через `creditsService`)
3. Поиск документа в БД
4. Обновление статуса на `PROCESSING`
5. Добавление задачи в очередь
6. Возврат `jobId` клиенту

### API GET /api/ocr
1. Проверка авторизации
2. Поиск документа в БД
3. Получение статуса задачи из очереди (если есть `jobId`)
4. Определение финального статуса:
   - `not_started` - документ не обрабатывался
   - `queued` - есть `jobId` и статус `PROCESSING`
   - `processing` - активная обработка в очереди
   - `completed` - статус `PROCESSED`
   - `failed` - статус `FAILED`

### Middleware Rate Limiting
1. Проверка маршрута (`/api/ocr`, `/api/upload`)
2. Получение `organizationId` (или `userId` как fallback)
3. Проверка лимита через `RateLimiter`
4. Возврат HTTP 429 при превышении
5. Увеличение счетчика при успехе
6. Добавление заголовков `X-RateLimit-*`

## Статусы документов

| Prisma Status | API Status | Описание |
|---------------|------------|----------|
| `UPLOADED` | `not_started` | Документ загружен, OCR не запущен |
| `PROCESSING` | `queued` | Задача добавлена в очередь (есть jobId) |
| `PROCESSING` | `processing` | Активная обработка (нет jobId) |
| `PROCESSED` | `completed` | Обработка завершена успешно |
| `FAILED` | `failed` | Ошибка обработки |

## HTTP коды ответов

| Код | Причина | Описание |
|-----|---------|----------|
| 200 | OK | Запрос успешен |
| 401 | Unauthorized | Не авторизован |
| 402 | Payment Required | Недостаточно кредитов |
| 404 | Not Found | Документ не найден |
| 429 | Too Many Requests | Превышен rate limit |
| 500 | Internal Server Error | Ошибка сервера |

## Заголовки Rate Limiting

| Заголовок | Описание |
|-----------|----------|
| `X-RateLimit-Limit` | Максимальное количество запросов |
| `X-RateLimit-Remaining` | Оставшиеся запросы |
| `X-RateLimit-Reset` | Unix timestamp сброса счетчика |
| `Retry-After` | Секунды до следующей попытки (при 429) |