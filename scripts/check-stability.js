#!/usr/bin/env node

console.log('🔍 Проверка стабильности страницы кредитов...\n');

let rebuildCount = 0;
let lastRebuild = Date.now();

// Слушаем stderr для отслеживания Fast Refresh rebuilding
process.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.includes('[Fast Refresh] rebuilding')) {
    rebuildCount++;
    const now = Date.now();
    const timeSince = now - lastRebuild;
    console.log(`🔄 Rebuild #${rebuildCount} (через ${timeSince}ms)`);
    lastRebuild = now;
    
    if (rebuildCount > 5) {
      console.log('❌ Обнаружены частые перестроения! Возможна проблема с React hooks.');
      process.exit(1);
    }
  }
});

// Ждем 10 секунд и проверяем количество rebuilds
setTimeout(() => {
  if (rebuildCount === 0) {
    console.log('✅ Страница стабильна - нет нежелательных перестроений!');
  } else if (rebuildCount <= 2) {
    console.log(`⚠️ Обнаружено ${rebuildCount} перестроение(й) - возможно нормально при первой загрузке`);
  } else {
    console.log(`❌ Слишком много перестроений: ${rebuildCount}`);
  }
  process.exit(0);
}, 10000);

console.log('Ожидание 10 секунд для проверки стабильности...');
console.log('Откройте http://localhost:3000/credits в браузере');
