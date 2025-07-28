# 📋 CHECKLIST\_ПРОЕКТА (обновлён 26‑07‑2025)

*Единый, понятный любому новичку план: что УЖЕ готово, что ещё нужно, зачем это нужно и какими сервисами (только RU‑friendly, бюджет 2025).*\
*Файл читает ИИ‑помощник, поэтому избегаем двусмысленностей.*

---

## 0. Где мы сейчас ✔️

| Компонент                         | Статус                          | Пояснение (зачем)            |
| --------------------------------- | ------------------------------- | ---------------------------- |
| **Фронт** (Next 15 + Tailwind)    | ✅ Готов                         | UI/SSR + адаптив.            |
| **OCR** (Paddle/Tesseract)        | ✅ Работает локально             | Распознаём PDF/сканы.        |
| **Шаблон 296‑ФЗ**                 | ✅ Валиден (ПП 707)              | Можно сдавать отчёт.         |
| **Шаблон CBAM Q‑2025**            | ✅ Поля Annex I; XML‑diff OK     | Готов к Registry.            |
| **БД** (PostgreSQL16 — SberCloud) | ✅ Поднята, Prisma подключён     | Храним users, docs, credits. |
| **S3** (Yandex Object Storage)    | ✅ Бакет `esg-lite-reports-2025` | Файлы + CDN.                 |
| **Auth** (Clerk self‑host)        | ✅ Email/pass + TG OIDC          | Простая регистрация.         |
| **CI (lint + build)**             | ✅ GitHub Actions                | Гарантия сборки.             |

> **Итого:** MVP ядро собрано, можно локально загрузить счёт → получить валидный PDF отчёт.

---

## 1. Что ещё нужно, чтобы не упасть в июне 📈

| Приор. | Задача                                     | Почему важно / Что даёт                               | Бюджет (₽/мес)     |
| ------ | ------------------------------------------ | ----------------------------------------------------- | ------------------ |
| 🔴     | **BullMQ + Queue Storage**                  | Очередь OCR/PDF, сгладить пиковые запросы 15‑30 июня. | 0‑280 ₽/мес        |
| 🔴     | **Service‑capping 10 OCR/90 сек**          | API‑лимит → защита CPU.                               | —                  |
| 🔴     | **Миграция Node 18 → 20 + Alpine Docker**  | Node 18 EOL апр. 2025.                                | —                  |
| 🟠     | **CI phase 2**: unit‑тесты + `xmllint` XSD | Гарантия, что CBAM XML валиден.                       | —                  |
| 🟠     | **Credits ledger таблица**                 | Биллинг вместо помесячной подписки.                   | —                  |
| 🟠     | **Surge‑pricing flag** (+100 % 15‑30 июня) | Мотивирует грузить заранее.                           | —                  |
| 🟢     | **Carbon Score (month)**                   | Выручка круглый год, KPI.                             | 0 (расчёт)         |
| 🟢     | **Supplier portal (Tier‑2)**               | Платят мелкие заводы, удержание.                      | VPS +0             |

👀 **Отложено** (после прод vs MVP): YooKassa / TG‑бот / Marketplace.

---

## 2. 90‑Day Dev Roadmap (без YooKassa)

| Неделя | Блок             | Конкретные задачи                                                      | Готово, когда…            |
| ------ | ---------------- | ---------------------------------------------------------------------- | ------------------------- |
| 1      | Node20 + Docker  | Обновить `FROM node:20-alpine`; GH‑Action `setup-node@v3`              | CI зелёный.               |
| 2      | Queue Storage    | ➜ Выбрать: free-tier VM + Redis или очередь в Postgres                 | `GET /queue/health = ok`. |
| 3      | BullMQ Queue     | `/api/ocr` → `jobs.add('ocr', {fileKey})`; worker in `/workers/ocr.ts` | `status=queued/finished`. |
| 4      | Capping MW       | Edge‑middleware: limit 10 jobs/90 сек/org, иначе 429                   | логика работает.          |
| 5      | Credits ledger   | Prisma `credits`, debit при отчёте; CLI `add‑credits`                  | баланс меняется.          |
| 6      | Surge flag       | `isSurge = date∈[15..30 июня]`; цена ×2, баннер UI                     | price calc ok.            |
| 7      | Unit tests       | `emission-calculator.spec.ts`, `pdf-generator.spec.ts`                 | 90 % pass.                |
| 8      | XSD CI           | Job `xmllint --schema CBAM.xsd`                                        | GH passes.                |
| 9      | Carbon Score API | cron monthly, store KPI; `/api/kpi/monthly`                            | график в dashboard.       |

---

## 3. Монетизация (гибрид, дешевле помесячной)

- **Annual Lite** 30–50 к ₽ / год → включает 1 000 т CO₂.
- **Credits 5 ₽/т** сверх лимита.
- **Surge ×2** в "красную" ½ июня.
- **CBAM Add‑on** 3 €/т в отчётах ЕС (когда подключим).
- **Carbon Score** 2 к ₽/мес, KPI‑дашборд.\
  *(ЮKassa подключаем только к моменту выхода в прод — Sprint 10.)*

---

## 4. Архитектура (Best‑cost RU‑stack)

```
[Next15]──REST──▶│BullMQ API│──▶ Queue Storage (Redis VM или Postgres)
  │                               │
  │            Job fetch (S3)     ▼
  │                          YC Serverless Container (ocr‑worker)
  │                               │
  │           PDF/A Playwright    ▼
  └──▶ Yandex Object Storage ◀── Report files

DB → SberCloud PostgreSQL 24/7 (free tier)  
Monitoring → UptimeRobot + YC Monitoring.  
CI/CD → GitHub Actions → docker push → YC CR.
```

**Почему так?**\
*БД в SberCloud уже поднята — менять не нужно. Queue Storage + S3 остаются в Яндексе (дешевле).*\
*YC Serverless Containers бесплатны при 0 реплик, скейлятся мгновенно до 30, что покрывает июньский пик.*

---

## 5. Glossary (новичку понятно)

- **BullMQ** — библиотека очередей; кладём задачу, worker забирает.
- **Queue Storage** — хранилище очередей (Redis VM или таблицы в Postgres).
- **Playwright cluster** — несколько Chromium‑процессов генерят PDF.
- **PDF/A** — специальный «архивный» PDF, Росприроднадзор рекомендует.
- **Surge‑pricing** — временное повышение цены во время пиковой нагрузки.

---

## 6. Контрольный чек перед прод

☐ Node20 в Docker image.\
☐ Queue Storage отвечает.\
☐ Worker‑scale 0→30.\
☐ PDF/A проходит Preflight.\
☐ XML проходит XSD 1.4.1.1.\
☐ Service‑capping даёт 429 >10 jobs/90 сек.\
☐ Credits баланс не уходит «‑».\
☐ UptimeRobot пинг <300 ms.

---

> **Все пункты выше «🔴/🟠» обязательны до β‑релиза. YooKassa, Marketplace и 1С‑плагин — после стабильной работы ядра.**