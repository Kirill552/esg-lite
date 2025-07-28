# 📋 ESG‑Lite — зад### 1.3 CBAM Add‑on
- Опция: **+255 ₽/т CO₂** (фиксированная цена в рублях) для строк CBAM‑отчёта.
- Возможность по‑строчной тарификации.
- **СТАТУС: ✅ ЗАВЕРШЕНО** - Реализована система ценообразования CBAM с API endpoints для реализации (монетизация & нагрузка)
*Отдать нейросети в IDE: каждый пункт — отдельная фича/issue. Сохраняем порядок приоритета.*

---
## 0. Context (вводная)
- Год: **2025**
- Срок отчётности 296‑ФЗ → **до 1 июля**; CBAM — поквартально.
- Цель: не «упасть» в июне, дать устойчивую выручку весь год.

---
## 1. Монетизация (гибридная модель)
### 1.1 Annual Lite тариф
- Цена: **30–50 к ₽/год**.
- Включено: хранение данных, API, дашборд, 1 000 т CO₂ кредитов.

### 1.2 Кредиты (Credits Ledger)
- Стоимость: **5 ₽/т CO₂‑экв** сверх 1 000 т.
- Храним баланс, списываем при генерации отчёта.

### 1.3 CBAM Add‑on
- Опция: **+3 €/т CO₂** (или экв.₽) для строк CBAM‑отчёта.
- Возможность по‑строчной тарификации.

### 1.4 Surge‑pricing («аврал‑сбор»)
- Период: **15–30 июня**.
- Механика: любой списываемый кредит ×**2**; отображать баннер «Скидка 15 % до 15 июня».

---
## 2. Выручка круглый год
| Фича | Описание | Периодичность | Потенц. выручка |
|------|----------|---------------|-----------------|
| **CBAM Quarterly** | Автоген отчёта Q1–Q4 | 4×/год | +15–20 % MRR |
| **Месячный “Углеродный счёт”** | KPI‑дашборд для банков/ESG‑рейтинга | 12× | 2 000 ₽/мес |
| **Модуль “Поставщики”** | Tier‑2 <50 k т заводы шлют данные | ад‑hoc | 3 000 ₽/поставщик |
| **Tax Simulator 26‑30** | Сколько заплачу → тариф **Insights** | ежекварт | 10 к ₽/клиент/кварт. |
| **Marketplace экспертов** | Единовр. аудит/вериф. → 10 % fee | по сделке | 50–100 k ₽/аудит |
| **API‑плагин 1С** | Виджет данных в 1С/БОС | 5 000 ₽/мес | MRR |

---
## 3. Скейл и отказоустойчивость
### 3.1 Queue & Autoscale
- BullMQ + Redis 7 (YC Managed), приоритет `high` (surge), `normal`.
- Deploy worker‑pods (YC Serverless Containers) scale 0→30.

### 3.2 Service‑capping
- Лимит: **10 OCR jobs / 90 сек / org**.
- HTTP 429 + «запрос поставлен в очередь», ETA.

### 3.3 Rate‑limit API
- Edge‑middleware (`GET/POST` 200 req/min/IP).

---
## 4. Платёжная реализация
- **Credits ledger** в Postgre (таблица `credits`): `org_id`, `balance_t_co2`, `updated_at`.
- ЮKassa «Оплата по счету» / Stripe Europe: `one_off` (credit), `recurring` (annual).
- Webhook: `payments/route.ts` → пополнение баланса.

---
## 5. Roadmap (tasks)
| Sprint | Key tasks |
|--------|-----------|
| **S1** | Schema `credits`, API `/credits/balance`.<br>Surge‑pricing flag by date. |
| **S2** | BullMQ queue, worker autoscale YCSC.<br>Service‑capping middleware. |
| **S3** | CBAM Quarterly generator.<br>Carbon Score (month KPI) endpoint. |
| **S4** | Supplier portal (invites, uploader). |
| **S5** | Tax Simulator algo + UI.<br>1С REST‑plugin (token auth). |
| **S6** | Marketplace escrow flow, payout % logic. |

---
### Glossary
- **MRR** — ежемесячный повторяющийся доход.
- **CAC** — стоимость привлечения клиента.
- **OCR** — распознавание текста (Tesseract/PaddleOCR).
- **CBAM** — Carbon Border Adjustment Mechanism, отчёт ЕС.
- **Surge fee** — повышающий коэффициент в пик нагрузки.

---
> Использовать **Playwright** для PDF, **PaddleOCR** как дефолт OCR на сервере. 

