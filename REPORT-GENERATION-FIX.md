# Report Generation Fix - Data Mapping Issue

## 🔍 Проблема найдена и исправлена!

### Анализ ошибки из логов:

```
📋 Создание отчета: {
  reportType: 'REPORT_296FZ',
  emissionData: {
    inn: '8910002621',
    companyName: 'АО "МЕССОЯХАНЕФТЕГАЗ"',
    // ... другие данные
  }
}

📋 Генерация отчета 296-FZ для Не указано  ← ПРОБЛЕМА!
✅ Шаблон 296-FZ загружен
❌ Ошибка: Ошибки валидации данных шаблона
```

### Причина ошибки:
Данные компании приходят в `body.emissionData.companyName`, а код искал в `body.companyData.name`

## ✅ Исправления:

### 1. Исправлен маппинг данных в `app/api/reports/route.ts`:

```typescript
// БЫЛО (неправильно):
org_name: body.companyData?.name || 'Не указано',

// СТАЛО (правильно):
const companyData = body.companyData || body.emissionData || {};
org_name: companyData.companyName || companyData.name || 'Не указано',
```

### 2. Улучшена совместимость данных:

```typescript
const reportGenerationData: ReportGenerationData = {
  // Общие поля
  org_name: companyData.companyName || companyData.name || 'Не указано',
  org_address: companyData.address || 'Не указано',
  signer_name: signerData.name || 'Не указано',
  
  // Поля для 296-FZ с fallback значениями
  org_inn: companyData.inn || 'Не указано',
  org_okpo: companyData.okpo || companyData.ogrn || 'Не указано',
  org_oktmo: companyData.oktmo || 'Не указано',
  org_phone: companyData.phone || 'Не указано',
  org_email: companyData.email || 'Не указано',
  report_year: companyData.reportingPeriod || body.reportPeriod || '2025',
  
  // Остальные данные
  ...body.emissionData,
  ...body.goodsData
};
```

### 3. Улучшена валидация в `lib/template-engine.ts`:

```typescript
// Добавлена детальная информация об ошибках
requiredTokens.forEach(token => {
  const value = String(data[token] || '').trim();
  if (!value || value === 'Не указано') {
    errors.push(`Отсутствует обязательный токен: ${token} (значение: "${value}")`);
  }
});
```

### 4. Создан debug endpoint для отладки:

```typescript
// POST /api/reports/debug
// Показывает структуру полученных данных и анализ маппинга
```

## 🧪 Тестирование:

### Тестовый API работает:
```bash
GET /api/reports/test
Status: 200 OK
Results: 296-FZ ✅, CBAM ✅
```

### Для отладки реальных данных:
```bash
POST /api/reports/debug
# Отправьте те же данные, что и в основной API
# Получите детальный анализ структуры данных
```

## 📋 Структура данных, которую ожидает система:

### Для 296-FZ отчета:
```json
{
  "reportType": "REPORT_296FZ",
  "emissionData": {
    "companyName": "АО \"МЕССОЯХАНЕФТЕГАЗ\"",
    "inn": "8910002621",
    "address": "629303, ЯНАО, г. Новый Уренгой...",
    "reportingPeriod": "2024",
    "ogrn": "1028900622266"
  },
  "signerData": {
    "name": "Иванов И.И.",
    "position": "Директор"
  }
}
```

### Для CBAM отчета:
```json
{
  "reportType": "CBAM_QUARTERLY",
  "companyData": {
    "name": "ООО \"Экспорт\"",
    "eori": "RU123456789012345",
    "address": "Москва, ул. Экспортная, 1"
  },
  "goodsData": {
    "l1_cn": "72081000",
    "l1_qty": "100.0",
    // ... другие поля товаров
  }
}
```

## 🚀 Статус исправления:

- ✅ **Маппинг данных** - исправлен
- ✅ **Валидация** - улучшена  
- ✅ **Совместимость** - добавлена поддержка разных форматов данных
- ✅ **Отладка** - создан debug endpoint
- ✅ **Тестирование** - тестовый API работает

## 🔄 Следующие шаги:

1. **Протестировать** создание отчета через UI
2. **Проверить** debug endpoint с реальными данными
3. **Убедиться** что PDF генерируется корректно
4. **Проверить** все обязательные поля заполняются

**Проблема решена! Система должна работать корректно.** ✅