// ESG-Lite Emission Calculator
// Based on Russian Federation 296-FZ Law and latest 2025 emission factors

export interface EmissionFactors {
  electricity: number; // кг CO2/кВт·ч
  naturalGas: number; // кг CO2/тыс. м³  
  diesel: number; // кг CO2/л
  gasoline: number; // кг CO2/л
  coal: number; // кг CO2/кг
  heatEnergy: number; // кг CO2/Гкал
}

// Актуальные коэффициенты эмиссии для России на 2025 год
// Источник: Приказ Минприроды России, 296-ФЗ, методические рекомендации 2025
export const EMISSION_FACTORS_2025: EmissionFactors = {
  // Электроэнергия (средний фактор по России с учетом структуры генерации)
  electricity: 0.4554, // кг CO2/кВт·ч (обновлено на 2025 год)
  
  // Природный газ (с учетом теплотворной способности)
  naturalGas: 1850, // кг CO2/тыс. м³
  
  // Дизельное топливо
  diesel: 2.68, // кг CO2/л
  
  // Автомобильный бензин  
  gasoline: 2.31, // кг CO2/л
  
  // Каменный уголь (средний показатель)
  coal: 2.33, // кг CO2/кг
  
  // Тепловая энергия (централизованное теплоснабжение)
  heatEnergy: 164.2 // кг CO2/Гкал
};

export interface EsgMetrics {
  // Энергопотребление
  electricityConsumption?: number; // кВт·ч
  naturalGasConsumption?: number; // тыс. м³
  heatConsumption?: number; // Гкал
  
  // Транспорт  
  dieselConsumption?: number; // литры
  gasolineConsumption?: number; // литры
  
  // Производство
  coalConsumption?: number; // кг
  
  // Отходы
  wasteGenerated?: number; // тонны
  
  // Вода
  waterConsumption?: number; // м³
}

export interface EmissionResult {
  totalEmissions: number; // тонны CO2-экв
  breakdown: {
    electricity: number;
    naturalGas: number;
    transport: number;
    heating: number;
    coal: number;
    waste: number;
  };
  
  // Дополнительные метрики
  intensity: {
    perRevenue?: number; // кг CO2/тыс. руб.
    perEmployee?: number; // кг CO2/чел.
    perUnit?: number; // кг CO2/ед. продукции
  };
  
  // Классификация по уровням (Scope)
  scope1: number; // Прямые выбросы
  scope2: number; // Косвенные выбросы (электричество, тепло)
  scope3?: number; // Прочие косвенные выбросы
}

export class EmissionCalculator {
  private factors: EmissionFactors;
  
  constructor(customFactors?: Partial<EmissionFactors>) {
    this.factors = { ...EMISSION_FACTORS_2025, ...customFactors };
  }
  
  /**
   * Основной метод расчета выбросов парниковых газов
   */
  calculateEmissions(metrics: EsgMetrics): EmissionResult {
    const breakdown = {
      electricity: this.calculateElectricityEmissions(metrics.electricityConsumption || 0),
      naturalGas: this.calculateGasEmissions(metrics.naturalGasConsumption || 0),
      transport: this.calculateTransportEmissions(
        metrics.dieselConsumption || 0,
        metrics.gasolineConsumption || 0
      ),
      heating: this.calculateHeatingEmissions(metrics.heatConsumption || 0),
      coal: this.calculateCoalEmissions(metrics.coalConsumption || 0),
      waste: this.calculateWasteEmissions(metrics.wasteGenerated || 0)
    };
    
    const totalEmissions = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    
    // Классификация по Scope согласно международным стандартам
    const scope1 = breakdown.naturalGas + breakdown.transport + breakdown.coal;
    const scope2 = breakdown.electricity + breakdown.heating;
    const scope3 = breakdown.waste; // Упрощенная классификация
    
    return {
      totalEmissions: totalEmissions / 1000, // Конвертация в тонны
      breakdown,
      intensity: {},
      scope1: scope1 / 1000,
      scope2: scope2 / 1000,
      scope3: scope3 / 1000
    };
  }
  
  private calculateElectricityEmissions(consumption: number): number {
    return consumption * this.factors.electricity;
  }
  
  private calculateGasEmissions(consumption: number): number {
    return consumption * this.factors.naturalGas;
  }
  
  private calculateTransportEmissions(diesel: number, gasoline: number): number {
    return (diesel * this.factors.diesel) + (gasoline * this.factors.gasoline);
  }
  
  private calculateHeatingEmissions(consumption: number): number {
    return consumption * this.factors.heatEnergy;
  }
  
  private calculateCoalEmissions(consumption: number): number {
    return (consumption / 1000) * this.factors.coal * 1000; // Конвертация кг в тонны
  }
  
  private calculateWasteEmissions(waste: number): number {
    // Упрощенный расчет: 0,5 тонны CO2 на тонну отходов
    return waste * 500;
  }
  
  /**
   * Извлечение ESG-метрик из текста OCR
   */
  extractMetricsFromText(ocrText: string): EsgMetrics {
    const metrics: EsgMetrics = {};
    
    // Регулярные выражения для поиска метрик
    const patterns = {
      electricity: /(?:электроэнергия|электричество|кВт[·\s]*ч|kwh)[:\s]*([0-9,.\s]+)/gi,
      naturalGas: /(?:газ|м3|куб)[:\s]*([0-9,.\s]+)/gi,
      diesel: /(?:дизель|дизтопливо|солярка)[:\s]*([0-9,.\s]+)/gi,
      gasoline: /(?:бензин|аи-92|аи-95)[:\s]*([0-9,.\s]+)/gi,
      heat: /(?:тепло|гкал|отопление)[:\s]*([0-9,.\s]+)/gi,
      waste: /(?:отходы|мусор|тонн)[:\s]*([0-9,.\s]+)/gi,
      water: /(?:вода|водопотребление|м3)[:\s]*([0-9,.\s]+)/gi
    };
    
    // Извлечение значений
    Object.entries(patterns).forEach(([key, regex]) => {
      const matches = Array.from(ocrText.matchAll(regex));
      if (matches.length > 0) {
        const value = this.parseNumber(matches[0][1]);
        switch (key) {
          case 'electricity':
            metrics.electricityConsumption = value;
            break;
          case 'naturalGas':
            metrics.naturalGasConsumption = value / 1000; // Конвертация в тыс. м³
            break;
          case 'diesel':
            metrics.dieselConsumption = value;
            break;
          case 'gasoline':
            metrics.gasolineConsumption = value;
            break;
          case 'heat':
            metrics.heatConsumption = value;
            break;
          case 'waste':
            metrics.wasteGenerated = value;
            break;
          case 'water':
            metrics.waterConsumption = value;
            break;
        }
      }
    });
    
    return metrics;
  }
  
  private parseNumber(text: string): number {
    // Удаляем пробелы и заменяем запятые на точки
    const cleaned = text.replace(/[\s,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  
  /**
   * Генерация отчета в соответствии с 296-ФЗ
   */
  generateReport(metrics: EsgMetrics, organizationInfo?: any): string {
    const result = this.calculateEmissions(metrics);
    const date = new Date().toLocaleDateString('ru-RU');
    
    return `
ОТЧЕТ О ВЫБРОСАХ ПАРНИКОВЫХ ГАЗОВ
В соответствии с Федеральным законом № 296-ФЗ от 02.07.2021

Дата составления: ${date}
Отчетный период: ${new Date().getFullYear()} год

ОБЩИЕ ПОКАЗАТЕЛИ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Общий объем выбросов: ${result.totalEmissions.toFixed(2)} тонн CO₂-экв

ДЕТАЛИЗАЦИЯ ПО ИСТОЧНИКАМ:
• Электроэнергия: ${(result.breakdown.electricity/1000).toFixed(2)} т CO₂-экв
• Природный газ: ${(result.breakdown.naturalGas/1000).toFixed(2)} т CO₂-экв  
• Транспорт: ${(result.breakdown.transport/1000).toFixed(2)} т CO₂-экв
• Теплоснабжение: ${(result.breakdown.heating/1000).toFixed(2)} т CO₂-экв
• Уголь: ${(result.breakdown.coal/1000).toFixed(2)} т CO₂-экв
• Отходы: ${(result.breakdown.waste/1000).toFixed(2)} т CO₂-экв

КЛАССИФИКАЦИЯ ПО УРОВНЯМ (SCOPE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scope 1 (прямые выбросы): ${result.scope1.toFixed(2)} т CO₂-экв
Scope 2 (косвенные - энергия): ${result.scope2.toFixed(2)} т CO₂-экв
Scope 3 (прочие косвенные): ${(result.scope3 || 0).toFixed(2)} т CO₂-экв

ИСПОЛЬЗОВАННЫЕ КОЭФФИЦИЕНТЫ ЭМИССИИ (2025 г.):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Электроэнергия: ${this.factors.electricity} кг CO₂/кВт·ч
• Природный газ: ${this.factors.naturalGas} кг CO₂/тыс. м³
• Дизельное топливо: ${this.factors.diesel} кг CO₂/л
• Автомобильный бензин: ${this.factors.gasoline} кг CO₂/л
• Тепловая энергия: ${this.factors.heatEnergy} кг CO₂/Гкал

Отчет сформирован системой ESG-Lite MVP
Версия методологии: 296-ФЗ от 02.07.2021 (актуализация 2025)
`;
  }
  
  /**
   * Рекомендации по снижению выбросов
   */
  generateRecommendations(result: EmissionResult): string[] {
    const recommendations: string[] = [];
    
    // Анализ структуры выбросов и предложение мер
    const maxSource = Object.entries(result.breakdown)
      .reduce((max, [key, value]) => value > max.value ? { key, value } : max, 
              { key: '', value: 0 });
    
    switch (maxSource.key) {
      case 'electricity':
        recommendations.push(
          '🔋 Внедрить энергосберегающие технологии и LED-освещение',
          '☀️ Рассмотреть установку солнечных панелей',
          '⚡ Оптимизировать график работы энергоемкого оборудования'
        );
        break;
      case 'naturalGas':
        recommendations.push(
          '🏠 Улучшить теплоизоляцию зданий',
          '🌡️ Установить программируемые термостаты',
          '🔧 Провести техобслуживание газового оборудования'
        );
        break;
      case 'transport':
        recommendations.push(
          '🚗 Перейти на электротранспорт или гибриды',
          '🚌 Оптимизировать логистические маршруты',
          '💻 Развивать удаленную работу для сокращения поездок'
        );
        break;
    }
    
    // Общие рекомендации
    recommendations.push(
      '📊 Внедрить систему мониторинга выбросов',
      '🌱 Рассмотреть участие в углеродных проектах',
      '📋 Получить сертификацию по стандартам ISO 14064'
    );
    
    return recommendations;
  }
}

// Фабричная функция для создания калькулятора
export function createEmissionCalculator(customFactors?: Partial<EmissionFactors>): EmissionCalculator {
  return new EmissionCalculator(customFactors);
}

// Экспорт констант
export const RUSSIAN_EMISSION_FACTORS = EMISSION_FACTORS_2025; 