#!/usr/bin/env node

/**
 * Тест новой модели монетизации ESG-Lite
 * Проверяет корректность расчётов для всех тарифных планов
 */

require('dotenv').config();

console.log('🧪 Тестирование новой модели монетизации ESG-Lite...\n');

// Загружаем конфигурацию из .env
const config = {
  currency: process.env.SYSTEM_CURRENCY || 'RUB',
  lite: {
    minEmissions: parseInt(process.env.LITE_MIN_EMISSIONS || '50000'),
    maxEmissions: parseInt(process.env.LITE_MAX_EMISSIONS || '150000'),
    basePayment: parseInt(process.env.LITE_BASE_PAYMENT || '75000'),
    ratePerTon: parseFloat(process.env.LITE_RATE_PER_TON || '1.5'),
  },
  standard: {
    minEmissions: parseInt(process.env.STANDARD_MIN_EMISSIONS || '150000'),
    maxEmissions: parseInt(process.env.STANDARD_MAX_EMISSIONS || '1000000'),
    basePayment: parseInt(process.env.STANDARD_BASE_PAYMENT || '150000'),
    ratePerTon: parseFloat(process.env.STANDARD_RATE_PER_TON || '0.32'),
  },
  large: {
    minEmissions: parseInt(process.env.LARGE_MIN_EMISSIONS || '1000000'),
    maxEmissions: parseInt(process.env.LARGE_MAX_EMISSIONS || '3000000'),
    basePayment: parseInt(process.env.LARGE_BASE_PAYMENT || '250000'),
    ratePerTon: parseFloat(process.env.LARGE_RATE_PER_TON || '0.33'),
  },
  cbam: {
    annualFee: parseInt(process.env.CBAM_ANNUAL_FEE || '15000'),
    ratePerTon: parseInt(process.env.CBAM_RATE_PER_TON || '255'),
  },
  surge: {
    multiplier: parseFloat(process.env.SURGE_MULTIPLIER || '2.0'),
  }
};

console.log('📊 Конфигурация загружена:', {
  currency: config.currency,
  plans: {
    lite: `${config.lite.basePayment} ₽ + ${config.lite.ratePerTon} ₽/т`,
    standard: `${config.standard.basePayment} ₽ + ${config.standard.ratePerTon} ₽/т`,
    large: `${config.large.basePayment} ₽ + ${config.large.ratePerTon} ₽/т`
  }
});

// Функция расчёта стоимости
function calculatePrice(emissions, planConfig) {
  const basePrice = planConfig.basePayment;
  const variablePrice = Math.max(0, emissions - planConfig.minEmissions) * planConfig.ratePerTon;
  return basePrice + variablePrice;
}

// Функция определения плана
function determinePlan(emissions) {
  if (emissions < config.lite.minEmissions) return 'TRIAL';
  if (emissions <= config.lite.maxEmissions) return 'LITE';
  if (emissions <= config.standard.maxEmissions) return 'STANDARD';
  return 'LARGE';
}

console.log('\n🧮 Тесты расчёта стоимости:\n');

// Тест 1: План Лайт (минимум)
const liteMinPrice = calculatePrice(50000, config.lite);
console.log(`1. Лайт (50k т): ${liteMinPrice.toLocaleString()} ₽`);
console.log(`   Базовый: ${config.lite.basePayment} ₽, Переменная: ${(50000 - config.lite.minEmissions) * config.lite.ratePerTon} ₽`);

// Тест 2: План Лайт (максимум)
const liteMaxPrice = calculatePrice(150000, config.lite);
console.log(`2. Лайт (150k т): ${liteMaxPrice.toLocaleString()} ₽`);
console.log(`   Базовый: ${config.lite.basePayment} ₽, Переменная: ${(150000 - config.lite.minEmissions) * config.lite.ratePerTon} ₽`);

// Тест 3: План Стандарт (минимум)
const standardMinPrice = calculatePrice(150000, config.standard);
console.log(`3. Стандарт (150k т): ${standardMinPrice.toLocaleString()} ₽`);
console.log(`   Базовый: ${config.standard.basePayment} ₽, Переменная: ${(150000 - config.standard.minEmissions) * config.standard.ratePerTon} ₽`);

// Тест 4: План Стандарт (1 млн тонн - целевая стоимость)
const standardTargetPrice = calculatePrice(1000000, config.standard);
console.log(`4. Стандарт (1М т): ${standardTargetPrice.toLocaleString()} ₽ ⭐`);
console.log(`   Базовый: ${config.standard.basePayment} ₽, Переменная: ${(1000000 - config.standard.minEmissions) * config.standard.ratePerTon} ₽`);
console.log(`   🎯 Целевая стоимость: 420,000 ₽ (отклонение: ${Math.abs(standardTargetPrice - 420000).toLocaleString()} ₽)`);

// Тест 5: План Крупный (минимум)
const largeMinPrice = calculatePrice(1000000, config.large);
console.log(`5. Крупный (1М т): ${largeMinPrice.toLocaleString()} ₽`);
console.log(`   Базовый: ${config.large.basePayment} ₽, Переменная: ${(1000000 - config.large.minEmissions) * config.large.ratePerTon} ₽`);

// Тест 6: План Крупный (максимум)
const largeMaxPrice = calculatePrice(3000000, config.large);
console.log(`6. Крупный (3М т): ${largeMaxPrice.toLocaleString()} ₽`);
console.log(`   Базовый: ${config.large.basePayment} ₽, Переменная: ${(3000000 - config.large.minEmissions) * config.large.ratePerTon} ₽`);

// Тест 7: CBAM модуль
console.log('\n🌍 Тесты CBAM модуля:\n');
const cbamPrice = config.cbam.annualFee + (30000 * config.cbam.ratePerTon);
console.log(`7. CBAM (30k т): ${cbamPrice.toLocaleString()} ₽`);
console.log(`   Годовая плата: ${config.cbam.annualFee} ₽, За тонну: ${30000 * config.cbam.ratePerTon} ₽`);

// Тест 8: Определение планов
console.log('\n📋 Тесты определения планов:\n');
const testEmissions = [30000, 75000, 150000, 500000, 1000000, 2000000];
testEmissions.forEach(emissions => {
  const plan = determinePlan(emissions);
  console.log(`${emissions.toLocaleString()} т → План: ${plan}`);
});

// Тест 9: Сверхпиковый период
console.log('\n⚡ Тест сверхпикового периода (×2 в июне):\n');
const normalPrice = calculatePrice(500000, config.standard);
const surgePrice = normalPrice * config.surge.multiplier;
console.log(`Стандарт (500k т):`);
console.log(`  Обычная цена: ${normalPrice.toLocaleString()} ₽`);
console.log(`  Сверхпиковая: ${surgePrice.toLocaleString()} ₽ (×${config.surge.multiplier})`);

console.log('\n✅ Все тесты завершены!');
console.log('\n💰 Резюме модели монетизации:');
console.log(`• Лайт: ${config.lite.basePayment.toLocaleString()} ₽ + ${config.lite.ratePerTon} ₽/т (50k-150k т)`);
console.log(`• Стандарт: ${config.standard.basePayment.toLocaleString()} ₽ + ${config.standard.ratePerTon} ₽/т (150k-1М т)`);
console.log(`• Крупный: ${config.large.basePayment.toLocaleString()} ₽ + ${config.large.ratePerTon} ₽/т (1М-3М т)`);
console.log(`• CBAM: ${config.cbam.annualFee.toLocaleString()} ₽/год + ${config.cbam.ratePerTon} ₽/т`);
console.log(`• Сверхпиковый период: ×${config.surge.multiplier} (15-30 июня)`);
