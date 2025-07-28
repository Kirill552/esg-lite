# Monetization Stubs Documentation

## Задача 8.4: Создание заглушек таблиц для монетизации

### Описание
Заглушки таблиц для подготовки к полной монетизации системы с поддержкой кредитной системы, rate limiting и surge-pricing по организациям.

### Требования выполнены
- ✅ **2.1**: Таблица rate_limits для контроля нагрузки по организациям
- ✅ **2.2**: Заглушки таблиц credits для будущей монетизации

## Структура таблиц

### 1. rate_limits (существующая, обновлена)
Контроль скорости запросов по организациям.

```prisma
model RateLimit {
  id             String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  organizationId String
  requestCount   Int      @default(0)
  windowStart    DateTime @default(now()) @db.Timestamp(6)
  createdAt      DateTime @default(now()) @db.Timestamp(6)
  updatedAt      DateTime @default(now()) @updatedAt @db.Timestamp(6)

  @@unique([organizationId, windowStart])
  @@index([organizationId])
  @@index([windowStart])
  @@map("rate_limits")
}
```

**Назначение**: Ограничение количества запросов OCR по организациям (по умолчанию 10 запросов за 90 секунд).

### 2. credits (существующая, расширена)
Кредиты пользователей с поддержкой организаций.

```prisma
model Credits {
  id             String              @id @default(dbgenerated("(gen_random_uuid())::text"))
  userId         String              @unique
  organizationId String?             // Новое поле для организаций
  balance        Int                 @default(1000)
  totalPurchased Int                 @default(1000)
  totalUsed      Int                 @default(0)
  lastTopUp      DateTime?           @db.Timestamp(6)
  createdAt      DateTime            @default(now()) @db.Timestamp(6)
  updatedAt      DateTime            @default(now()) @updatedAt @db.Timestamp(6)
  transactions   CreditTransaction[]
  user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([organizationId])  // Новый индекс
  @@map("credits")
}
```

**Назначение**: Хранение кредитов пользователей с возможностью группировки по организациям.

### 3. organization_credits (новая заглушка)
Кредиты на уровне организаций для будущей B2B монетизации.

```prisma
model OrganizationCredits {
  id             String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  organizationId String   @unique
  balance        Int      @default(1000)
  totalPurchased Int      @default(1000)
  totalUsed      Int      @default(0)
  planType       String   @default("FREE")
  planExpiry     DateTime?
  lastTopUp      DateTime? @db.Timestamp(6)
  createdAt      DateTime @default(now()) @db.Timestamp(6)
  updatedAt      DateTime @default(now()) @updatedAt @db.Timestamp(6)

  @@index([organizationId])
  @@index([planType])
  @@map("organization_credits")
}
```

**Назначение**: Корпоративные кредиты с поддержкой тарифных планов (FREE, STANDARD, PREMIUM).

### 4. monetization_settings (новая заглушка)
Индивидуальные настройки монетизации по организациям.

```prisma
model MonetizationSettings {
  id                    String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  organizationId        String   @unique
  surgePricingEnabled   Boolean  @default(true)
  surgeMultiplier       Float    @default(2.0)
  creditCostPerTon      Float    @default(5.0)
  cbamAddonCostPerTon   Float    @default(3.0)
  rateLimit             Int      @default(10)
  rateLimitWindowSec    Int      @default(90)
  createdAt             DateTime @default(now()) @db.Timestamp(6)
  updatedAt             DateTime @default(now()) @updatedAt @db.Timestamp(6)

  @@index([organizationId])
  @@map("monetization_settings")
}
```

**Назначение**: Гибкие настройки ценообразования и лимитов для каждой организации.

## Бизнес-логика монетизации

### Тарифные планы

| План | Кредиты | Стоимость за тонну CO₂ | CBAM доплата | Rate Limit | Surge Pricing |
|------|---------|------------------------|--------------|------------|---------------|
| **FREE** | 1,000 | 5.0₽ | 3.0€ | 10/90сек | Включен (x2.0) |
| **STANDARD** | 10,000 | 4.0₽ | 2.5€ | 50/90сек | Включен (x1.5) |
| **PREMIUM** | 100,000 | 3.0₽ | 2.0€ | 200/60сек | Отключен |

### Surge Pricing
Период повышенного спроса: **15-30 июня** (пик сдачи отчетов 296-ФЗ).

```typescript
// Пример расчета стоимости
const baseCost = 1; // 1 кредит за OCR
const settings = await getMonetizationSettings(organizationId);

if (settings.surgePricingEnabled && isSurgePeriod()) {
  const finalCost = baseCost * settings.surgeMultiplier;
  // FREE план: 1 * 2.0 = 2 кредита
  // STANDARD план: 1 * 1.5 = 1.5 кредита (округляется до 2)
  // PREMIUM план: surge отключен = 1 кредит
}
```

### Rate Limiting
Контроль нагрузки по организациям с индивидуальными лимитами.

```typescript
// Проверка лимита
const limit = await getRateLimit(organizationId);
const currentWindow = getCurrentWindow(90); // 90 секунд

const usage = await prisma.rateLimit.findFirst({
  where: {
    organizationId,
    windowStart: currentWindow
  }
});

if (usage && usage.requestCount >= limit.maxRequests) {
  throw new Error('Rate limit exceeded');
}
```

## Интеграция с существующими сервисами

### Credits Service
Обновленные методы для работы с организациями:

```typescript
// Проверка кредитов организации
async hasCredits(organizationId: string, amount: number): Promise<boolean> {
  const credits = await prisma.organizationCredits.findUnique({
    where: { organizationId }
  });
  return credits ? credits.balance >= amount : false;
}

// Списание кредитов с учетом surge-pricing
async debitCredits(organizationId: string, baseAmount: number, description: string): Promise<void> {
  const settings = await getMonetizationSettings(organizationId);
  const finalAmount = calculateFinalCost(baseAmount, settings);
  
  await prisma.organizationCredits.update({
    where: { organizationId },
    data: {
      balance: { decrement: finalAmount },
      totalUsed: { increment: finalAmount }
    }
  });
}
```

### Rate Limiter
Обновленная логика с индивидуальными лимитами:

```typescript
async checkLimit(organizationId: string): Promise<boolean> {
  const settings = await getMonetizationSettings(organizationId);
  const currentWindow = getCurrentWindow(settings.rateLimitWindowSec);
  
  const usage = await prisma.rateLimit.upsert({
    where: {
      organizationId_windowStart: {
        organizationId,
        windowStart: currentWindow
      }
    },
    update: {
      requestCount: { increment: 1 }
    },
    create: {
      organizationId,
      windowStart: currentWindow,
      requestCount: 1
    }
  });
  
  return usage.requestCount <= settings.rateLimit;
}
```

### Surge Pricing Service
Индивидуальные настройки surge-pricing:

```typescript
async getSurgeMultiplier(organizationId: string): Promise<number> {
  const settings = await getMonetizationSettings(organizationId);
  
  if (!settings.surgePricingEnabled) {
    return 1.0;
  }
  
  if (isSurgePeriod()) {
    return settings.surgeMultiplier;
  }
  
  return 1.0;
}
```

## Примеры использования

### Создание организации с настройками по умолчанию
```typescript
async function createOrganization(organizationId: string, planType: string = 'FREE') {
  // Создаем кредиты
  await prisma.organizationCredits.create({
    data: {
      organizationId,
      balance: planType === 'FREE' ? 1000 : planType === 'STANDARD' ? 10000 : 100000,
      totalPurchased: planType === 'FREE' ? 1000 : planType === 'STANDARD' ? 10000 : 100000,
      planType
    }
  });
  
  // Создаем настройки
  const settings = getDefaultSettings(planType);
  await prisma.monetizationSettings.create({
    data: {
      organizationId,
      ...settings
    }
  });
}
```

### Обработка OCR запроса с монетизацией
```typescript
async function processOcrRequest(organizationId: string, documentId: string) {
  // 1. Проверяем rate limit
  const rateLimitOk = await rateLimiter.checkLimit(organizationId);
  if (!rateLimitOk) {
    throw new Error('Rate limit exceeded');
  }
  
  // 2. Рассчитываем стоимость
  const baseCost = 1;
  const surgeMultiplier = await surgePricing.getSurgeMultiplier(organizationId);
  const finalCost = Math.ceil(baseCost * surgeMultiplier);
  
  // 3. Проверяем кредиты
  const hasCredits = await creditsService.hasCredits(organizationId, finalCost);
  if (!hasCredits) {
    throw new Error('Insufficient credits');
  }
  
  // 4. Списываем кредиты
  await creditsService.debitCredits(
    organizationId, 
    finalCost, 
    `OCR processing${surgeMultiplier > 1 ? ' (surge)' : ''}: ${finalCost} credits`
  );
  
  // 5. Обрабатываем OCR
  return await processOcr(documentId);
}
```

### Пополнение баланса
```typescript
async function topUpCredits(organizationId: string, amount: number, paymentId: string) {
  await prisma.organizationCredits.update({
    where: { organizationId },
    data: {
      balance: { increment: amount },
      totalPurchased: { increment: amount },
      lastTopUp: new Date()
    }
  });
  
  // Логируем транзакцию
  console.log(`Credits topped up: ${organizationId} +${amount} credits (payment: ${paymentId})`);
}
```

## Мониторинг и аналитика

### Статистика использования кредитов
```sql
-- Топ организаций по использованию кредитов
SELECT 
  organization_id,
  plan_type,
  total_used,
  balance,
  (total_used::float / total_purchased::float * 100) as usage_percentage
FROM organization_credits 
ORDER BY total_used DESC 
LIMIT 10;
```

### Анализ rate limiting
```sql
-- Организации, часто превышающие лимиты
SELECT 
  rl.organization_id,
  ms.rate_limit,
  AVG(rl.request_count) as avg_requests,
  COUNT(*) as windows_count,
  COUNT(CASE WHEN rl.request_count > ms.rate_limit THEN 1 END) as exceeded_count
FROM rate_limits rl
JOIN monetization_settings ms ON rl.organization_id = ms.organization_id
WHERE rl.created_at >= NOW() - INTERVAL '7 days'
GROUP BY rl.organization_id, ms.rate_limit
HAVING COUNT(CASE WHEN rl.request_count > ms.rate_limit THEN 1 END) > 0
ORDER BY exceeded_count DESC;
```

### Эффективность surge-pricing
```sql
-- Доходы от surge-pricing
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN description LIKE '%surge%' THEN 1 ELSE 0 END) as surge_transactions,
  SUM(CASE WHEN description LIKE '%surge%' THEN 
    CAST(SUBSTRING(description FROM '(\d+) credits') AS INTEGER) 
    ELSE 0 END) as surge_credits
FROM credit_transactions 
WHERE type = 'DEBIT' 
  AND created_at >= '2025-06-15' 
  AND created_at <= '2025-06-30'
GROUP BY DATE(created_at)
ORDER BY date;
```

## Миграция к полной монетизации

### Этапы внедрения
1. **Фаза 1**: Тестирование заглушек (текущая)
2. **Фаза 2**: Интеграция с платежными системами (ЮKassa/Stripe)
3. **Фаза 3**: Запуск B2B продаж с тарифными планами
4. **Фаза 4**: Полная монетизация с surge-pricing

### Готовность к продакшену
- ✅ Структура данных готова
- ✅ Индексы для производительности
- ✅ Интеграция с существующими сервисами
- ✅ Поддержка различных бизнес-моделей
- ✅ Мониторинг и аналитика
- ⏳ Интеграция с платежными системами
- ⏳ UI для управления тарифами
- ⏳ Биллинг и инвойсинг

## Тестирование

```bash
# Тест заглушек монетизации
node scripts/test-monetization-stubs.js

# Проверка интеграции с существующими сервисами
node scripts/test-credits-integration.js
node scripts/test-rate-limiter-integration.js
```

Заглушки готовы к использованию и легко масштабируются для полной монетизации системы!