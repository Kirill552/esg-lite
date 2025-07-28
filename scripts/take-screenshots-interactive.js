/**
 * Интерактивный скрипт для создания скриншотов ESG-Lite
 * Сначала делает скриншоты публичных страниц, затем ждет ручной авторизации
 * и после этого делает скриншоты авторизованных страниц
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Конфигурация
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

// Разрешения экранов
const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1440, height: 900 }
};

// Список страниц для скриншотов
const PAGES = [
  // Публичные страницы (без авторизации)
  { 
    name: 'homepage', 
    path: '/', 
    requiresAuth: false,
    description: 'Главная страница'
  },
  { 
    name: 'sign-in', 
    path: '/sign-in', 
    requiresAuth: false,
    description: 'Вход в систему'
  },
  { 
    name: 'sign-up', 
    path: '/sign-up', 
    requiresAuth: false,
    description: 'Регистрация'
  },
  { 
    name: 'knowledge', 
    path: '/knowledge', 
    requiresAuth: false,
    description: 'База знаний'
  },
  { 
    name: 'knowledge-296fz', 
    path: '/knowledge/296-fz', 
    requiresAuth: false,
    description: '296-ФЗ руководство'
  },
  { 
    name: 'knowledge-cbam', 
    path: '/knowledge/cbam', 
    requiresAuth: false,
    description: 'CBAM руководство'
  },
  { 
    name: 'help', 
    path: '/help', 
    requiresAuth: false,
    description: 'Справка'
  },
  
  // Авторизованные страницы
  { 
    name: 'dashboard', 
    path: '/dashboard', 
    requiresAuth: true,
    description: 'Дашборд',
    variants: ['default', 'with-billing'] // Обычный вид и с открытым биллингом
  },
  { 
    name: 'analytics', 
    path: '/analytics', 
    requiresAuth: true,
    description: 'Аналитика ESG'
  },
  { 
    name: 'credits', 
    path: '/credits', 
    requiresAuth: true,
    description: 'Управление кредитами',
    variants: ['default', 'with-billing'] // Обычный вид и с открытым биллингом
  },
  { 
    name: 'subscription', 
    path: '/subscription', 
    requiresAuth: true,
    description: 'Управление подписками'
  },
  { 
    name: 'suppliers', 
    path: '/suppliers', 
    requiresAuth: true,
    description: 'Управление поставщиками'
  },
  { 
    name: 'settings', 
    path: '/settings', 
    requiresAuth: true,
    description: 'Настройки системы',
    variants: ['tab1', 'tab2'] // Разные табы
  },
  { 
    name: 'create-report', 
    path: '/create-report', 
    requiresAuth: true,
    description: 'Создание отчетов'
  },
  { 
    name: 'upload', 
    path: '/upload', 
    requiresAuth: true,
    description: 'Загрузка документов'
  },
  { 
    name: 'reports', 
    path: '/reports', 
    requiresAuth: true,
    description: 'Мои отчеты'
  },
  { 
    name: 'documents', 
    path: '/documents', 
    requiresAuth: true,
    description: 'Мои документы'
  }
];

// Функция ожидания загрузки страницы
async function waitForPageLoad(page) {
  try {
    console.log('⏳ Ожидаем загрузки страницы...');
    
    // Ждем загрузки основных элементов
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Ждем рендеринга React компонентов
    await page.waitForFunction(() => {
      return document.readyState === 'complete' && 
             (window.React !== undefined || 
              document.querySelector('[data-reactroot], #__next, #root, main, .container') !== null);
    }, { timeout: 8000 }).catch(() => {
      console.log('⚠️ React компоненты загружаются...');
    });
    
    // Дополнительное время для завершения анимаций
    await page.waitForTimeout(2000);
    
    console.log('✅ Страница загружена');
    
  } catch (error) {
    console.warn('⚠️ Продолжаем с неполной загрузкой:', error.message);
    await page.waitForTimeout(1000);
  }
}

// Функция прокрутки страницы
async function scrollPage(page) {
  try {
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0); // Возвращаемся к началу
            setTimeout(resolve, 500);
          }
        }, 100);
      });
    });
  } catch (error) {
    console.warn('⚠️ Ошибка прокрутки:', error.message);
  }
}

// Функция для взаимодействия с интерфейсом перед скриншотом
async function interactWithPage(page, pageConfig, variant = 'default') {
  try {
    // Для страниц дашборда и кредитов - попробуем кликнуть на баланс в хедере
    if (['dashboard', 'credits', 'analytics', 'subscription'].includes(pageConfig.name)) {
      
      if (variant === 'with-billing') {
        console.log('🔘 Открываем биллинговую панель...');
        
        // Ждем появления кнопки баланса
        const balanceButton = page.locator('button:has-text("₽"), button[class*="emerald"]:has-text("₽")').first();
        
        const balanceExists = await balanceButton.count() > 0;
        if (balanceExists) {
          console.log('💰 Найдена кнопка баланса, кликаем...');
          await balanceButton.click();
          
          // Ждем появления drawer с информацией о биллинге
          await page.waitForTimeout(1500);
          
          // Проверяем, открылся ли drawer
          const drawer = page.locator('[role="dialog"], .drawer, [data-drawer], [class*="drawer"]');
          const drawerExists = await drawer.count() > 0;
          
          if (drawerExists) {
            console.log('📊 Drawer с биллинговой информацией открыт');
            await page.waitForTimeout(500); // Ждем анимации
          } else {
            console.log('⚠️ Drawer не открылся, пробуем альтернативные селекторы...');
            
            // Пробуем найти модальное окно
            const modal = page.locator('[data-testid="billing-modal"], .modal, [class*="modal"]');
            const modalExists = await modal.count() > 0;
            
            if (modalExists) {
              console.log('📋 Модальное окно биллинга открыто');
              await page.waitForTimeout(500);
            }
          }
        } else {
          console.log('⚠️ Кнопка баланса не найдена');
        }
      }
    }
    
    // Для страницы настроек - можем переключаться между табами
    if (pageConfig.name === 'settings') {
      console.log('⚙️ Работаем с табами настроек...');
      
      // Ищем табы
      const tabs = page.locator('button[role="tab"], .tab-button, [data-tab], button:has-text("Профиль"), button:has-text("Уведомления"), button:has-text("Безопасность")');
      const tabCount = await tabs.count();
      
      if (tabCount > 1 && variant === 'tab2') {
        // Кликаем на второй таб для демонстрации
        await tabs.nth(1).click();
        await page.waitForTimeout(500);
        console.log('📑 Переключились на второй таб');
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Ошибка взаимодействия с интерфейсом:', error.message);
  }
}

// Функция создания скриншота
async function takeScreenshot(page, pageName, viewport, viewportName) {
  try {
    const filename = `${pageName}_${viewportName}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png'
    });
    
    console.log(`📸 ${viewportName}: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Ошибка скриншота ${pageName}_${viewportName}:`, error.message);
    return null;
  }
}

// Функция ожидания пользовательского ввода
function waitForUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Функция проверки авторизации
async function checkAuthentication(page) {
  try {
    // Переходим на дашборд для проверки
    await page.goto(`${BASE_URL}/dashboard`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    
    // Если нас перенаправило на страницу входа, значит не авторизованы
    if (currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up')) {
      return false;
    }
    
    // Проверяем наличие элементов авторизованного пользователя
    const hasUserMenu = await page.locator('button:has-text("Выйти"), button:has-text("Sign out"), [data-testid="user-menu"], .user-menu').count() > 0;
    const hasDashboardContent = await page.locator('h1:has-text("Дашборд"), h1:has-text("Dashboard"), [data-testid="dashboard"]').count() > 0;
    
    return hasUserMenu || hasDashboardContent || currentUrl.includes('/dashboard');
    
  } catch (error) {
    console.log('⚠️ Ошибка проверки авторизации:', error.message);
    return false;
  }
}

// Главная функция
async function createScreenshots() {
  console.log('🚀 Запуск интерактивного создания скриншотов ESG-Lite');
  console.log(`📍 Базовый URL: ${BASE_URL}`);
  console.log(`📁 Папка скриншотов: ${SCREENSHOTS_DIR}`);
  
  // Создаем папку для скриншотов
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  
  const browser = await chromium.launch({ 
    headless: false, // Показываем браузер для ручной авторизации
    slowMo: 50 
  });
  
  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const results = {
    success: [],
    failed: [],
    total: PAGES.length * Object.keys(VIEWPORTS).length
  };
  
  try {
    // ЭТАП 1: Скриншоты публичных страниц
    console.log('\n🌐 ЭТАП 1: Создание скриншотов публичных страниц');
    console.log('=' .repeat(60));
    
    const publicPages = PAGES.filter(page => !page.requiresAuth);
    
    for (const pageConfig of publicPages) {
      console.log(`\n📄 Обрабатываем: ${pageConfig.description} (${pageConfig.path})`);
      
      for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
        try {
          const page = await context.newPage();
          await page.setViewportSize(viewport);
          
          console.log(`🔍 ${viewportName} (${viewport.width}x${viewport.height})`);
          
          // Переходим на страницу
          await page.goto(`${BASE_URL}${pageConfig.path}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });
          
          // Ждем загрузки
          await waitForPageLoad(page);
          
          // Прокручиваем страницу
          await scrollPage(page);
          
          // Создаем скриншот
          const filename = await takeScreenshot(page, pageConfig.name, viewport, viewportName);
          
          if (filename) {
            results.success.push(filename);
            console.log(`✅ Скриншот сохранен: ${filename}`);
          } else {
            results.failed.push(`${pageConfig.name}_${viewportName}`);
          }
          
          await page.close();
          
        } catch (error) {
          console.error(`❌ Ошибка на странице ${pageConfig.name} (${viewportName}):`, error.message);
          results.failed.push(`${pageConfig.name}_${viewportName}`);
        }
        
        // Пауза между скриншотами
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // ЭТАП 2: Ручная авторизация
    console.log('\n🔐 ЭТАП 2: Ручная авторизация');
    console.log('=' .repeat(60));
    console.log('🌐 Открываю браузер для авторизации...');
    
    const authPage = await context.newPage();
    await authPage.goto(`${BASE_URL}/sign-in`);
    
    console.log('\n📋 ИНСТРУКЦИИ:');
    console.log('1. Авторизуйтесь в открывшемся браузере');
    console.log('2. Дождитесь перехода на дашборд');
    console.log('3. Нажмите Enter в этом окне для продолжения');
    
    await waitForUserInput('\n⏳ Нажмите Enter после завершения авторизации...');
    
    // Проверяем авторизацию
    console.log('\n🔍 Проверяю состояние авторизации...');
    const isAuthenticated = await checkAuthentication(authPage);
    
    if (!isAuthenticated) {
      console.log('\n❌ Авторизация не обнаружена. Попробуйте еще раз...');
      
      const retry = await waitForUserInput('Хотите повторить проверку? (y/n): ');
      if (retry === 'y' || retry === 'yes') {
        const secondCheck = await checkAuthentication(authPage);
        if (!secondCheck) {
          console.log('❌ Авторизация по-прежнему не работает. Завершаю работу с публичными скриншотами.');
          await authPage.close();
          await browser.close();
          return;
        }
      } else {
        await authPage.close();
        await browser.close();
        return;
      }
    }
    
    console.log('✅ Авторизация подтверждена!');
    await authPage.close();
    
    // ЭТАП 3: Скриншоты авторизованных страниц
    console.log('\n🔒 ЭТАП 3: Создание скриншотов авторизованных страниц');
    console.log('=' .repeat(60));
    
    const authPages = PAGES.filter(page => page.requiresAuth);
    
    for (const pageConfig of authPages) {
      console.log(`\n📄 Обрабатываем: ${pageConfig.description} (${pageConfig.path})`);
      
      for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
        try {
          const page = await context.newPage();
          await page.setViewportSize(viewport);
          
          console.log(`🔍 ${viewportName} (${viewport.width}x${viewport.height})`);
          
          // Переходим на страницу
          await page.goto(`${BASE_URL}${pageConfig.path}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });
          
          // Проверяем, что не было перенаправления на вход
          await page.waitForTimeout(2000);
          const currentUrl = page.url();
          if (currentUrl.includes('/sign-in')) {
            console.log('⚠️ Перенаправление на страницу входа. Пропускаем...');
            results.failed.push(`${pageConfig.name}_${viewportName}`);
            await page.close();
            continue;
          }
          
          // Ждем загрузки
          await waitForPageLoad(page);
          
          // Взаимодействуем с интерфейсом (кликаем на элементы если нужно)
          await interactWithPage(page, pageConfig);
          
          // Прокручиваем страницу
          await scrollPage(page);
          
          // Создаем скриншот
          const filename = await takeScreenshot(page, pageConfig.name, viewport, viewportName);
          
          if (filename) {
            results.success.push(filename);
            console.log(`✅ Скриншот сохранен: ${filename}`);
          } else {
            results.failed.push(`${pageConfig.name}_${viewportName}`);
          }
          
          await page.close();
          
        } catch (error) {
          console.error(`❌ Ошибка на странице ${pageConfig.name} (${viewportName}):`, error.message);
          results.failed.push(`${pageConfig.name}_${viewportName}`);
        }
        
        // Пауза между скриншотами
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Создаем индексный файл
    await createIndexHTML(results.success);
    
    // Выводим результаты
    console.log('\n🎉 Создание скриншотов завершено!');
    console.log('=' .repeat(60));
    console.log(`✅ Успешно: ${results.success.length}`);
    console.log(`❌ Ошибки: ${results.failed.length}`);
    console.log(`📁 Скриншоты сохранены в: ${SCREENSHOTS_DIR}`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ Не удалось создать скриншоты:');
      results.failed.forEach(name => console.log(`   • ${name}`));
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

// Функция создания индексного HTML файла
async function createIndexHTML(screenshots) {
  const indexPath = path.join(SCREENSHOTS_DIR, 'index.html');
  
  // Группируем скриншоты по страницам
  const groupedScreenshots = {};
  screenshots.forEach(filename => {
    const [pageName, viewport] = filename.replace('.png', '').split('_');
    if (!groupedScreenshots[pageName]) {
      groupedScreenshots[pageName] = {};
    }
    groupedScreenshots[pageName][viewport] = filename;
  });
  
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESG-Lite Screenshots</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
        .page-section { 
            background: white; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .page-title { 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 15px; 
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        .viewport-group { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 20px;
        }
        .viewport-item {
            text-align: center;
        }
        .viewport-label { 
            font-weight: 500; 
            margin-bottom: 10px; 
            color: #6b7280;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .screenshot-container {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
            transition: transform 0.2s ease;
        }
        .screenshot-container:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .screenshot { 
            max-width: 100%; 
            height: auto; 
            display: block;
        }
        .stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        @media (max-width: 768px) {
            .viewport-group { grid-template-columns: 1fr; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 ESG-Lite Screenshots</h1>
        
        <div class="stats">
            <h3>Статистика скриншотов</h3>
            <p>Всего страниц: ${Object.keys(groupedScreenshots).length} | Всего скриншотов: ${screenshots.length}</p>
            <p>Создано: ${new Date().toLocaleString('ru-RU')}</p>
        </div>
        
        ${Object.entries(groupedScreenshots).map(([pageName, viewports]) => {
          const pageInfo = PAGES.find(p => p.name === pageName);
          const title = pageInfo ? pageInfo.description : pageName;
          const authStatus = pageInfo ? (pageInfo.requiresAuth ? '🔒 Требует авторизации' : '🌐 Публичная') : '';
          
          return `
            <div class="page-section">
                <div class="page-title">
                    ${title} <small style="color: #6b7280;">(${pageName}) ${authStatus}</small>
                </div>
                <div class="viewport-group">
                    ${viewports.mobile ? `
                        <div class="viewport-item">
                            <div class="viewport-label">📱 Mobile (375px)</div>
                            <div class="screenshot-container">
                                <img src="./${viewports.mobile}" alt="${pageName} mobile" class="screenshot" />
                            </div>
                        </div>
                    ` : ''}
                    ${viewports.desktop ? `
                        <div class="viewport-item">
                            <div class="viewport-label">🖥️ Desktop (1440px)</div>
                            <div class="screenshot-container">
                                <img src="./${viewports.desktop}" alt="${pageName} desktop" class="screenshot" />
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
          `;
        }).join('')}
    </div>
</body>
</html>
  `;
  
  await fs.writeFile(indexPath, html, 'utf8');
  console.log(`📄 Создан индексный файл: ${indexPath}`);
}

// Запуск скрипта
createScreenshots().catch(console.error);
