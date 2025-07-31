#!/usr/bin/env node
/**
 * Скрипт обновления коэффициентов выбросов 296-ФЗ
 * Обновляет коэффициенты согласно актуальным нормативам IPCC
 * 
 * Использование:
 * node scripts/update-emission-factors.js
 * node scripts/update-emission-factors.js --check-only  # только проверка без обновления
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Актуальные коэффициенты IPCC AR6 (2025)
const CURRENT_COEFFICIENTS = {
  CO2: 1,      // неизменно
  CH4: 28,     // было 25 в AR4, теперь 28 в AR6
  N2O: 265,    // было 298 в AR4, теперь 265 в AR6
  HFC: 1300,   // средний для HFC-134a (наиболее распространенный)
  PFC: 6630,   // średний для PFC-14 (CF4, наиболее распространенный)
  SF6: 23500   // было 22800 в AR4, теперь 23500 в AR6
};

const VERSION_INFO = {
  version: 'AR6-2025',
  name: 'IPCC AR6 Коэффициенты 2025',
  description: 'Актуальные коэффициенты IPCC AR6 согласно Распоряжению Правительства РФ от 04.04.2025 № 805-р',
  effectiveFrom: '2025-01-01',
  source: 'IPCC Sixth Assessment Report (2021) + РФ 805-р',
  updatedAt: new Date().toISOString()
};

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function checkCurrentCoefficients() {
  log('🔍 Проверка текущих коэффициентов...');
  
  const calculatorPath = path.join(__dirname, '..', 'lib', 'emission-calculator.ts');
  
  if (!fs.existsSync(calculatorPath)) {
    log('❌ Файл emission-calculator.ts не найден');
    return false;
  }
  
  const content = fs.readFileSync(calculatorPath, 'utf8');
  
  // Проверяем актуальные коэффициенты в GWP_VALUES_2025
  const gwp2025Match = content.match(/GWP_VALUES_2025\s*=\s*{[^}]*}/s);
  
  if (!gwp2025Match) {
    log('⚠️ Не удалось найти GWP_VALUES_2025 в файле');
    return false;
  }
  
  const gwp2025Block = gwp2025Match[0];
  const ch4Match = gwp2025Block.match(/CH4:\s*(\d+)/);
  const n2oMatch = gwp2025Block.match(/N2O:\s*(\d+)/);
  const sf6Match = gwp2025Block.match(/SF6:\s*(\d+)/);
  
  if (!ch4Match || !n2oMatch || !sf6Match) {
    log('⚠️ Не удалось найти коэффициенты в GWP_VALUES_2025');
    return false;
  }
  
  const currentCH4 = parseInt(ch4Match[1]);
  const currentN2O = parseInt(n2oMatch[1]);
  const currentSF6 = parseInt(sf6Match[1]);
  
  log(`Текущие коэффициенты: CH4=${currentCH4}, N2O=${currentN2O}, SF6=${currentSF6}`);
  log(`Требуемые коэффициенты: CH4=${CURRENT_COEFFICIENTS.CH4}, N2O=${CURRENT_COEFFICIENTS.N2O}, SF6=${CURRENT_COEFFICIENTS.SF6}`);
  
  const isUpToDate = (
    currentCH4 === CURRENT_COEFFICIENTS.CH4 &&
    currentN2O === CURRENT_COEFFICIENTS.N2O &&
    currentSF6 === CURRENT_COEFFICIENTS.SF6
  );
  
  if (isUpToDate) {
    log('✅ Коэффициенты уже актуальны');
    return true;
  } else {
    log('⚠️ Коэффициенты требуют обновления');
    return false;
  }
}

function updateCoefficients() {
  log('🔄 Обновление коэффициентов...');
  
  const calculatorPath = path.join(__dirname, '..', 'lib', 'emission-calculator.ts');
  let content = fs.readFileSync(calculatorPath, 'utf8');
  
  // Обновляем коэффициенты в GWP_VALUES_2025
  content = content.replace(
    /(GWP_VALUES_2025\s*=\s*{[^}]*CH4:\s*)(\d+)/,
    `$1${CURRENT_COEFFICIENTS.CH4}`
  );
  
  content = content.replace(
    /(GWP_VALUES_2025\s*=\s*{[^}]*N2O:\s*)(\d+)/,
    `$1${CURRENT_COEFFICIENTS.N2O}`
  );
  
  content = content.replace(
    /(GWP_VALUES_2025\s*=\s*{[^}]*SF6:\s*)(\d+)/,
    `$1${CURRENT_COEFFICIENTS.SF6}`
  );
  
  // Добавляем комментарий с датой обновления
  const dateComment = `// Обновлено ${new Date().toLocaleDateString('ru-RU')} согласно ${VERSION_INFO.source}`;
  content = content.replace(
    /(export const GWP_VALUES_2025 = {)/,
    `${dateComment}\n$1`
  );
  
  fs.writeFileSync(calculatorPath, content, 'utf8');
  log('✅ Коэффициенты обновлены в emission-calculator.ts');
}

function createUpdateLog() {
  log('📝 Создание лога обновления...');
  
  const logPath = path.join(__dirname, '..', 'logs', 'emission-factors-updates.json');
  const logsDir = path.dirname(logPath);
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  let logs = [];
  if (fs.existsSync(logPath)) {
    try {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch (e) {
      log('⚠️ Не удалось прочитать существующий лог, создается новый');
    }
  }
  
  logs.push({
    ...VERSION_INFO,
    coefficients: CURRENT_COEFFICIENTS,
    timestamp: new Date().toISOString(),
    method: 'script'
  });
  
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
  log(`✅ Лог обновления сохранен: ${logPath}`);
}

function generateMigrationSQL() {
  log('🗃️ Генерация SQL для обновления базы данных...');
  
  const sqlPath = path.join(__dirname, '..', 'sql', 'update-emission-factors-2025.sql');
  const sqlDir = path.dirname(sqlPath);
  
  if (!fs.existsSync(sqlDir)) {
    fs.mkdirSync(sqlDir, { recursive: true });
  }
  
  const sql = `-- Обновление коэффициентов выбросов согласно IPCC AR6 (2025)
-- Создано автоматически ${new Date().toISOString()}

-- Деактивируем старые коэффициенты
UPDATE emission_factors 
SET "isActive" = false, "effectiveTo" = '2024-12-31T23:59:59.000Z'
WHERE "isActive" = true;

-- Добавляем новые актуальные коэффициенты
INSERT INTO emission_factors (
  "version", 
  "name", 
  "description", 
  "effectiveFrom", 
  "isActive", 
  "source", 
  "coefficients"
) VALUES (
  '${VERSION_INFO.version}',
  '${VERSION_INFO.name}',
  '${VERSION_INFO.description}',
  '${VERSION_INFO.effectiveFrom}T00:00:00.000Z',
  true,
  '${VERSION_INFO.source}',
  '${JSON.stringify(CURRENT_COEFFICIENTS)}'
) ON CONFLICT ("version") DO UPDATE SET
  "coefficients" = EXCLUDED."coefficients",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Проверка результата
SELECT * FROM emission_factors WHERE "isActive" = true ORDER BY "effectiveFrom" DESC LIMIT 1;
`;
  
  fs.writeFileSync(sqlPath, sql, 'utf8');
  log(`✅ SQL скрипт сохранен: ${sqlPath}`);
}

function showHelp() {
  console.log(`
📊 Скрипт обновления коэффициентов выбросов 296-ФЗ

Использование:
  node scripts/update-emission-factors.js           # Полное обновление
  node scripts/update-emission-factors.js --check   # Только проверка
  node scripts/update-emission-factors.js --help    # Справка

Что делает скрипт:
  ✅ Проверяет актуальность коэффициентов в коде
  ✅ Обновляет файл lib/emission-calculator.ts
  ✅ Создает лог изменений
  ✅ Генерирует SQL для обновления БД

Актуальные коэффициенты IPCC AR6 (2025):
  CO2: 1 (неизменно)
  CH4: 28 (было 25)
  N2O: 265 (было 298)  
  HFC: 1300 (средний)
  PFC: 6630 (средний)
  SF6: 23500 (было 22800)

Источник: Распоряжение Правительства РФ от 04.04.2025 № 805-р
`);
}

// Основная логика
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  log('🚀 Запуск скрипта обновления коэффициентов 296-ФЗ');
  log(`Версия: ${VERSION_INFO.version}`);
  log(`Источник: ${VERSION_INFO.source}`);
  
  const isCheckOnly = args.includes('--check') || args.includes('--check-only');
  
  const isUpToDate = checkCurrentCoefficients();
  
  if (isCheckOnly) {
    if (isUpToDate) {
      log('✅ Проверка завершена: коэффициенты актуальны');
      process.exit(0);
    } else {
      log('⚠️ Проверка завершена: требуется обновление');
      process.exit(1);
    }
  }
  
  if (isUpToDate) {
    log('✅ Обновление не требуется');
    return;
  }
  
  try {
    updateCoefficients();
    createUpdateLog();
    generateMigrationSQL();
    
    log('🎉 Обновление коэффициентов завершено успешно!');
    log('📋 Следующие шаги:');
    log('   1. Проверьте изменения в lib/emission-calculator.ts');
    log('   2. Примените SQL скрипт к базе данных при деплое');
    log('   3. Перезапустите приложение для применения изменений');
    
  } catch (error) {
    log(`❌ Ошибка при обновлении: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
