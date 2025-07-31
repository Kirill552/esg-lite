import { NextRequest, NextResponse } from 'next/server';
import { getCurrentGWPValues, GWP_VALUES_2025, GWP_VALUES_AR4 } from '@/lib/emission-factors-service';

/**
 * API для получения информации о коэффициентах выбросов 296-ФЗ
 * GET /api/admin/emission-factors - получить текущие коэффициенты
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем текущие коэффициенты из базы данных
    const currentFactors = await getCurrentGWPValues();
    
    // Сравниваем с актуальными коэффициентами
    const isUpToDate = (
      currentFactors.CH4 === GWP_VALUES_2025.CH4 &&
      currentFactors.N2O === GWP_VALUES_2025.N2O &&
      currentFactors.SF6 === GWP_VALUES_2025.SF6
    );
    
    return NextResponse.json({
      success: true,
      data: {
        current: currentFactors,
        latest: GWP_VALUES_2025,
        legacy: GWP_VALUES_AR4,
        isUpToDate,
        version: isUpToDate ? 'AR6-2025' : 'AR4-2007',
        lastUpdate: new Date().toISOString(),
        source: isUpToDate 
          ? 'IPCC Sixth Assessment Report (2021) + РФ 805-р'
          : 'IPCC Fourth Assessment Report (2007)',
        changes: {
          CH4: {
            old: GWP_VALUES_AR4.CH4,
            new: GWP_VALUES_2025.CH4,
            changed: GWP_VALUES_AR4.CH4 !== GWP_VALUES_2025.CH4
          },
          N2O: {
            old: GWP_VALUES_AR4.N2O,
            new: GWP_VALUES_2025.N2O,
            changed: GWP_VALUES_AR4.N2O !== GWP_VALUES_2025.N2O
          },
          SF6: {
            old: GWP_VALUES_AR4.SF6,
            new: GWP_VALUES_2025.SF6,
            changed: GWP_VALUES_AR4.SF6 !== GWP_VALUES_2025.SF6
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting emission factors:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Ошибка при получении коэффициентов выбросов',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
