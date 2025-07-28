/**
 * API endpoint для получения информации о ценах кредитов с surge pricing
 * Задача 5.2: Интегрировать surge pricing в кредитную систему
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { creditsService } from '@/lib/credits-service';

/**
 * GET /api/credits/pricing
 * Получить информацию о ценах с учетом surge pricing
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const operationType = searchParams.get('operationType') || 'ocr';
    const emissionVolumeTons = parseFloat(searchParams.get('emissionVolumeTons') || '1');
    const dateParam = searchParams.get('date');

    // Валидация operationType
    const validOperationTypes = ['ocr', 'report_generation', 'api_call'];
    if (!validOperationTypes.includes(operationType)) {
      return NextResponse.json(
        { error: `Invalid operationType. Must be one of: ${validOperationTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Валидация emissionVolumeTons
    if (isNaN(emissionVolumeTons) || emissionVolumeTons <= 0) {
      return NextResponse.json(
        { error: 'emissionVolumeTons must be a positive number' },
        { status: 400 }
      );
    }

    // Валидация даты
    const checkDate = dateParam ? new Date(dateParam) : new Date();
    if (dateParam && isNaN(checkDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Получаем информацию о ценах
    const pricingInfo = await creditsService.calculatePriceWithSurge(
      operationType as 'ocr' | 'report_generation' | 'api_call',
      emissionVolumeTons,
      checkDate
    );

    return NextResponse.json({
      ...pricingInfo,
      requestedDate: checkDate.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Ошибка получения информации о ценах:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/credits/pricing
 * Массовый расчет цен для нескольких операций
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const { operations, date } = await request.json();

    // Валидация
    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'operations must be an array' },
        { status: 400 }
      );
    }

    if (operations.length === 0) {
      return NextResponse.json(
        { error: 'operations array cannot be empty' },
        { status: 400 }
      );
    }

    if (operations.length > 50) {
      return NextResponse.json(
        { error: 'operations array cannot exceed 50 items' },
        { status: 400 }
      );
    }

    // Валидация каждой операции
    const validOperationTypes = ['ocr', 'report_generation', 'api_call'];
    for (const op of operations) {
      if (!op.operationType || !validOperationTypes.includes(op.operationType)) {
        return NextResponse.json(
          { error: `Each operation must have a valid operationType: ${validOperationTypes.join(', ')}` },
          { status: 400 }
        );
      }
      
      if (!op.emissionVolumeTons || typeof op.emissionVolumeTons !== 'number' || op.emissionVolumeTons <= 0) {
        return NextResponse.json(
          { error: 'Each operation must have a positive emissionVolumeTons' },
          { status: 400 }
        );
      }
    }

    // Валидация даты
    const checkDate = date ? new Date(date) : new Date();
    if (date && isNaN(checkDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Рассчитываем цены для всех операций
    const results = await Promise.all(
      operations.map(async (op: any) => {
        const pricingInfo = await creditsService.calculatePriceWithSurge(
          op.operationType,
          op.emissionVolumeTons,
          checkDate
        );
        
        return {
          operationType: op.operationType,
          emissionVolumeTons: op.emissionVolumeTons,
          baseCost: pricingInfo.baseCost,
          multiplier: pricingInfo.multiplier,
          finalCost: pricingInfo.finalCost,
          priceInRubles: pricingInfo.priceInRubles,
          surgeAddition: pricingInfo.surgeAddition,
          surgeAdditionRubles: pricingInfo.surgeAdditionRubles,
          surgePricingInfo: pricingInfo.surgePricingInfo
        };
      })
    );

    // Считаем общую статистику
    const totalBaseCost = results.reduce((sum, r) => sum + r.baseCost, 0);
    const totalFinalCost = results.reduce((sum, r) => sum + r.finalCost, 0);
    const totalSurgeAddition = results.reduce((sum, r) => sum + r.surgeAddition, 0);
    const totalPriceInRubles = results.reduce((sum, r) => sum + r.priceInRubles, 0);

    return NextResponse.json({
      results,
      summary: {
        totalOperations: operations.length,
        totalBaseCost,
        totalFinalCost,
        totalSurgeAddition,
        totalPriceInRubles,
        averageMultiplier: results[0]?.multiplier || 1,
        isSurgeActive: results[0]?.surgePricingInfo?.isActive || false
      },
      surgePricingInfo: results[0]?.surgePricingInfo,
      requestedDate: checkDate.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Ошибка массового расчета цен:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
