const { chromium } = require('playwright');

async function testCreditsPagePerformance() {
  console.log('🧪 Тестирование производительности страницы кредитов...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Отслеживание сетевых запросов
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });
    
    // Отслеживание консольных ошибок
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Переход на страницу кредитов
    console.log('📍 Переходим на /credits...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/credits', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Время загрузки: ${loadTime}ms`);
    
    // Ждем загрузки основных элементов
    await page.waitForSelector('[data-testid="credits-page"]', { timeout: 10000 });
    
    // Проверяем, что нет бесконечных перерендеров
    console.log('🔄 Ожидание стабилизации (3 секунды)...');
    await page.waitForTimeout(3000);
    
    // Делаем скриншот
    await page.screenshot({ path: 'credits-page-test.png' });
    
    // Результаты
    console.log('\n📊 Результаты тестирования:');
    console.log(`✅ Время загрузки: ${loadTime}ms`);
    console.log(`✅ API запросы: ${requests.length}`);
    console.log(`${consoleErrors.length === 0 ? '✅' : '❌'} Ошибки консоли: ${consoleErrors.length}`);
    
    if (requests.length > 0) {
      console.log('\n🌐 API запросы:');
      requests.forEach(url => console.log(`  - ${url}`));
    }
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Ошибки консоли:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🎯 Страница загружена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  } finally {
    await browser.close();
  }
}

// Запуск теста
testCreditsPagePerformance().catch(console.error);
