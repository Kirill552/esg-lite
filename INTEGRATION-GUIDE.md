# Integration Guide - Report Generation System

## 🚀 Система генерации отчетов интегрирована!

Новая система генерации отчетов полностью интегрирована в проект и готова к использованию.

## 📁 Структура интеграции

### Новые модули:

1. **`lib/template-engine.ts`** - Движок замены токенов
2. **`lib/pdf-generator.ts`** - Генератор PDF с Playwright
3. **`lib/report-generator.ts`** - Интегрированный сервис генерации
4. **`app/api/reports/test/route.ts`** - API для тестирования

### Обновленные файлы:

1. **`app/api/reports/route.ts`** - Основной API с новым генератором

## 🔧 Как использовать

### 1. Генерация отчета через API

```typescript
// POST /api/reports
{
  "reportType": "CBAM_QUARTERLY", // или "EMISSION_296FZ"
  "companyData": {
    "name": "ООО \"Тест\"",
    "address": "Москва, ул. Тестовая, 1",
    "inn": "1234567890",
    "eori": "RU123456789012345", // для CBAM
    "cbamId": "DL-2025-000123", // для CBAM
    "country": "RU" // для CBAM
  },
  "signerData": {
    "name": "Иванов И.И.",
    "position": "Директор"
  },
  "reportPeriod": "2025", // или "2025-2" для CBAM
  "emissionData": { /* данные о выбросах */ },
  "goodsData": { /* данные о товарах для CBAM */ }
}
```

### 2. Прямое использование генератора

```typescript
import { generateReport, ReportGenerationData } from '@/lib/report-generator';

const data: ReportGenerationData = {
  org_name: 'ООО "Тест"',
  org_address: 'Москва',
  signer_name: 'Иванов И.И.',
  // ... другие поля
};

const result = await generateReport('CBAM', data);

if (result.success) {
  console.log('PDF создан:', result.filePath);
} else {
  console.error('Ошибка:', result.error);
}
```

### 3. Тестирование системы

```bash
# Тестовая генерация обоих типов отчетов
curl http://localhost:3000/api/reports/test
```

## 📋 Поддерживаемые типы отчетов

### 296-FZ (Российский отчет)
- **Тип**: `'296-FZ'` или `'EMISSION_296FZ'`
- **Шаблон**: `templates/ru-296fz-report-2025.html`
- **Обязательные поля**: `org_name`, `org_inn`, `org_address`, `signer_name`, `signer_position`

### CBAM (Европейский отчет)
- **Тип**: `'CBAM'` или `'CBAM_QUARTERLY'`
- **Шаблон**: `templates/eu-cbam-quarterly-2025.html`
- **Обязательные поля**: `eori`, `cbam_id`, `org_name`, `org_address`, `org_country`, `signer_name`, `signer_pos`

## 🎯 Ключевые возможности

### ✅ Template Engine
- Замена токенов `[[snake_case]]`
- Валидация обязательных полей
- Контроль отображения пустых строк (CBAM)
- Автоматический расчет итогов (CBAM)

### ✅ PDF Generator
- Playwright + Chromium
- Поддержка DejaVu Sans (кириллица)
- A4 формат, print-ready CSS
- Автоматическое именование файлов

### ✅ Report Generator
- Унифицированный интерфейс
- Обработка ошибок
- Метаданные и логирование
- Пакетная генерация

## 🔍 Валидация данных

### 296-FZ валидация:
- ИНН (10-12 цифр)
- ОКПО (8-10 символов)
- Обязательные поля организации

### CBAM валидация:
- EORI номер (ISO формат)
- ISO коды стран (2 символа)
- CN коды товаров (8 цифр)
- UN/LOCODE коды

## 📊 Мониторинг и логирование

```typescript
// Логи генерации
console.log('📋 Генерация отчета CBAM для ООО "Тест"');
console.log('✅ Шаблон CBAM загружен');
console.log('✅ Шаблон обработан, токены заменены');
console.log('🎉 Отчет CBAM успешно создан');

// Предупреждения
console.warn('⚠️ Незамененные токены:', ['token1', 'token2']);
console.warn('⚠️ Отсутствуют шрифты DejaVu Sans');
```

## 🚨 Обработка ошибок

### Типы ошибок:
1. **Валидация данных** - отсутствующие обязательные поля
2. **Загрузка шаблона** - файл не найден
3. **Генерация PDF** - ошибки Playwright
4. **Файловая система** - проблемы с записью

### Пример обработки:
```typescript
const result = await generateReport('CBAM', data);

if (!result.success) {
  if (result.templateErrors) {
    // Ошибки валидации данных
    console.error('Валидация:', result.templateErrors);
  } else {
    // Другие ошибки
    console.error('Генерация:', result.error);
  }
}
```

## 📁 Файловая структура

```
public/
├── fonts/                    # DejaVu Sans шрифты
│   ├── DejaVuSans.ttf
│   └── DejaVuSans-Bold.ttf
└── reports/                  # Сгенерированные PDF
    ├── 296-FZ_Company_2025_2025-07-25.pdf
    └── CBAM_Company_2025-2_2025-07-25.pdf

templates/
├── ru-296fz-report-2025.html    # 296-FZ шаблон
└── eu-cbam-quarterly-2025.html  # CBAM шаблон

lib/
├── template-engine.ts        # Движок шаблонов
├── pdf-generator.ts         # PDF генератор
└── report-generator.ts      # Интегрированный сервис
```

## 🧪 Тестирование

### Автоматические тесты:
```bash
# Запуск тестов шаблонов
node test-cbam-2025.js
node test-cbam-with-line3.js

# API тест
curl http://localhost:3000/api/reports/test
```

### Ручное тестирование:
1. Создание отчета через UI
2. Проверка PDF файла
3. Валидация данных
4. Тестирование ошибок

## 🔄 Миграция с старой системы

### Что изменилось:
- ✅ Новый движок шаблонов (вместо простой замены строк)
- ✅ Интегрированная валидация данных
- ✅ Улучшенная генерация PDF
- ✅ Унифицированный API

### Обратная совместимость:
- ✅ Существующие API endpoints работают
- ✅ Формат данных совместим
- ✅ Файловая структура сохранена

## 🎉 Готово к продакшену!

Система полностью интегрирована и готова к использованию:

- ✅ **296-FZ отчеты** - готовы к загрузке в Реестр Росприроднадзора
- ✅ **CBAM отчеты** - готовы к подаче в CBAM Transitional Registry
- ✅ **API интеграция** - работает с существующим фронтендом
- ✅ **Тестирование** - полный набор тестов
- ✅ **Документация** - подробные инструкции

**Система готова к боевому использованию!** 🚀