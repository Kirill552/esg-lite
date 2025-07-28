# 📸 Автоматические скриншоты ESG-Lite

Система автоматического создания скриншотов всех страниц ESG-Lite в двух разрешениях.

## 🚀 Быстрый старт

```bash
# 1. Запустите сервер разработки
npm run dev

# 2. В новом терминале запустите скриншоты
# Для публичных страниц (без авторизации):
npm run screenshots

# Для всех страниц с авторизацией (рекомендуется):
npm run screenshots:auth
```

## 🔐 Авторизация

Для корректного создания скриншотов авторизованных страниц (дашборд, кредиты, подписки) используйте скрипт `screenshots:auth`. Он автоматически войдет в систему через реальные учетные данные и создаст скриншоты всех страниц с правильным наполнением.

### Преимущества авторизованных скриншотов:
- ✅ Реальные данные на страницах
- ✅ Полная навигация и компоненты
- ✅ Кредиты, подписки, баланс
- ✅ Правильные состояния UI

## 📋 Что создается

### Разрешения
- **📱 Mobile**: 375px × 812px (iPhone X/11/12/13)
- **💻 Desktop**: 1440px × 900px (MacBook Pro 15")

### Страницы (16 страниц)

#### Публичные страницы
- `homepage` - Главная страница (`/`)
- `sign-in` - Вход в систему (`/sign-in`)
- `sign-up` - Регистрация (`/sign-up`)

#### Основные функции
- `dashboard` - Панель управления (`/dashboard`)
- `upload` - Загрузка документов (`/upload`)
- `reports` - Отчеты (`/reports`)
- `analytics` - Аналитика (`/analytics`)
- `documents` - Документы (`/documents`)

#### Система монетизации
- `credits` - Управление кредитами (`/credits`)
- `subscription` - Подписки и тарифы (`/subscription`)

#### База знаний
- `knowledge-base` - База знаний (`/knowledge`)
- `knowledge-296fz` - 296-ФЗ руководство (`/knowledge/296-fz`)
- `knowledge-cbam` - CBAM руководство (`/knowledge/cbam`)
- `help` - Справка (`/help`)

#### Создание отчетов
- `create-report` - Создание отчетов (`/create-report`)

## 📁 Структура файлов

```
screenshots/
├── index.html                 # 🎨 Галерея скриншотов
├── homepage_mobile.png        # 📱 Главная (мобильная)
├── homepage_desktop.png       # 💻 Главная (десктоп)
├── dashboard_mobile.png       # 📱 Дашборд (мобильная)
├── dashboard_desktop.png      # 💻 Дашборд (десктоп)
└── ...                        # Остальные страницы
```

## 🎨 Просмотр результатов

После выполнения команды `npm run screenshots`:

1. Откройте файл `screenshots/index.html` в браузере
2. Просмотрите все скриншоты в удобной галерее
3. Сравните мобильную и десктопную версии

## ⚙️ Конфигурация

Настройки находятся в `scripts/take-screenshots.js`:

```javascript
const CONFIG = {
  baseURL: 'http://localhost:3000',    // URL сервера
  outputDir: 'screenshots',            // Папка для скриншотов
  
  breakpoints: {
    mobile: { width: 375, height: 812, name: 'mobile' },
    desktop: { width: 1440, height: 900, name: 'desktop' }
  },
  
  screenshotOptions: {
    fullPage: true,        // Полная страница
    quality: 90,           // Качество 90%
    type: 'png',          // Формат PNG
    animations: 'disabled' // Отключить анимации
  }
};
```

## 🔧 Технические детали

### Используемые технологии
- **Playwright** - Автоматизация браузера
- **Chromium** - Движок рендеринга
- **Node.js** - Среда выполнения

### Оптимизации
- Отключение анимаций и переходов
- Прокрутка для активации lazy loading
- Ожидание загрузки сетевых ресурсов
- Адаптивные User-Agent строки

### Обработка ошибок
- Проверка доступности сервера
- Graceful handling недоступных страниц
- Подробная отчетность об ошибках

## 📊 Пример вывода

```
🔍 Проверка доступности сервера...
✅ Сервер доступен
🚀 Запуск браузера для скриншотов...
📁 Создана папка: screenshots
✅ Браузер запущен

🎯 Начинаем захват 15 страниц в 2 разрешениях...

📷 Захват скриншотов: homepage
  • mobile (375x812): http://localhost:3000/
    ✅ Сохранен: homepage_mobile.png
  • desktop (1440x900): http://localhost:3000/
    ✅ Сохранен: homepage_desktop.png

📷 Захват скриншотов: dashboard
  • mobile (375x812): http://localhost:3000/dashboard
    ✅ Сохранен: dashboard_mobile.png
  • desktop (1440x900): http://localhost:3000/dashboard
    ✅ Сохранен: dashboard_desktop.png

📋 Создание индексного файла...
✅ Создан index.html

📊 Результаты:
   Успешно: 15/15 страниц
   Скриншотов создано: 30
   Ошибок: 0
   Время выполнения: 45с
   Папка: C:\Users\whirp\Desktop\bots\EGS-Lite\screenshots

🎉 Все скриншоты успешно созданы!
📂 Откройте C:\Users\whirp\Desktop\bots\EGS-Lite\screenshots\index.html для просмотра
```

## 🚨 Требования

### Перед запуском
1. **Сервер должен быть запущен**: `npm run dev`
2. **Порт 3000 должен быть свободен**
3. **Браузеры Playwright установлены**: `npx playwright install`

### Системные требования
- Node.js 18+
- Playwright browsers
- ~200MB свободного места для браузеров
- ~50MB для скриншотов

## 🔄 Автоматизация

### CI/CD интеграция
```yaml
# .github/workflows/screenshots.yml
- name: Take screenshots
  run: |
    npm run dev &
    sleep 10
    npm run screenshots
    
- name: Upload screenshots
  uses: actions/upload-artifact@v3
  with:
    name: screenshots
    path: screenshots/
```

### Scheduled screenshots
```json
// package.json
{
  "scripts": {
    "screenshots:nightly": "npm run dev & sleep 10 && npm run screenshots && pkill -f 'next dev'"
  }
}
```

## 🐛 Troubleshooting

### Сервер недоступен
```
❌ Сервер недоступен: http://localhost:3000
💡 Убедитесь, что сервер запущен: npm run dev
```
**Решение**: Запустите `npm run dev` в отдельном терминале

### Ошибка браузера
```
❌ Ошибка mobile: Navigation timeout of 30000ms exceeded
```
**Решение**: Увеличьте timeout в CONFIG.waitOptions.pageLoad

### Недостаточно места
```
❌ ENOSPC: no space left on device
```
**Решение**: Освободите место или измените CONFIG.outputDir

## 📈 Статистика

- **Среднее время**: ~3-5 секунд на страницу
- **Размер скриншота**: ~500KB-2MB в зависимости от контента
- **Общий размер**: ~30-50MB для всех скриншотов
- **Успешность**: 95-100% при стабильном сервере

## 🎯 Использование

### Для дизайна
- Проверка адаптивности
- Сравнение версий
- Документация UI/UX

### Для разработки
- Visual regression testing
- Code review визуальных изменений
- Документация функций

### Для менеджмента
- Демонстрация прогресса
- Презентации для клиентов
- Архив изменений интерфейса

---

**🔗 Связанные файлы:**
- `scripts/take-screenshots.js` - Основной скрипт
- `package.json` - npm скрипт `screenshots`
- `.gitignore` - Исключение скриншотов из Git
