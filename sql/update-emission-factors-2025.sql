-- Обновление коэффициентов выбросов согласно IPCC AR6 (2025)
-- Создано автоматически 2025-07-31T19:41:53.718Z

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
  'AR6-2025',
  'IPCC AR6 Коэффициенты 2025',
  'Актуальные коэффициенты IPCC AR6 согласно Распоряжению Правительства РФ от 04.04.2025 № 805-р',
  '2025-01-01T00:00:00.000Z',
  true,
  'IPCC Sixth Assessment Report (2021) + РФ 805-р',
  '{"CO2":1,"CH4":28,"N2O":265,"HFC":1300,"PFC":6630,"SF6":23500}'
) ON CONFLICT ("version") DO UPDATE SET
  "coefficients" = EXCLUDED."coefficients",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Проверка результата
SELECT * FROM emission_factors WHERE "isActive" = true ORDER BY "effectiveFrom" DESC LIMIT 1;
