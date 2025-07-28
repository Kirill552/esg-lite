// Быстрый тест проверки страницы кредитов
console.log('🧪 Быстрая проверка страницы кредитов...\n');

async function quickTest() {
  try {
    // Проверяем структуру файла
    const fs = require('fs');
    const path = require('path');
    
    const pagePath = path.join(__dirname, '..', 'app', 'credits', 'page.tsx');
    
    if (fs.existsSync(pagePath)) {
      console.log('✅ Файл страницы существует');
      
      const content = fs.readFileSync(pagePath, 'utf-8');
      
      // Проверяем ключевые элементы
      const checks = [
        { name: 'Export default', regex: /export default function/ },
        { name: 'Data testid', regex: /data-testid="credits-page"/ },
        { name: 'UseCallback imports', regex: /useCallback, useMemo/ },
        { name: 'No problematic useEffect', regex: /useEffect.*fetchBalance.*fetchTransactions/ },
        { name: 'Proper dependency arrays', regex: /\[\]|\[organizationId\]|\[filter\]/ }
      ];
      
      checks.forEach(check => {
        if (check.regex.test(content)) {
          console.log(`✅ ${check.name}: найден`);
        } else {
          console.log(`❌ ${check.name}: НЕ найден`);
        }
      });
      
      // Проверяем количество useEffect
      const useEffectMatches = content.match(/useEffect/g);
      console.log(`📊 Количество useEffect: ${useEffectMatches ? useEffectMatches.length : 0}`);
      
      // Проверяем наличие проблемных паттернов
      const problematicPatterns = [
        { name: 'Infinite dependency loops', regex: /fetchBalance.*fetchTransactions.*\]/ },
        { name: 'Missing dependency array', regex: /useEffect\([^}]+\);/ }
      ];
      
      problematicPatterns.forEach(pattern => {
        if (pattern.regex.test(content)) {
          console.log(`⚠️ Найден проблемный паттерн: ${pattern.name}`);
        }
      });
      
    } else {
      console.log('❌ Файл страницы НЕ найден!');
    }
    
    console.log('\n🎯 Проверка завершена!');
    console.log('👀 Откройте http://localhost:3000/credits в браузере для визуальной проверки');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

quickTest();
