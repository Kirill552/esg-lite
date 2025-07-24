## 1 📄 Референс‑цель MVP

За 90 дней выпускаем веб‑приложение, которое позволяет пользователю:

1. загрузить **PDF/CSV** счёт за электроэнергию или транспортную накладную;
2. автоматически распознать ключевые поля (объём, топливо, кВт·ч);
3. сохранить запись в личном кабинете и сгенерировать два файла — **PDF отчёт по 296‑ФЗ** и **CSV/XML для CBAM**;
4. оплатить выпуск отчёта через YooKassa и скачать файлы. Всё остальное (интеграция с 1С, сценарное моделирование, роли, мобильное приложение, маркетплейс консультантов) переносим в **V2**.

## 2 🗺️ Архитектура системы (Plan B)

```
[Browser]─HTTPS─>│Next.js SSR│─REST─>│YC Functions│─>│OCR Worker (Tesseract)│
                     │                   │
                     │                   └─>│Emission Engine (Python)│
                     │                                   │
                     │◄─────Signed PDF ◄────│ReportLab│◄─┘
                     │
[Static Files]←───────│Yandex Static Hosting│
                     │
[DB]◄─────────gRPC────│Managed PostgreSQL│
                     │
[Object Storage]◄─────┘ (report archive)

Payments ↔ YooKassa  |  Email ↔ UniSender  |  Bot ↔ TG API
Monitoring → UptimeRobot, Sentry
```

## 3 🧰 Компоненты стека

```markdown
| Layer                 | Lib/Service               | Версия 2025 | Причина выбора                    | ₽/мес @1k MAU |
|-----------------------|---------------------------|-------------|-----------------------------------|--------------|
| UI + SSR             | Next.js 15                | [🔥 NEW 2025 confirmed] | React‑экосистема, файн‑гран. рендер | 0 |
| Styling              | Tailwind CSS 3.5          | [Ver. 2025 assumed] | скорость прототипа                | 0 |
| Auth                 | Clerk.dev self‑host       | v4.2 [🔥 NEW 2025] | passkey + Telegram OIDC, 0 ₽        | 0 |
| API runtime          | Yandex Cloud Functions    | 2025‑03 LTS | 1 М выз./мес free tier             | 0 |
| DBaaS                | YC Managed PostgreSQL      | 16.1        | 152‑FZ DC                          | ≈ 4 500 ₽ [Ver.] |
| OCR                  | Tesseract 5.4             | [🔥]        | open source                        | 0 |
| PDF gen              | Python reportlab 4.1       | [Ver.]      | рус. шрифты                        | 0 |
| Hosting (static)     | Yandex Static Hosting      | 2025        | CDN + RU IP                        | 0 |
| Object Storage       | YC S3 10 GB                | 2025        | архив отчётов                      | ≈ 70 ₽ [Ver.] |
| Payments             | YooKassa API 3.4          | [Ver.]      | локальные карты                    | fee‐based |
| Mail                 | UniSender Lite 10k        | 2025        | руб. биллинг                       | 1 200 ₽ |
| Monitoring           | UptimeRobot Pro           | 2025        | 30 сек пинг                        | ≈ 630 ₽ |
| Errors               | Sentry Team               | 2025        | self‑host опция при санкциях        | 2 340 ₽ |
```

## 4 ⚙️ API / SDK список

- **Yandex Cloud Functions SDK 1.7** — [https://cloud.yandex.ru/docs/functions/sdk-js](https://cloud.yandex.ru/docs/functions/sdk-js) [🔥 NEW 2025]
- **YC IAM API 2025‑06** — обновлена RBAC‑‑‑‑‑‑–verify.
- **Clerk.dev Server SDK v4.2** — [https://clerk.dev/docs/server](https://clerk.dev/docs/server) [🔥 NEW 2025]
- **YooKassa API 3.4** — [https://yookassa.ru/developers/](https://yookassa.ru/developers/) [Ver. 2025 assumed]
- **Tesseract 5.4 changelog** — [https://github.com/tesseract-ocr/tesseract/releases/tag/5.4.0](https://github.com/tesseract-ocr/tesseract/releases/tag/5.4.0)
- **ReportLab 4.1** — [https://www.reportlab.com/docs/reportlab-userguide.pdf](https://www.reportlab.com/docs/reportlab-userguide.pdf)
- **Telegram Bot API 7.3** — [https://core.telegram.org/bots/api#june-11-2025](https://core.telegram.org/bots/api#june-11-2025) [🔥 NEW 2025]

## 5 📅 Gantt 90 дней

```text
Неделя | Задачи                            | Исполнитель | Выходы
1      | ТЗ детализ.; CI скрипт           | dev         | spec.md, pipeline.yml
2      | Макеты Figma; Tailwind setup     | dev+GPT     | UI kit
3      | БД schema, Prisma ген.           | GPT assist  | ddl.sql
4      | Cloud Functions boilerplate      | dev         | auth, healthcheck
5      | OCR worker + unit‑тесты          | GPT         | ocr.py, tests
6      | PDF генератор, рус. шрифты        | dev         | pdf_service.py
7      | Платёжный поток YooKassa          | dev         | callback, webhooks
8      | E2E Cypress; нагруз. тест k6      | dev+GPT     | test‑reports
9      | Beta с 5 SME; баг‑фикс & launch   | dev         | v0.1 tag, prod URL
```

Критический путь: OCR → Emission Engine → PDF → Payments.

## 6 💵 Затраты

```markdown
| Статья               | CapEx (единораз.) | OpEx/мес |
|----------------------|-------------------|----------|
| Домены + SSL         | 1 200₽            | – |
| Yandex Cloud (PG+S3) | –                 | 4 570₽ [Ver.] |
| UniSender            | –                 | 1 200₽ |
| Monitoring/Errors    | –                 | 2 970₽ |
| Прочие (трафик, VAT) | –                 | ~500₽ |
| **Итого**            | **1 200₽**        | **≈ 9 240₽** |
```

## 7 🛡️ Риски 2025

| Риск                   | Ранний сигнал       | План B                                              |
| ---------------------- | ------------------- | --------------------------------------------------- |
| 🇷🇺 Reg change 296‑ФЗ | нов. проект приказа | обновить factor‑json за 48 ч                        |
| Блок YooKassa по MCC   | 3 × failed платежа  | переключить Stripe‑RU → Tinkoff Pay (готов адаптер) |
| OCR > 5 % ошибок       | >3 support тикетов  | включить ручное редакт. + запустить ML‑fine‑tune    |

## 8 📈 Метрики успеха

- **Activation %** (report\_created / sign‑up) — AppMetrica SDK 6.0 [🔥 NEW 2025]
- **Median TTR** (минуты upload→PDF) — лог‑дэшборд YC Monitoring.
- **Paid Conversion %** — YooKassa analytics csv.

### Примечание по нормативным данным

Для ИИ‑движка достаточно структурированных факторов и версий; полный документ закона можно оставить как ссылку. Главное — поддерживать актуальность коэффициентов и фиксировать их версию в отчётах.

