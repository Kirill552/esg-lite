#!/usr/bin/env node

/**
 * Скрипт для заполнения таблицы emission_factors начальными данными
 * Используется после применения миграции
 */

const { Client } = require('pg');

// Конфигурация подключения к базе данных
const dbConfig = {
  host: process.env.DB_HOST || '176.108.253.195',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'esg_lite_mvp',
  user: process.env.DB_USER || 'esg_user',
  password: process.env.DB_PASSWORD, // Обязательная переменная окружения
  ssl: {
    rejectUnauthorized: true,
    ca: require('fs').readFileSync('./root.crt', 'utf8'),
    checkServerIdentity: () => undefined // Отключаем проверку имени хоста
  }
};

// Коэффициенты IPCC AR6 (2025)
const emissionFactorsData = [
  {
    id: 'current-ipcc-ar6-2025',
    version: 'IPCC AR6 2025',
    name: 'Current emission factors based on IPCC AR6 (2025)',
    description: 'Updated global warming potential values from IPCC AR6 report (2025)',
    effectiveFrom: new Date('2025-01-01'),
    effectiveTo: null,
    isActive: true,
    source: 'IPCC AR6 Working Group I Contribution to the Sixth Assessment Report',
    coefficients: {
      CH4: 28,   // Метан (было 25 в AR4)
      N2O: 265,  // Закись азота (было 298 в AR4)
      SF6: 23500 // Гексафторид серы (было 22800 в AR4)
    }
  },
  {
    id: 'legacy-ipcc-ar4-2007',
    version: 'IPCC AR4 2007',
    name: 'Legacy emission factors based on IPCC AR4 (2007)',
    description: 'Legacy global warming potential values from IPCC AR4 report (2007)',
    effectiveFrom: new Date('2007-01-01'),
    effectiveTo: new Date('2024-12-31'),
    isActive: false,
    source: 'IPCC AR4 Working Group I Contribution to the Fourth Assessment Report',
    coefficients: {
      CH4: 25,
      N2O: 298,
      SF6: 22800
    }
  }
];

async function populateEmissionFactors() {
  const client = new Client(dbConfig);
  
  try {
    console.log('Подключение к базе данных...');
    await client.connect();
    
    console.log('Проверка существования таблицы emission_factors...');
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'emission_factors'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    if (!tableExists.rows[0].exists) {
      throw new Error('Таблица emission_factors не существует. Примените миграцию сначала.');
    }
    
    console.log('Таблица emission_factors найдена.');
    
    // Очистка существующих данных (опционально)
    console.log('Очистка существующих данных...');
    await client.query('DELETE FROM emission_factors');
    
    // Вставка новых данных
    console.log('Вставка коэффициентов эмиссии...');
    
    for (const factor of emissionFactorsData) {
      const insertQuery = `
        INSERT INTO emission_factors (id, version, name, description, "effectiveFrom", "effectiveTo", "isActive", source, coefficients, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          version = EXCLUDED.version,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          "effectiveFrom" = EXCLUDED."effectiveFrom",
          "effectiveTo" = EXCLUDED."effectiveTo",
          "isActive" = EXCLUDED."isActive",
          source = EXCLUDED.source,
          coefficients = EXCLUDED.coefficients,
          "updatedAt" = NOW();
      `;
      
      const values = [
        factor.id,
        factor.version,
        factor.name,
        factor.description,
        factor.effectiveFrom,
        factor.effectiveTo,
        factor.isActive,
        factor.source,
        JSON.stringify(factor.coefficients)
      ];
      
      await client.query(insertQuery, values);
      console.log(`✓ Вставлен коэффициент: ${factor.version}`);
    }
    
    // Проверка результата
    console.log('\nПроверка вставленных данных...');
    const checkQuery = 'SELECT id, version, name, "isActive", coefficients FROM emission_factors ORDER BY "isActive" DESC';
    const result = await client.query(checkQuery);
    
    console.log('\n=== КОЭФФИЦИЕНТЫ ЭМИССИИ ===');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Версия: ${row.version}`);
      console.log(`Название: ${row.name}`);
      console.log(`Активный: ${row.isActive ? 'Да' : 'Нет'}`);
      console.log(`Коэффициенты: ${JSON.stringify(row.coefficients, null, 2)}`);
      console.log('---');
    });
    
    console.log('\n✅ Заполнение коэффициентов эмиссии завершено успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при заполнении коэффициентов:', error.message);
    console.error('Полная ошибка:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Запуск скрипта
if (require.main === module) {
  populateEmissionFactors();
}

module.exports = { populateEmissionFactors };
