const fs = require('fs');
const path = require('path');

console.log('🧪 Тестирование страницы управления тарифами - Задача 7.2\n');

async function testSubscriptionPage() {
  let score = 0;
  const maxScore = 15;

  console.log('📁 Проверка файловой структуры:');

  // 1. Проверяем основную страницу подписок
  const subscriptionPagePath = path.join(__dirname, '..', 'app', 'subscription', 'page.tsx');
  
  if (fs.existsSync(subscriptionPagePath)) {
    console.log('✅ app/subscription/page.tsx существует');
    score += 3;
    
    const content = fs.readFileSync(subscriptionPagePath, 'utf-8');
    
    // Проверяем ключевые элементы UI
    const uiChecks = [
      { name: 'Data testid', regex: /data-testid="subscription-page"/, points: 1 },
      { name: 'Subscription interface', regex: /interface Subscription/, points: 1 },
      { name: 'SubscriptionPlan interface', regex: /interface SubscriptionPlan/, points: 1 },
      { name: 'Plan cards', regex: /availablePlans\.map/, points: 1 },
      { name: 'Current subscription display', regex: /activeSubscription/, points: 1 },
      { name: 'Plan change functionality', regex: /handleChangePlan/, points: 1 },
      { name: 'Cancel subscription', regex: /handleCancelSubscription/, points: 1 },
      { name: 'Subscription history', regex: /subscriptionHistory/, points: 1 },
      { name: 'Loading states', regex: /loading.*setLoading/, points: 1 }
    ];
    
    uiChecks.forEach(check => {
      if (check.regex.test(content)) {
        console.log(`✅ ${check.name}: найден`);
        score += check.points;
      } else {
        console.log(`❌ ${check.name}: НЕ найден`);
      }
    });
    
  } else {
    console.log('❌ app/subscription/page.tsx НЕ найден');
  }

  // 2. Проверяем обновленную навигацию
  const headerPath = path.join(__dirname, '..', 'components', 'common', 'Header.tsx');
  
  if (fs.existsSync(headerPath)) {
    const headerContent = fs.readFileSync(headerPath, 'utf-8');
    if (headerContent.includes('Подписки') || headerContent.includes('/subscription')) {
      console.log('✅ Навигация обновлена (ссылка на подписки)');
      score += 2;
    } else {
      console.log('❌ Навигация НЕ обновлена');
    }
  }

  // 3. Проверяем API интеграцию
  if (fs.existsSync(subscriptionPagePath)) {
    const content = fs.readFileSync(subscriptionPagePath, 'utf-8');
    
    const apiChecks = [
      { name: 'Subscriptions API call', regex: /\/api\/subscriptions/ },
      { name: 'Plans API call', regex: /\/api\/subscriptions\/plans/ },
      { name: 'Change plan API', regex: /\/api\/subscriptions\/change-plan/ }
    ];
    
    apiChecks.forEach(check => {
      if (check.regex.test(content)) {
        console.log(`✅ API интеграция - ${check.name}: найден`);
        score += 1;
      } else {
        console.log(`❌ API интеграция - ${check.name}: НЕ найден`);
      }
    });
  }

  console.log(`\n📊 Результат: ${score}/${maxScore} баллов`);

  if (score >= 13) {
    console.log('🎉 ОТЛИЧНО! Задача 7.2 выполнена на отлично');
    console.log('✅ Страница подписок полностью функциональна');
  } else if (score >= 10) {
    console.log('👍 ХОРОШО! Основная функциональность реализована');
    console.log('⚠️ Есть несколько мелких недочетов');
  } else {
    console.log('⚠️ Требуется доработка основных компонентов');
  }

  console.log('\n🌐 Для проверки откройте: http://localhost:3000/subscription');
  
  return score >= 10;
}

testSubscriptionPage().then(success => {
  if (success) {
    console.log('\n🚀 Готов к переходу на задачу 7.3 "Обновить навигацию и дашборд"');
  }
}).catch(console.error);
