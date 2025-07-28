# ESG-Lite MVP

ESG-платформа для создания отчетов по выбросам парниковых газов в соответствии с российским законодательством (296-ФЗ) и европейскими требованиями (CBAM).

## 🚀 Возможности

- **296-ФЗ отчеты**: Автоматическое создание отчетов по российскому законодательству
- **CBAM отчеты**: Квартальная отчетность для экспорта в ЕС
- **Углеродный след**: Расчет углеродного следа продукции и деятельности
- **Автозаполнение**: Интеграция с CHECKO API для автоматического заполнения данных компании
- **OCR обработка**: Распознавание текста из загруженных документов

## 🛠 Технологический стек

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **База данных**: PostgreSQL 16
- **Система очередей**: pg-boss (PostgreSQL-based)
- **Мониторинг 2025**: Yandex Cloud Monitoring + Structured Logging
- **Аутентификация**: Clerk
- **Файловое хранилище**: Yandex Object Storage (S3-compatible)
- **OCR**: Tesseract.js
- **PDF генерация**: Playwright

## 📋 Требования

- Node.js 18+
- PostgreSQL 14+
- Yandex Cloud аккаунт (для Object Storage)
- Clerk аккаунт (для аутентификации)

## 🔧 Установка и настройка

1. **Клонирование репозитория**
```bash
git clone https://github.com/Kirill552/ESG-Lite.git
cd ESG-Lite
```

2. **Установка зависимостей**
```bash
npm install
```

3. **Настройка переменных окружения**
```bash
cp .env.example .env
```

Заполните файл `.env` своими значениями:

### Обязательные переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - публичный ключ Clerk
- `CLERK_SECRET_KEY` - секретный ключ Clerk
- `YC_ACCESS_KEY_ID` - ключ доступа к Yandex Object Storage
- `YC_SECRET_ACCESS_KEY` - секретный ключ Yandex Object Storage
- `YC_BUCKET_NAME` - имя бакета для хранения файлов

### Мониторинг и логирование (2025):
- `YANDEX_CLOUD_FOLDER_ID` - ID папки в Yandex Cloud для метрик
- `YANDEX_CLOUD_SA_KEY_FILE` - путь к JSON ключу сервисного аккаунта
- `YANDEX_MONITORING_ENABLED` - включить отправку метрик в Yandex Cloud
- `LOG_TO_FILE` - включить structured logging в файлы
- `LOG_DIRECTORY` - папка для хранения логов (по умолчанию: ./logs)

### Система очередей:
- `QUEUE_STORAGE_TYPE` - тип хранилища очередей (только `postgres`)
- `QUEUE_DATABASE_URL` - URL подключения к PostgreSQL для очередей
- `BULLMQ_CONCURRENCY` - количество одновременных задач (по умолчанию: 5)
- `RATE_LIMIT_MAX_REQUESTS` - лимит запросов на OCR (по умолчанию: 10 за 90 сек)

### Опциональные переменные:
- `CHECKO_API_KEY` - для автозаполнения данных компаний
- `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY` - для приема платежей
- `OPENAI_API_KEY` - для улучшения OCR (если нужно)

4. **Настройка базы данных**
```bash
npx prisma generate
npx prisma db push
```

5. **Настройка системы очередей и мониторинга**

PostgreSQL используется для хранения очередей (экономичный и надежный вариант 2025):
```bash
# В .env файле уже настроено:
QUEUE_STORAGE_TYPE=postgres
QUEUE_DATABASE_URL=${DATABASE_URL}

# Мониторинг и логирование:
YANDEX_MONITORING_ENABLED=true
LOG_TO_FILE=true
LOG_DIRECTORY=./logs
```

**Настройка Yandex Cloud Monitoring:**
1. Создайте сервисный аккаунт в Yandex Cloud
2. Скачайте JSON ключ как `authorized_key.json` в корень проекта
3. Настройте `YANDEX_CLOUD_FOLDER_ID` в .env

Подробная инструкция: [docs/MONITORING_SETUP.md](docs/MONITORING_SETUP.md)

6. **Запуск в режиме разработки**
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

7. **Проверка системы очередей и мониторинга**
```bash
# Проверить статус очередей
curl http://localhost:3000/api/queue/health

# Проверить метрики производительности
curl http://localhost:3000/api/queue/metrics

# Проверить логи (structured logging)
ls ./logs/
cat ./logs/queue-$(date +%Y-%m-%d).log
```

## 📁 Структура проекта

```
├── app/                    # Next.js App Router
│   ├── api/               # API маршруты
│   ├── create-report/     # Страница создания отчетов
│   ├── reports/           # Страница списка отчетов
│   └── ...
├── components/            # React компоненты
│   ├── ui/               # UI компоненты
│   └── upload/           # Компоненты загрузки файлов
├── lib/                  # Утилиты и хелперы
│   ├── user-utils.ts     # Работа с пользователями
│   ├── report-validation.ts # Валидация отчетов
│   └── ...
├── prisma/               # Схема базы данных
└── .kiro/               # Конфигурация Kiro IDE
```

## 🔐 Безопасность

### 🛡️ Архитектура безопасности 2025
- **Distroless контейнеры**: Web приложение использует минималистичные distroless образы
- **Multi-layer security**: Разделение web и worker контейнеров с разными уровнями доступа
- **Zero-vulnerability policy**: Автоматическое сканирование на уязвимости в CI/CD
- **Nonroot containers**: Все контейнеры работают от непривилегированных пользователей

### 🔒 Базовые меры
- Все секретные ключи хранятся в переменных окружения
- Файлы `.env` и `.env.local` исключены из Git
- Используется аутентификация через Clerk
- API защищены middleware для проверки авторизации

### 📋 Docker Security Update
См. подробный отчет: [docs/DOCKER_SECURITY_UPDATE.md](docs/DOCKER_SECURITY_UPDATE.md)

**Последнее обновление безопасности**: 2025-01-27
- ✅ Устранены критические уязвимости CVE-2024-21538, CVE-2025-23088
- ✅ Миграция на distroless образы для web приложения
- ✅ Обновление до Node.js 22 LTS
- ✅ Настройка автоматического мониторинга уязвимостей

## 📊 Типы отчетов

### 296-ФЗ отчет
- Российская отчетность по выбросам парниковых газов
- Автозаполнение данных организации по ИНН
- Соответствие требованиям ПП 707

### CBAM отчет
- Квартальная отчетность EU Carbon Border Adjustment Mechanism
- Поддержка XML и CSV форматов
- Валидация EORI номеров

### Углеродный след
- Расчет по методологиям GHG Protocol, ISO 14067
- Scope 1, 2, 3 выбросы
- LCA анализ продукции

## 🚧 Статус разработки

Проект находится в стадии MVP разработки. Основная функциональность реализована, ведется работа над:

- Улучшением шаблонов отчетов
- Расширением интеграций с внешними API
- Добавлением новых типов отчетов
- Оптимизацией производительности

## 📝 Лицензия

Частный проект. Все права защищены.

## 👥 Контакты

Для вопросов и предложений обращайтесь к разработчику.

---

**Примечание**: Этот проект создан для демонстрации возможностей ESG-отчетности и не предназначен для коммерческого использования без соответствующих лицензий.