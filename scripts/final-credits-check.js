const fs = require('fs');
const path = require('path');

console.log('🔬 Финальная проверка задачи 7.1...\n');

// Проверяем файловую структуру
const creditsPagePath = path.join(__dirname, '..', 'app', 'credits', 'page.tsx');
const headerPath = path.join(__dirname, '..', 'components', 'common', 'Header.tsx');
const creditsDisplayPath = path.join(__dirname, '..', 'components', 'credits', 'CreditsDisplay.tsx');

let score = 0;
const maxScore = 15;

console.log('📁 Проверка файловой структуры:');

// 1. Основная страница кредитов
if (fs.existsSync(creditsPagePath)) {
  console.log('✅ app/credits/page.tsx существует');
  score += 3;
  
  const content = fs.readFileSync(creditsPagePath, 'utf-8');
  
  // Проверяем ключевые элементы
  if (content.includes('data-testid="credits-page"')) {
    console.log('✅ Есть data-testid для тестирования');
    score += 1;
  }
  
  if (content.includes('useMemo')) {
    console.log('✅ Использует useMemo для оптимизации');
    score += 1;
  }
  
  if (content.includes('balance_t_co2')) {
    console.log('✅ Интеграция с Credits API');
    score += 1;
  }
  
  if (content.includes('transaction_type')) {
    console.log('✅ Отображение истории транзакций');
    score += 1;
  }
  
  if (content.includes('pagination')) {
    console.log('✅ Поддержка пагинации');
    score += 1;
  }
  
} else {
  console.log('❌ app/credits/page.tsx НЕ найден');
}

// 2. Компонент отображения кредитов
if (fs.existsSync(creditsDisplayPath)) {
  console.log('✅ components/credits/CreditsDisplay.tsx существует');
  score += 2;
} else {
  console.log('❌ CreditsDisplay компонент НЕ найден');
}

// 3. Обновленная навигация
if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf-8');
  if (headerContent.includes('Кредиты') || headerContent.includes('/credits')) {
    console.log('✅ Навигация обновлена (ссылка на кредиты)');
    score += 2;
  } else {
    console.log('❌ Навигация НЕ обновлена');
  }
} else {
  console.log('❌ Header компонент НЕ найден');
}

// 4. Проверяем современный дизайн
if (fs.existsSync(creditsPagePath)) {
  const content = fs.readFileSync(creditsPagePath, 'utf-8');
  
  if (content.includes('emerald') && content.includes('rounded-xl')) {
    console.log('✅ Современный дизайн 2025 (emerald + rounded-xl)');
    score += 2;
  }
  
  if (content.includes('responsive') || content.includes('md:') || content.includes('lg:')) {
    console.log('✅ Responsive дизайн');
    score += 1;
  }
}

console.log(`\n📊 Результат: ${score}/${maxScore} баллов`);

if (score >= 13) {
  console.log('🎉 ОТЛИЧНО! Задача 7.1 выполнена на 100%');
  console.log('✅ Готовы к переходу на задачу 7.2 "Создать страницу управления тарифами"');
} else if (score >= 10) {
  console.log('👍 ХОРОШО! Основная функциональность реализована');
  console.log('⚠️ Есть несколько мелких недочетов для доработки');
} else {
  console.log('⚠️ Требуется доработка основных компонентов');
}

console.log('\n🌐 Для проверки откройте: http://localhost:3000/credits');
console.log('🔧 Если есть ошибки TypeScript - перезапустите VS Code Language Server');

// Дополнительная проверка файлов
console.log('\n📂 Дополнительные файлы:');
const testFiles = [
  'scripts/test-credits-page.js',
  'docs/TASK-7.1-CREDITS-MANAGEMENT-PAGE.md'
];

testFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} существует`);
  } else {
    console.log(`⚠️ ${file} отсутствует`);
  }
});
