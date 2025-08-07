/**
 * Система валидации данных для ESG-Lite
 * 
 * Реализует задачу 1.1.14: Система валидации данных
 * 
 * Обеспечивает:
 * - Валидаторы входных данных
 * - Маркировку источников (A-первичка, B-расчет, C-экспертная оценка)
 * - Фрод-проверки по отраслевым диапазонам
 */

import { ReportType } from '@prisma/client';
import { z } from 'zod';

// Типы источников данных
export enum DataSourceType {
  PRIMARY = 'A',      // Первичная измерительная информация
  CALCULATED = 'B',   // Расчетные данные
  EXPERT = 'C'        // Экспертная оценка
}

export enum DataSourceRating {
  HIGH = 'HIGH',       // Высокая достоверность
  MEDIUM = 'MEDIUM',   // Средняя достоверность  
  LOW = 'LOW',         // Низкая достоверность
  UNVERIFIED = 'UNVERIFIED' // Не проверено
}

// Схемы валидации источников данных
export const DataSourceSchema = z.object({
  source_id: z.string().uuid('Некорректный UUID источника'),
  source_type: z.nativeEnum(DataSourceType, { 
    errorMap: () => ({ message: 'Тип источника должен быть A, B или C' }) 
  }),
  source_name: z.string().min(1, 'Название источника обязательно'),
  source_rating: z.nativeEnum(DataSourceRating),
  verification_date: z.string().datetime().nullable(),
  verified_by: z.string().nullable(),
  metadata: z.record(z.any()).optional()
});

export const ValidatedDataPointSchema = z.object({
  data_id: z.string().uuid('Некорректный UUID данных'),
  source: DataSourceSchema,
  value: z.number().finite('Значение должно быть конечным числом'),
  unit: z.string().min(1, 'Единица измерения обязательна'),
  timestamp: z.string().datetime('Некорректная дата/время'),
  validation_status: z.enum(['VALID', 'WARNING', 'ERROR', 'PENDING']),
  validation_messages: z.array(z.string()),
  industry_compliance: z.boolean(),
  range_check_passed: z.boolean(),
  anomaly_score: z.number().min(0).max(1).nullable()
});

export type DataSource = z.infer<typeof DataSourceSchema>;
export type ValidatedDataPoint = z.infer<typeof ValidatedDataPointSchema>;

// Сохраняем старые интерфейсы для обратной совместимости
export interface ReportValidationError {
  field: string;
  message: string;
}

export interface ReportData {
  reportType: ReportType;
  format?: string;
  fileName?: string;
  emissionData?: any;
  methodology?: string;
}

/**
 * Отраслевые нормативы для проверки данных
 */
export interface IndustryBenchmark {
  industry_code: string; // ОКВЭД код
  industry_name: string;
  parameter: string; // Например, "energy_intensity_per_ton"
  unit: string;
  typical_range: {
    min: number;
    max: number;
    median: number;
  };
  outlier_threshold: number; // Множитель для определения аномалий
  source: string;
  updated_at: string;
}

/**
 * Класс для валидации данных ESG отчетов
 * Реализует задачу 1.1.14: полная система валидации с фрод-проверками
 */
export class ESGDataValidator {
  private industryBenchmarks: Map<string, IndustryBenchmark[]> = new Map();
  private suspiciousPatterns: Map<string, number> = new Map();

  constructor() {
    this.loadIndustryBenchmarks();
  }

  /**
   * Валидация точки данных с маркировкой источника
   */
  async validateDataPoint(
    value: number,
    unit: string,
    source: DataSource,
    industryCode: string,
    parameter: string
  ): Promise<ValidatedDataPoint> {
    const dataId = crypto.randomUUID();
    const validationMessages: string[] = [];
    let validationStatus: 'VALID' | 'WARNING' | 'ERROR' | 'PENDING' = 'VALID';
    let industryCompliance = true;
    let rangeCheckPassed = true;
    let anomalyScore: number | null = null;

    // 1. Базовые проверки
    if (!isFinite(value) || value < 0) {
      validationMessages.push('Значение должно быть положительным конечным числом');
      validationStatus = 'ERROR';
      rangeCheckPassed = false;
    }

    // 2. Проверка соответствия отраслевым нормативам
    const benchmarks = this.industryBenchmarks.get(industryCode);
    const benchmark = benchmarks?.find(b => b.parameter === parameter && b.unit === unit);
    
    if (benchmark) {
      anomalyScore = this.calculateAnomalyScore(value, benchmark);
      
      if (value < benchmark.typical_range.min || value > benchmark.typical_range.max) {
        const severity = anomalyScore > 0.8 ? 'ERROR' : 'WARNING';
        validationMessages.push(
          `Значение вне типичного диапазона для отрасли (${benchmark.typical_range.min}-${benchmark.typical_range.max} ${unit})`
        );
        if (severity === 'ERROR') validationStatus = 'ERROR';
        else if (validationStatus === 'VALID') validationStatus = 'WARNING';
        industryCompliance = false;
      }

      // Проверка на экстремальные выбросы
      if (anomalyScore > 0.9) {
        validationMessages.push('Обнаружена потенциальная аномалия данных - требуется дополнительная проверка');
        if (validationStatus !== 'ERROR') validationStatus = 'WARNING';
      }
    } else {
      validationMessages.push('Отсутствуют отраслевые нормативы для данного параметра');
      if (validationStatus === 'VALID') validationStatus = 'WARNING';
    }

    // 3. Фрод-проверки
    await this.runFraudChecks(value, source, parameter, validationMessages);

    // 4. Проверка достоверности источника
    this.validateDataSource(source, validationMessages);

    return {
      data_id: dataId,
      source,
      value,
      unit,
      timestamp: new Date().toISOString(),
      validation_status: validationStatus,
      validation_messages: validationMessages,
      industry_compliance: industryCompliance,
      range_check_passed: rangeCheckPassed,
      anomaly_score: anomalyScore
    };
  }

  /**
   * Расчет аномальности значения относительно отраслевого норматива
   */
  private calculateAnomalyScore(value: number, benchmark: IndustryBenchmark): number {
    const { min, max, median } = benchmark.typical_range;
    
    if (value >= min && value <= max) {
      // Значение в норме, но проверяем отклонение от медианы
      const deviation = Math.abs(value - median) / (max - min);
      return Math.min(deviation, 0.5); // Макс 0.5 для нормальных значений
    }
    
    // Значение вне диапазона
    const rangeSize = max - min;
    const outlierDistance = value < min ? 
      (min - value) / rangeSize : 
      (value - max) / rangeSize;
    
    return Math.min(0.5 + outlierDistance / benchmark.outlier_threshold, 1.0);
  }

  /**
   * Фрод-проверки данных
   */
  private async runFraudChecks(
    value: number, 
    source: DataSource, 
    parameter: string, 
    messages: string[]
  ): Promise<void> {
    // 1. Проверка на подозрительные паттерны (слишком "круглые" числа)
    if (this.isSuspiciouslyRound(value)) {
      messages.push('Подозрительно округленное значение - возможна неточность измерений');
    }

    // 2. Проверка частоты использования источника
    const sourceKey = `${source.source_name}_${parameter}`;
    const usageCount = this.suspiciousPatterns.get(sourceKey) || 0;
    this.suspiciousPatterns.set(sourceKey, usageCount + 1);
    
    if (usageCount > 100 && source.source_rating === DataSourceRating.UNVERIFIED) {
      messages.push('Источник используется подозрительно часто без верификации');
    }

    // 3. Проверка на дублирующиеся значения
    if (await this.checkForDuplicateValues(value, source.source_id, parameter)) {
      messages.push('Обнаружены подозрительно похожие значения от одного источника');
    }
  }

  /**
   * Проверка источника данных
   */
  private validateDataSource(source: DataSource, messages: string[]): void {
    // Проверка верификации источника
    if (source.source_type === DataSourceType.PRIMARY && 
        source.source_rating === DataSourceRating.UNVERIFIED) {
      messages.push('Первичные данные от неверифицированного источника требуют проверки');
    }

    // Проверка актуальности верификации
    if (source.verification_date) {
      const verificationDate = new Date(source.verification_date);
      const monthsOld = (Date.now() - verificationDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsOld > 12) {
        messages.push('Верификация источника устарела (более 12 месяцев)');
      }
    }

    // Проверка полноты метаданных для экспертных оценок
    if (source.source_type === DataSourceType.EXPERT && 
        (!source.metadata?.expert_qualification || !source.metadata?.methodology)) {
      messages.push('Недостаточно метаданных для экспертной оценки');
    }
  }

  /**
   * Проверка на подозрительную округленность
   */
  private isSuspiciouslyRound(value: number): boolean {
    // Проверяем, является ли число слишком "круглым"
    const str = value.toString();
    const afterDecimal = str.split('.')[1] || '';
    
    // Подозрительно, если число заканчивается на много нулей
    if (afterDecimal.length === 0 && value % 100 === 0 && value > 1000) {
      return true;
    }
    
    // Или если все цифры после запятой - нули
    if (afterDecimal.length > 2 && afterDecimal.match(/^0+$/)) {
      return true;
    }
    
    return false;
  }

  /**
   * Проверка на дубликаты значений
   */
  private async checkForDuplicateValues(
    value: number, 
    sourceId: string, 
    parameter: string
  ): Promise<boolean> {
    // В реальной реализации здесь был бы запрос к базе данных
    // Пока возвращаем false как заглушку
    return false;
  }

  /**
   * Загрузка отраслевых нормативов
   */
  private loadIndustryBenchmarks(): void {
    // Примеры нормативов для металлургии
    const metallurgyBenchmarks: IndustryBenchmark[] = [
      {
        industry_code: '24.10',
        industry_name: 'Производство чугуна, стали и ферросплавов',
        parameter: 'energy_intensity_per_ton',
        unit: 'GJ/t',
        typical_range: { min: 18, max: 35, median: 25 },
        outlier_threshold: 2.0,
        source: 'Минэнерго РФ, 2023',
        updated_at: '2023-12-01T00:00:00Z'
      },
      {
        industry_code: '24.10',
        industry_name: 'Производство чугуна, стали и ферросплавов',
        parameter: 'co2_emissions_per_ton',
        unit: 'tCO2/t',
        typical_range: { min: 1.8, max: 2.5, median: 2.1 },
        outlier_threshold: 1.5,
        source: 'Росстат, 2023',
        updated_at: '2023-12-01T00:00:00Z'
      }
    ];

    this.industryBenchmarks.set('24.10', metallurgyBenchmarks);

    // Можно добавить нормативы для других отраслей
    // this.industryBenchmarks.set('20.13', chemicalBenchmarks);
    // this.industryBenchmarks.set('35.11', energyBenchmarks);
  }

  /**
   * Валидация полного отчета
   */
  async validateReport(data: ReportData, dataPoints: ValidatedDataPoint[]): Promise<{
    isValid: boolean;
    errors: ReportValidationError[];
    warnings: string[];
    fraudRiskScore: number;
  }> {
    const errors = validateReportData(data);
    const warnings: string[] = [];
    let totalAnomalyScore = 0;
    let validatedPointsCount = 0;

    // Анализ точек данных
    for (const point of dataPoints) {
      if (point.anomaly_score !== null) {
        totalAnomalyScore += point.anomaly_score;
        validatedPointsCount++;
      }

      if (point.validation_status === 'WARNING') {
        warnings.push(...point.validation_messages);
      } else if (point.validation_status === 'ERROR') {
        errors.push({
          field: point.data_id,
          message: point.validation_messages.join('; ')
        });
      }
    }

    const fraudRiskScore = validatedPointsCount > 0 ? 
      totalAnomalyScore / validatedPointsCount : 0;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fraudRiskScore
    };
  }
}

/**
 * Валидирует данные отчета перед созданием
 * @param data - Данные отчета для валидации
 * @returns Массив ошибок валидации (пустой если валидация прошла успешно)
 */
export function validateReportData(data: any): ReportValidationError[] {
  const errors: ReportValidationError[] = [];

  // Проверка обязательных полей
  if (!data.reportType) {
    errors.push({
      field: 'reportType',
      message: 'Тип отчета обязателен'
    });
  }

  // Проверка валидности типа отчета
  const validReportTypes = Object.values(ReportType);
  if (data.reportType && !validReportTypes.includes(data.reportType)) {
    errors.push({
      field: 'reportType',
      message: `Недопустимый тип отчета. Допустимые типы: ${validReportTypes.join(', ')}`
    });
  }

  // Проверка формата файла
  if (data.format && !['PDF', 'XML', 'CSV'].includes(data.format)) {
    errors.push({
      field: 'format',
      message: 'Недопустимый формат файла. Допустимые форматы: PDF, XML, CSV'
    });
  }

  // Проверка имени файла
  if (data.fileName && typeof data.fileName !== 'string') {
    errors.push({
      field: 'fileName',
      message: 'Имя файла должно быть строкой'
    });
  }

  // Специфичная валидация для разных типов отчетов
  switch (data.reportType) {
    case ReportType.REPORT_296FZ:
    case 'EMISSION_296FZ': // Совместимость с новым API
      errors.push(...validate296FZReport(data.emissionData || data.companyData));
      break;
    case ReportType.CBAM_XML:
    case ReportType.CBAM_CSV:
    case 'CBAM_QUARTERLY': // Совместимость с новым API
      errors.push(...validateCBAMReport(data.emissionData || data.goodsData));
      break;
  }

  return errors;
}

/**
 * Валидирует данные для отчета 296-ФЗ
 */
function validate296FZReport(emissionData: any): ReportValidationError[] {
  const errors: ReportValidationError[] = [];

  if (!emissionData) {
    errors.push({
      field: 'emissionData',
      message: 'Данные о выбросах обязательны для отчета 296-ФЗ'
    });
    return errors;
  }

  // Проверка обязательных полей для 296-ФЗ (новый формат)
  const requiredFields = [
    { field: 'companyName', token: 'org_name' },
    { field: 'inn', token: 'inn' },
    { field: 'reportingPeriod', token: 'reporting_period' },
    { field: 'ogrn', token: 'ogrn' },
    { field: 'address', token: 'address' }
  ];
  
  for (const { field, token } of requiredFields) {
    if (!emissionData[field]) {
      errors.push({
        field: `emissionData.${field}`,
        message: `Поле ${field} (токен [[${token}]]) обязательно для отчета 296-ФЗ`
      });
    }
  }

  // Валидация ИНН
  if (emissionData.inn && !isValidINN(emissionData.inn)) {
    errors.push({
      field: 'emissionData.inn',
      message: 'Некорректный формат ИНН'
    });
  }

  // Валидация ОГРН
  if (emissionData.ogrn && !isValidOGRN(emissionData.ogrn)) {
    errors.push({
      field: 'emissionData.ogrn',
      message: 'Некорректный формат ОГРН'
    });
  }

  // Валидация отчетного периода
  if (emissionData.reportingPeriod) {
    const year = parseInt(emissionData.reportingPeriod);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 2021 || year > currentYear) {
      errors.push({
        field: 'emissionData.reportingPeriod',
        message: `Отчетный период должен быть между 2021 и ${currentYear}`
      });
    }
  }

  // Валидация данных о выбросах
  if (emissionData.totalEmissions) {
    const total = parseFloat(emissionData.totalEmissions);
    if (isNaN(total) || total < 0) {
      errors.push({
        field: 'emissionData.totalEmissions',
        message: 'Общий объем выбросов должен быть положительным числом'
      });
    }
  }

  return errors;
}

/**
 * Валидирует данные для отчета CBAM
 */
function validateCBAMReport(emissionData: any): ReportValidationError[] {
  const errors: ReportValidationError[] = [];

  if (!emissionData) {
    errors.push({
      field: 'emissionData',
      message: 'Данные о выбросах обязательны для отчета CBAM'
    });
    return errors;
  }

  // Проверка обязательных полей для CBAM
  const requiredFields = ['companyName', 'eori', 'quarter'];
  
  for (const field of requiredFields) {
    if (!emissionData[field]) {
      errors.push({
        field: `emissionData.${field}`,
        message: `Поле ${field} обязательно для отчета CBAM`
      });
    }
  }

  // Валидация EORI номера
  if (emissionData.eori && !isValidEORI(emissionData.eori)) {
    errors.push({
      field: 'emissionData.eori',
      message: 'Некорректный формат EORI номера'
    });
  }

  // Валидация квартала
  if (emissionData.quarter && !isValidQuarter(emissionData.quarter)) {
    errors.push({
      field: 'emissionData.quarter',
      message: 'Некорректный формат квартала (ожидается формат Q1 2025)'
    });
  }

  return errors;
}

/**
 * Проверяет валидность ИНН
 */
function isValidINN(inn: string): boolean {
  if (typeof inn !== 'string') return false;
  
  const cleanINN = inn.replace(/\D/g, '');
  return cleanINN.length === 10 || cleanINN.length === 12;
}

/**
 * Проверяет валидность ОГРН
 */
function isValidOGRN(ogrn: string): boolean {
  if (typeof ogrn !== 'string') return false;
  
  const cleanOGRN = ogrn.replace(/\D/g, '');
  return cleanOGRN.length === 13 || cleanOGRN.length === 15;
}

/**
 * Проверяет валидность EORI номера
 */
function isValidEORI(eori: string): boolean {
  if (typeof eori !== 'string') return false;
  
  // EORI номер должен начинаться с кода страны (2 буквы) и содержать до 15 символов
  const eoriPattern = /^[A-Z]{2}[A-Z0-9]{1,15}$/;
  return eoriPattern.test(eori.toUpperCase());
}

/**
 * Проверяет валидность квартала
 */
function isValidQuarter(quarter: string): boolean {
  if (typeof quarter !== 'string') return false;
  
  // Формат: Q1 2025, Q2 2025, etc.
  const quarterPattern = /^Q[1-4]\s\d{4}$/;
  return quarterPattern.test(quarter);
}