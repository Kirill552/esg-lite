/**
 * Система управления коэффициентами выбросов 296-ФЗ
 * Автоматическое обновление коэффициентов согласно актуальным нормативам
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Актуальные коэффициенты IPCC AR6 (2025)
export const GWP_VALUES_2025 = {
  CO2: 1,      // неизменно
  CH4: 28,     // было 25 в AR4, теперь 28 в AR6
  N2O: 265,    // было 298 в AR4, теперь 265 в AR6
  HFC: 1300,   // средний для HFC-134a (наиболее распространенный)
  PFC: 6630,   // средний для PFC-14 (CF4, наиболее распространенный)
  SF6: 23500   // было 22800 в AR4, теперь 23500 в AR6
};

// Исторические коэффициенты для совместимости
export const GWP_VALUES_AR4 = {
  CO2: 1,
  CH4: 25,
  N2O: 298,
  HFC: 1430,
  PFC: 7390,
  SF6: 22800
};

export interface EmissionFactorVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  source: string;
  coefficients: {
    CO2: number;
    CH4: number;
    N2O: number;
    HFC: number;
    PFC: number;
    SF6: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EmissionFactorUpdate {
  version: string;
  name: string;
  description: string;
  effectiveFrom: string; // ISO date string
  source: string;
  coefficients: {
    CO2: number;
    CH4: number;
    N2O: number;
    HFC: number;
    PFC: number;
    SF6: number;
  };
}

/**
 * Получает актуальные коэффициенты на указанную дату
 */
export async function getActiveEmissionFactors(date: Date = new Date()): Promise<EmissionFactorVersion | null> {
  try {
    // Используем raw SQL запрос для обхода проблем с типами
    const result = await prisma.$queryRaw`
      SELECT * FROM emission_factors 
      WHERE "effectiveFrom" <= ${date}
        AND ("effectiveTo" IS NULL OR "effectiveTo" >= ${date})
        AND "isActive" = true
      ORDER BY "effectiveFrom" DESC
      LIMIT 1
    `;

    const factors = result as any[];
    if (factors.length > 0) {
      const factor = factors[0];
      return {
        id: factor.id,
        version: factor.version,
        name: factor.name,
        description: factor.description,
        effectiveFrom: factor.effectiveFrom,
        effectiveTo: factor.effectiveTo || undefined,
        isActive: factor.isActive,
        source: factor.source,
        coefficients: factor.coefficients,
        createdAt: factor.createdAt,
        updatedAt: factor.updatedAt
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting active emission factors:', error);
    // Возвращаем текущие коэффициенты как fallback
    return {
      id: 'fallback',
      version: 'AR6-2025',
      name: 'IPCC AR6 Коэффициенты 2025',
      description: 'Актуальные коэффициенты IPCC AR6 для 296-ФЗ',
      effectiveFrom: new Date('2025-01-01'),
      isActive: true,
      source: 'IPCC AR6 Working Group I',
      coefficients: GWP_VALUES_2025,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

/**
 * Создает новую версию коэффициентов
 */
export async function createEmissionFactorVersion(update: EmissionFactorUpdate): Promise<EmissionFactorVersion> {
  try {
    const effectiveFrom = new Date(update.effectiveFrom);
    
    // Деактивируем предыдущие версии, которые пересекаются по времени
    await prisma.emissionFactor.updateMany({
      where: {
        effectiveFrom: { lte: effectiveFrom },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: effectiveFrom } }
        ]
      },
      data: {
        effectiveTo: effectiveFrom,
        isActive: false
      }
    });

    // Создаем новую версию
    const newFactor = await prisma.emissionFactor.create({
      data: {
        version: update.version,
        name: update.name,
        description: update.description,
        effectiveFrom: effectiveFrom,
        isActive: true,
        source: update.source,
        coefficients: update.coefficients
      }
    });

    console.log(`✅ Создана новая версия коэффициентов: ${update.version}`);

    return {
      id: newFactor.id,
      version: newFactor.version,
      name: newFactor.name,
      description: newFactor.description,
      effectiveFrom: newFactor.effectiveFrom,
      effectiveTo: newFactor.effectiveTo || undefined,
      isActive: newFactor.isActive,
      source: newFactor.source,
      coefficients: newFactor.coefficients as any,
      createdAt: newFactor.createdAt,
      updatedAt: newFactor.updatedAt
    };
    
  } catch (error) {
    console.error('Error creating emission factor version:', error);
    throw new Error(`Не удалось создать версию коэффициентов: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Получает все доступные версии коэффициентов
 */
export async function getAllEmissionFactorVersions(): Promise<EmissionFactorVersion[]> {
  try {
    const factors = await prisma.emissionFactor.findMany({
      orderBy: { effectiveFrom: 'desc' }
    });

    return factors.map((factor: any) => ({
      id: factor.id,
      version: factor.version,
      name: factor.name,
      description: factor.description,
      effectiveFrom: factor.effectiveFrom,
      effectiveTo: factor.effectiveTo || undefined,
      isActive: factor.isActive,
      source: factor.source,
      coefficients: factor.coefficients as any,
      createdAt: factor.createdAt,
      updatedAt: factor.updatedAt
    }));
  } catch (error) {
    console.error('Error getting all emission factor versions:', error);
    return [];
  }
}

/**
 * Инициализирует систему с базовыми коэффициентами
 */
export async function initializeEmissionFactors(): Promise<void> {
  try {
    const existingFactors = await prisma.emissionFactor.count();
    
    if (existingFactors === 0) {
      console.log('🔧 Инициализация системы коэффициентов...');

      // Создаем историческую версию AR4
      await prisma.emissionFactor.create({
        data: {
          version: 'AR4-2007',
          name: 'IPCC AR4 Коэффициенты (устаревшие)',
          description: 'Коэффициенты IPCC AR4 2007 года (используются до 2025)',
          effectiveFrom: new Date('2021-01-01'),
          effectiveTo: new Date('2024-12-31'),
          isActive: false,
          source: 'IPCC Fourth Assessment Report (2007)',
          coefficients: GWP_VALUES_AR4
        }
      });

      // Создаем актуальную версию AR6
      await createEmissionFactorVersion({
        version: 'AR6-2025',
        name: 'IPCC AR6 Коэффициенты 2025',
        description: 'Актуальные коэффициенты IPCC AR6 согласно Распоряжению Правительства РФ от 04.04.2025 № 805-р',
        effectiveFrom: '2025-01-01',
        source: 'IPCC Sixth Assessment Report (2021) + РФ 805-р',
        coefficients: GWP_VALUES_2025
      });

      console.log('✅ Система коэффициентов инициализирована');
    }
  } catch (error) {
    console.error('Error initializing emission factors:', error);
    throw error;
  }
}

/**
 * Обновляет коэффициенты до актуальной версии
 */
export async function updateToLatestFactors(): Promise<EmissionFactorVersion> {
  console.log('🔄 Проверка актуальности коэффициентов...');
  
  const currentFactors = await getActiveEmissionFactors();
  
  if (currentFactors?.version === 'AR6-2025') {
    console.log('✅ Коэффициенты уже актуальны');
    return currentFactors;
  }

  // Обновляем до AR6-2025
  const updated = await createEmissionFactorVersion({
    version: 'AR6-2025',
    name: 'IPCC AR6 Коэффициенты 2025',
    description: 'Актуальные коэффициенты IPCC AR6 согласно Распоряжению Правительства РФ от 04.04.2025 № 805-р',
    effectiveFrom: new Date().toISOString(),
    source: 'IPCC Sixth Assessment Report (2021) + РФ 805-р',
    coefficients: GWP_VALUES_2025
  });

  console.log('✅ Коэффициенты обновлены до актуальной версии');
  return updated;
}

/**
 * Планировщик автоматических обновлений (для будущих версий)
 */
export async function scheduleFactorUpdates(): Promise<void> {
  // Проверяем обновления каждые 30 дней
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  
  const checkUpdates = async () => {
    try {
      console.log('📅 Плановая проверка актуальности коэффициентов...');
      
      const current = await getActiveEmissionFactors();
      const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS);
      
      if (!current || current.createdAt < thirtyDaysAgo) {
        console.log('⚠️ Коэффициенты могут быть устаревшими, требуется проверка');
        // Здесь можно добавить уведомления администраторам
      }
    } catch (error) {
      console.error('Error in scheduled factor check:', error);
    }
  };

  // Запускаем первую проверку через 5 минут после старта
  setTimeout(checkUpdates, 5 * 60 * 1000);
  
  // Затем проверяем каждые 30 дней
  setInterval(checkUpdates, THIRTY_DAYS);
  
  console.log('📅 Планировщик обновлений коэффициентов запущен');
}

/**
 * Получает коэффициенты для расчетов (совместимость с существующим кодом)
 */
export async function getCurrentGWPValues(): Promise<typeof GWP_VALUES_2025> {
  const factors = await getActiveEmissionFactors();
  return factors?.coefficients || GWP_VALUES_2025;
}
