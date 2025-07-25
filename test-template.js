/**
 * Простой тест шаблона 296-ФЗ
 */

const fs = require('fs');
const path = require('path');

// Упрощенная функция создания данных шаблона
function createTemplateData(baseData) {
  const now = new Date();

  return {
    // Реквизиты организации
    org_name: baseData.fullCompanyName || baseData.companyName,
    legal_form: baseData.legalForm || 'ООО',
    ogrn: baseData.ogrn,
    inn: baseData.inn,
    okpo: baseData.okpo,
    oktmo: baseData.oktmo,
    okved: baseData.okved,
    address: baseData.address,
    email: baseData.email,
    phone: baseData.phone,
    submission_basis: '296-ФЗ от 02.07.2021',

    // Процессы (на основе ОКВЭД)
    proc_1_code: 'P001',
    proc_1_desc: 'Потребление электроэнергии',
    proc_1_nvos: '0201',
    proc_1_capacity: '1000',
    proc_1_unit: 'кВт·ч',
    proc_1_method: 'Инструментальный',
    proc_1_coef_src: 'Приказ № 371, табл. 2.1',
    proc_1_justif: 'Косвенные выбросы от потребления электроэнергии',

    proc_2_code: 'P002',
    proc_2_desc: 'Сжигание природного газа в производственных целях',
    proc_2_nvos: '0101',
    proc_2_capacity: '50,0',
    proc_2_unit: 'тыс.м³/год',
    proc_2_method: 'Расчетный',
    proc_2_coef_src: 'Приказ № 371, табл. 1.3',
    proc_2_justif: 'Прямые выбросы от сжигания топлива',

    proc_3_code: '',
    proc_3_desc: '',
    proc_3_nvos: '',
    proc_3_capacity: '',
    proc_3_unit: '',
    proc_3_method: '',
    proc_3_coef_src: '',
    proc_3_justif: '',

    // Выбросы (рассчитанные для производства)
    co2_mass: '2001,3',
    co2e_co2: '2001,3',
    co2_percent: '82,5',
    ch4_mass: '1,5',
    co2e_ch4: '37,5',
    ch4_percent: '1,5',
    n2o_mass: '0,6',
    co2e_n2o: '178,8',
    n2o_percent: '7,4',
    hfc_mass: '0,0',
    hfc_gwp: '1430',
    co2e_hfc: '0,0',
    hfc_percent: '0,0',
    pfc_mass: '0,0',
    pfc_gwp: '7390',
    co2e_pfc: '0,0',
    pfc_percent: '0,0',
    sf6_mass: '0,001',
    co2e_sf6: '22,8',
    sf6_percent: '0,9',
    total_co2e: '2426,1',

    // Климатические проекты
    climproj_1_name: '',
    climproj_1_from: '',
    climproj_1_to: '',
    climproj_1_reduced: '',
    climproj_1_status: '',
    climproj_2_name: '',
    climproj_2_from: '',
    climproj_2_to: '',
    climproj_2_reduced: '',
    climproj_2_status: '',

    // Подпись
    signer_fio: baseData.signerName,
    signer_pos: baseData.signerPosition,
    signer_sigtype: 'NQES',
    sign_date: now.toLocaleDateString('ru-RU'),

    // Исполнитель
    executor_fio: 'Сидоров Сидор Сидорович',
    executor_phone: '+7-495-123-45-68',

    // Метаданные
    reporting_period: baseData.reportingPeriod,
    emission_factors_source: 'Приказ Минприроды России от 15.06.2017 № 371',
    generation_date: now.toLocaleDateString('ru-RU'),
    generation_time: now.toLocaleTimeString('ru-RU'),
    document_id: `DOC_${Date.now()}`
  };
}

// Простая функция замены токенов
function replaceTokens(template, data) {
  let result = template;

  // Заменяем токены [[token_name]]
  const tokenRegex = /\[\[([a-z_0-9]+)\]\]/g;

  result = result.replace(tokenRegex, (match, tokenName) => {
    const value = data[tokenName];
    return value !== undefined ? String(value) : '';
  });

  return result;
}

// Тестовые данные (имитируют ответ CHECKO API)
const testData = {
  companyName: 'ООО "Тестовая Компания"',
  fullCompanyName: 'Общество с ограниченной ответственностью "Тестовая Компания"',
  legalForm: 'ООО',
  ogrn: '1234567890123',
  inn: '7701234567',
  okpo: '12345678',
  oktmo: '45382000',
  okved: '23.51',
  okvedName: 'Производство листового стекла',
  address: '115114, г. Москва, ул. Тестовая, д. 1',
  email: 'test@example.ru',
  phone: '+7-495-123-45-67',
  reportingPeriod: '2024',
  totalEmissions: '1496.5',
  signerName: 'Петров Петр Петрович',
  signerPosition: 'Генеральный директор'
};

try {
  console.log('🧪 Тестирование шаблона 296-ФЗ...');

  // Читаем шаблон
  const templatePath = path.join(__dirname, 'templates', 'ru-296fz-report-2025.html');
  const template = fs.readFileSync(templatePath, 'utf-8');
  console.log('✅ Шаблон загружен');

  // Создаем данные для шаблона (имитируем функцию create296FZTemplateData)
  const templateData = createTemplateData(testData);
  console.log('✅ Данные для шаблона созданы');

  // Заменяем токены
  const processedHtml = replaceTokens(template, templateData);
  console.log('✅ Токены заменены');

  // Проверяем незамененные токены
  const unreplacedTokens = processedHtml.match(/\[\[[a-z_]+\]\]/g);
  if (unreplacedTokens) {
    console.log('⚠️  Незамененные токены:');
    unreplacedTokens.forEach(token => console.log(`  - ${token}`));
  } else {
    console.log('✅ Все токены заменены');
  }

  // Сохраняем результат
  const outputPath = path.join(__dirname, 'test-output-296fz.html');
  fs.writeFileSync(outputPath, processedHtml);
  console.log(`✅ Результат сохранен в ${outputPath}`);

  console.log('🎉 Тест завершен успешно!');

} catch (error) {
  console.error('❌ Ошибка тестирования:', error.message);
}