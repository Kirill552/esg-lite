/**
 * Пример использования системы валидации ESG-Lite
 * 
 * Демонстрирует задачи 1.1.13 и 1.1.14:
 * - Систему версионности и точности расчетов
 * - Валидацию данных с маркировкой источников
 * 
 * Система поддерживает два типа отчетности:
 * 1. Российские отчеты - по Приказу Минприроды № 371-2022 и ФЗ-296
 * 2. CBAM отчеты - по EU Regulation 2023/956 для экспорта в ЕС
 * 
 * CBAM (Carbon Border Adjustment Mechanism) - трансграничный углеродный налог ЕС,
 * вступает в полную силу с 2026 года. В 2023-2025 действует переходный период.
 * Россия подала спор в ВТО по CBAM в мае 2025 года.
 */

import { ESGDataValidator, DataSourceType, DataSourceRating } from './report-validation';
import { VersionManager } from './versioning';

async function demonstrateValidationSystem() {
  console.log('🔍 Демонстрация системы валидации ESG-Lite\n');

  // Инициализация валидатора
  const validator = new ESGDataValidator();

  console.log('1. Создание версий методик...');
  
  // Создание версии российской методики расчета выбросов
  await VersionManager.createMethodVersion({
    method_id: 'russian_ghg_metallurgy_v2023',
    method_name: 'Расчет выбросов ПГ в металлургии (РФ)',
    version: 'v2023.12.01',
    description: 'Методика расчета выбросов для российских предприятий',
    formula: 'E = A × EF × (1 - C/100)',
    parameters: {
      A: 'Активные данные (объем производства, т)',
      EF: 'Коэффициент эмиссии (тCO2-экв/т)',
      C: 'Процент использования систем контроля, %'
    },
    valid_from: new Date('2023-12-01'),
    valid_until: new Date('2024-12-01'),
    approved_by: 'system',
    legal_basis: 'Приказ Минприроды России № 371 от 15.06.2022'
  });

  // Создание версии CBAM методики для экспорта в ЕС
  await VersionManager.createMethodVersion({
    method_id: 'cbam_eu_steel_v2026',
    method_name: 'CBAM расчет углеродного содержания стали',
    version: 'v2026.01.01', 
    description: 'Методика CBAM для стальной продукции (переходный период завершается в 2025)',
    formula: 'E = Direct_emissions + Indirect_electricity_emissions',
    parameters: {
      Direct_emissions: 'Прямые выбросы от производства',
      Indirect_electricity_emissions: 'Косвенные выбросы от электричества'
    },
    valid_from: new Date('2026-01-01'), // Полноценный CBAM с 2026
    valid_until: new Date('2027-01-01'),
    approved_by: 'EU Commission',
    legal_basis: 'EU Regulation 2023/956 (Carbon Border Adjustment Mechanism)'
  });

  console.log('✅ Версия методики создана\n');

  console.log('2. Валидация данных от различных источников...\n');

  // Пример 1: Первичные данные (измерительная информация)
  const primaryDataSource = {
    source_id: crypto.randomUUID(),
    source_type: DataSourceType.PRIMARY,
    source_name: 'АИИС КУЭ завода "Металлург"',
    source_rating: DataSourceRating.HIGH,
    verification_date: '2023-11-15T10:00:00Z',
    verified_by: 'Энергоаудитор ООО "ЭкоТех"',
    metadata: {
      calibration_date: '2023-10-01',
      measurement_uncertainty: '±2%',
      accreditation: 'РОСАККРЕДИТАЦИЯ №12345'
    }
  };

  const primaryDataResult = await validator.validateDataPoint(
    28.5, // Энергоемкость 28.5 ГДж/т
    'GJ/t',
    primaryDataSource,
    '24.10', // ОКВЭД: Производство чугуна, стали
    'energy_intensity_per_ton'
  );

  console.log('📊 Первичные данные (АИИС КУЭ):');
  console.log(`   Значение: ${primaryDataResult.value} ${primaryDataResult.unit}`);
  console.log(`   Статус: ${primaryDataResult.validation_status}`);
  console.log(`   Аномальность: ${(primaryDataResult.anomaly_score! * 100).toFixed(1)}%`);
  console.log(`   Соответствие отрасли: ${primaryDataResult.industry_compliance ? '✅' : '❌'}`);
  if (primaryDataResult.validation_messages.length > 0) {
    console.log(`   Сообщения: ${primaryDataResult.validation_messages.join(', ')}`);
  }
  console.log();

  // Пример 2: Расчетные данные
  const calculatedDataSource = {
    source_id: crypto.randomUUID(),
    source_type: DataSourceType.CALCULATED,
    source_name: 'Модель энергобаланса 1С:Предприятие',
    source_rating: DataSourceRating.MEDIUM,
    verification_date: null,
    verified_by: null,
    metadata: {
      calculation_method: 'Суммирование по видам топлива',
      last_update: '2023-12-01',
      data_sources: ['Накладные на уголь', 'Показания газового счетчика']
    }
  };

  const calculatedDataResult = await validator.validateDataPoint(
    45.8, // Подозрительно высокое значение
    'GJ/t',
    calculatedDataSource,
    '24.10',
    'energy_intensity_per_ton'
  );

  console.log('🧮 Расчетные данные (1С):');
  console.log(`   Значение: ${calculatedDataResult.value} ${calculatedDataResult.unit}`);
  console.log(`   Статус: ${calculatedDataResult.validation_status}`);
  console.log(`   Аномальность: ${(calculatedDataResult.anomaly_score! * 100).toFixed(1)}%`);
  console.log(`   Соответствие отрасли: ${calculatedDataResult.industry_compliance ? '✅' : '❌'}`);
  if (calculatedDataResult.validation_messages.length > 0) {
    console.log(`   ⚠️  Предупреждения: ${calculatedDataResult.validation_messages.join(', ')}`);
  }
  console.log();

  // Пример 3: Экспертная оценка с недостаточными метаданными
  const expertDataSource = {
    source_id: crypto.randomUUID(),
    source_type: DataSourceType.EXPERT,
    source_name: 'Экспертная оценка главного энергетика',
    source_rating: DataSourceRating.UNVERIFIED,
    verification_date: null,
    verified_by: null,
    metadata: {
      expert_name: 'Петров И.И.'
      // Отсутствуют qualification и methodology
    }
  };

  const expertDataResult = await validator.validateDataPoint(
    30.0, // Подозрительно "круглое" число
    'GJ/t',
    expertDataSource,
    '24.10',
    'energy_intensity_per_ton'
  );

  console.log('👨‍🔬 Экспертная оценка:');
  console.log(`   Значение: ${expertDataResult.value} ${expertDataResult.unit}`);
  console.log(`   Статус: ${expertDataResult.validation_status}`);
  console.log(`   Аномальность: ${(expertDataResult.anomaly_score! * 100).toFixed(1)}%`);
  console.log(`   Соответствие отрасли: ${expertDataResult.industry_compliance ? '✅' : '❌'}`);
  if (expertDataResult.validation_messages.length > 0) {
    console.log(`   ⚠️  Предупреждения:`);
    expertDataResult.validation_messages.forEach(msg => console.log(`      - ${msg}`));
  }
  console.log();

  console.log('3. Создание снапшота расчета...\n');

  // Создание снапшота расчета с валидированными данными
  const snapshotId = await VersionManager.createCalculationSnapshot(
    'russian_ghg_metallurgy_v2023',
    'v2023.12.01',
    [primaryDataResult, calculatedDataResult, expertDataResult],
    {
      company_name: 'ООО "Металлургический завод"',
      report_period: '2023-Q4',
      calculation_timestamp: new Date().toISOString(),
      operator: 'system',
      regulation_basis: 'Российские нормативы (Приказ № 371)'
    }
  );

  console.log(`📸 Снапшот расчета создан: ${snapshotId}`);

  // Валидация полного отчета
  const reportValidation = await validator.validateReport(
    {
      reportType: 'CBAM' as any,
      format: 'XML',
      fileName: 'cbam_report_q4_2023.xml'
    },
    [primaryDataResult, calculatedDataResult, expertDataResult]
  );

  console.log('\n4. Результат валидации отчета:');
  console.log(`   Валиден: ${reportValidation.isValid ? '✅' : '❌'}`);
  console.log(`   Риск мошенничества: ${(reportValidation.fraudRiskScore * 100).toFixed(1)}%`);
  
  if (reportValidation.errors.length > 0) {
    console.log('   ❌ Ошибки:');
    reportValidation.errors.forEach(err => 
      console.log(`      - ${err.field}: ${err.message}`)
    );
  }

  if (reportValidation.warnings.length > 0) {
    console.log('   ⚠️  Предупреждения:');
    reportValidation.warnings.forEach(warning => 
      console.log(`      - ${warning}`)
    );
  }

  console.log('\n5. Генерация расчетной ведомости...\n');

  // Генерация аудиторского отчета
  try {
    const worksheet = await VersionManager.generateWorksheet(snapshotId);
    console.log('📋 Расчетная ведомость сгенерирована:');
    console.log(`   Количество факторов: ${worksheet.factor_versions.length}`);
    console.log(`   Методика: ${worksheet.method_version}`);
    console.log(`   Дата расчета: ${new Date(worksheet.calculated_at).toLocaleDateString('ru-RU')}`);
    console.log(`   Оператор: ${worksheet.calculated_by}`);
    
    console.log(`   Результат верификации: ${worksheet.verified ? '✅ Верифицировано' : '❌ Требует проверки'}`);
    if (worksheet.verification_delta !== null) {
      console.log(`   Расхождение: ${worksheet.verification_delta.toFixed(3)}%`);
    }
  } catch (error) {
    console.error(`   ❌ Ошибка генерации: ${(error as Error).message}`);
  }

  console.log('\n✨ Демонстрация завершена!');
  console.log('\n📚 Ключевые возможности системы:');
  console.log('   • Версионность методик и коэффициентов');
  console.log('   • Маркировка источников данных (A/B/C)');
  console.log('   • Фрод-проверки и аномальность');
  console.log('   • Отраслевые нормативы и бенчмарки');
  console.log('   • Неизменяемые снапшоты расчетов');
  console.log('   • Аудиторские отчеты и расчетные ведомости');
  console.log('   • Двойная верификация расчетов');
}

// Запуск демонстрации (если файл выполняется напрямую)
if (require.main === module) {
  demonstrateValidationSystem().catch(console.error);
}

export { demonstrateValidationSystem };
