/**
 * Monetization Configuration Service
 * Новая модель монетизации ESG-Lite 2025 (обновлённая)
 * 
 * Основа новой тарифной сетки с базовыми платежами:
 * - Пробный (14 дней): 1 отчёт ≤ 200 МБ
 * - Лайт (50k-150k т): 50 000 ₽ базовый + 1,0 ₽/т
 * - Стандарт (150k-1М т): 120 000 ₽ базовый + 0,28 ₽/т
 * - Крупный (1М-3М т): 175 000 ₽ базовый + 0,18 ₽/т
 * - CBAM: 15 000 ₽/год + 255 ₽/т
 * - Сверхпиковый период отменён (коэффициент ×1.0)
 */

export interface MonetizationConfig {
  // Пробный план
  trial: {
    durationDays: number;
    maxReports: number;
    maxSizeMB: number;
  };
  
  // План "Лайт"
  lite: {
    minEmissions: number;
    maxEmissions: number;
    basePayment: number;
    ratePerTon: number;
  };
  
  // План "Стандарт"
  standard: {
    minEmissions: number;
    maxEmissions: number;
    basePayment: number;
    ratePerTon: number;
  };
  
  // План "Крупный"
  large: {
    minEmissions: number;
    maxEmissions: number;
    basePayment: number;
    ratePerTon: number;
  };
  
  // План "Индивидуальный"
  enterprise: {
    minEmissions: number;
    priceCap: number;
    pricing: string;
  };
  
  // Модуль CBAM
  cbam: {
    annualFee: number;
    ratePerTon: number;
  };
  
  // Сверхпиковый период
  surge: {
    multiplier: number;
    startDay: number;
    startMonth: number;
    endDay: number;
    endMonth: number;
  };
  
  // Общие настройки
  currency: string;
}

export interface EmissionRange {
  min: number;
  max: number;
  planType: 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE';
}

export interface PricingCalculation {
  planType: 'TRIAL' | 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE';
  basePrice: number;
  surgeMultiplier: number;
  finalPrice: number;
  emissions: number;
  currency: string;
  period: 'YEAR' | 'TRIAL';
  hasCbamAddon?: boolean;
  cbamPrice?: number;
}

/**
 * Загружает конфигурацию монетизации из переменных окружения
 */
export function loadMonetizationConfig(): MonetizationConfig {
  return {
    trial: {
      durationDays: parseInt(process.env.TRIAL_DURATION_DAYS || '14'),
      maxReports: parseInt(process.env.TRIAL_MAX_REPORTS || '1'),
      maxSizeMB: parseInt(process.env.TRIAL_MAX_SIZE_MB || '200'),
    },
    lite: {
      minEmissions: parseInt(process.env.LITE_MIN_EMISSIONS || '50000'),
      maxEmissions: parseInt(process.env.LITE_MAX_EMISSIONS || '150000'),
      basePayment: parseInt(process.env.LITE_BASE_PAYMENT || '50000'),
      ratePerTon: parseFloat(process.env.LITE_RATE_PER_TON || '1.0'),
    },
    standard: {
      minEmissions: parseInt(process.env.STANDARD_MIN_EMISSIONS || '150000'),
      maxEmissions: parseInt(process.env.STANDARD_MAX_EMISSIONS || '1000000'),
      basePayment: parseInt(process.env.STANDARD_BASE_PAYMENT || '120000'),
      ratePerTon: parseFloat(process.env.STANDARD_RATE_PER_TON || '0.28'),
    },
    large: {
      minEmissions: parseInt(process.env.LARGE_MIN_EMISSIONS || '1000000'),
      maxEmissions: parseInt(process.env.LARGE_MAX_EMISSIONS || '3000000'),
      basePayment: parseInt(process.env.LARGE_BASE_PAYMENT || '175000'),
      ratePerTon: parseFloat(process.env.LARGE_RATE_PER_TON || '0.18'),
    },
    enterprise: {
      minEmissions: parseInt(process.env.ENTERPRISE_MIN_EMISSIONS || '3000000'),
      priceCap: parseInt(process.env.ENTERPRISE_PRICE_CAP_RUB || '480000'),
      pricing: process.env.ENTERPRISE_PRICING || 'индивидуально',
    },
    cbam: {
      annualFee: parseInt(process.env.CBAM_ANNUAL_FEE || '15000'),
      ratePerTon: parseFloat(process.env.CBAM_RATE_PER_TON || '255'),
    },
    surge: {
      multiplier: parseFloat(process.env.SURGE_MULTIPLIER || '1.0'),
      startDay: parseInt(process.env.SURGE_START_DAY || '15'),
      startMonth: parseInt(process.env.SURGE_START_MONTH || '6'),
      endDay: parseInt(process.env.SURGE_END_DAY || '30'),
      endMonth: parseInt(process.env.SURGE_END_MONTH || '6'),
    },
    currency: process.env.SYSTEM_CURRENCY || 'RUB',
  };
}

/**
 * Определяет план тарификации на основе годовых выбросов
 */
export function determinePlanByEmissions(annualEmissions: number): 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE' {
  const config = loadMonetizationConfig();
  
  if (annualEmissions >= config.lite.minEmissions && annualEmissions <= config.lite.maxEmissions) {
    return 'LITE';
  }
  
  if (annualEmissions >= config.standard.minEmissions && annualEmissions <= config.standard.maxEmissions) {
    return 'STANDARD';
  }
  
  if (annualEmissions >= config.large.minEmissions && annualEmissions <= config.large.maxEmissions) {
    return 'LARGE';
  }
  
  if (annualEmissions >= config.enterprise.minEmissions) {
    return 'ENTERPRISE';
  }
  
  // По умолчанию для объёмов вне диапазонов
  if (annualEmissions < config.lite.minEmissions) {
    return 'LITE'; // Минимальный план для небольших объёмов
  }
  
  return 'LARGE'; // Для неопределённых случаев
}

/**
 * Проверяет, активен ли сверхпиковый период
 */
export function isSurgePeriodActive(date: Date = new Date()): boolean {
  const config = loadMonetizationConfig();
  const month = date.getMonth() + 1; // getMonth() возвращает 0-11
  const day = date.getDate();
  
  return (
    month === config.surge.startMonth &&
    day >= config.surge.startDay &&
    day <= config.surge.endDay
  );
}

/**
 * Рассчитывает стоимость тарифа с учётом базового платежа и ставки за тонну
 */
export function calculatePricing(
  annualEmissions: number,
  hasCbamAddon: boolean = false,
  date: Date = new Date()
): PricingCalculation {
  const config = loadMonetizationConfig();
  const planType = determinePlanByEmissions(annualEmissions);
  const isSurge = isSurgePeriodActive(date);
  const surgeMultiplier = isSurge ? config.surge.multiplier : 1.0;
  
  let basePrice = 0;
  
  switch (planType) {
    case 'LITE':
      // Фиксированный платёж + плата за ВСЕ тонны
      basePrice = config.lite.basePayment + (annualEmissions * config.lite.ratePerTon);
      break;
    case 'STANDARD':
      // Фиксированный платёж + плата за ВСЕ тонны
      basePrice = config.standard.basePayment + (annualEmissions * config.standard.ratePerTon);
      break;
    case 'LARGE':
      // Фиксированный платёж + плата за ВСЕ тонны
      basePrice = config.large.basePayment + (annualEmissions * config.large.ratePerTon);
      break;
    case 'ENTERPRISE':
      // Индивидуальный тариф с потолком цены
      basePrice = config.enterprise.priceCap;
      break;
  }
  
  const finalPrice = basePrice * surgeMultiplier;
  
  const result: PricingCalculation = {
    planType,
    basePrice,
    surgeMultiplier,
    finalPrice,
    emissions: annualEmissions,
    currency: config.currency,
    period: 'YEAR',
  };
  
  // Добавляем CBAM если требуется
  if (hasCbamAddon) {
    result.hasCbamAddon = true;
    result.cbamPrice = config.cbam.annualFee; // Базовая плата за модуль
  }
  
  return result;
}

/**
 * Рассчитывает стоимость CBAM за тонны выбросов
 */
export function calculateCbamEmissionCost(emissionTons: number, date: Date = new Date()): number {
  const config = loadMonetizationConfig();
  const isSurge = isSurgePeriodActive(date);
  const surgeMultiplier = isSurge ? config.surge.multiplier : 1.0;
  
  return emissionTons * config.cbam.ratePerTon * surgeMultiplier;
}

/**
 * Получает диапазоны выбросов для всех планов
 */
export function getEmissionRanges(): EmissionRange[] {
  const config = loadMonetizationConfig();
  
  return [
    {
      min: config.lite.minEmissions,
      max: config.lite.maxEmissions,
      planType: 'LITE',
    },
    {
      min: config.standard.minEmissions,
      max: config.standard.maxEmissions,
      planType: 'STANDARD',
    },
    {
      min: config.large.minEmissions,
      max: config.large.maxEmissions,
      planType: 'LARGE',
    },
  ];
}

/**
 * Получает детальную информацию о плане тарификации
 */
export function getPlanDetails(planType: 'LITE' | 'STANDARD' | 'LARGE') {
  const config = loadMonetizationConfig();
  
  switch (planType) {
    case 'LITE':
      return {
        name: 'Лайт',
        minEmissions: config.lite.minEmissions,
        maxEmissions: config.lite.maxEmissions,
        basePayment: config.lite.basePayment,
        ratePerTon: config.lite.ratePerTon,
        description: `${config.lite.minEmissions.toLocaleString()} - ${config.lite.maxEmissions.toLocaleString()} т CO₂`
      };
    case 'STANDARD':
      return {
        name: 'Стандарт',
        minEmissions: config.standard.minEmissions,
        maxEmissions: config.standard.maxEmissions,
        basePayment: config.standard.basePayment,
        ratePerTon: config.standard.ratePerTon,
        description: `${config.standard.minEmissions.toLocaleString()} - ${config.standard.maxEmissions.toLocaleString()} т CO₂`
      };
    case 'LARGE':
      return {
        name: 'Крупный',
        minEmissions: config.large.minEmissions,
        maxEmissions: config.large.maxEmissions,
        basePayment: config.large.basePayment,
        ratePerTon: config.large.ratePerTon,
        description: `${config.large.minEmissions.toLocaleString()} - ${config.large.maxEmissions.toLocaleString()} т CO₂`
      };
  }
}

/**
 * Рассчитывает примерную стоимость для отображения в UI
 */
export function calculateExamplePricing(planType: 'LITE' | 'STANDARD' | 'LARGE') {
  const config = loadMonetizationConfig();
  const plan = getPlanDetails(planType);
  
  // Берём минимальное значение диапазона для примера
  const exampleEmissions = plan.minEmissions;
  return calculatePricing(exampleEmissions);
}

/**
 * Форматирует цену для отображения
 */
export function formatPrice(price: number, currency: string = 'RUB'): string {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(price);
}

/**
 * Экспортируем готовую конфигурацию
 */
export const monetizationConfig = loadMonetizationConfig();
