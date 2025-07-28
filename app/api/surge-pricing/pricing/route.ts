import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { surgePricingService } from '@/lib/surge-pricing';

/**
 * GET /api/surge-pricing/pricing
 * Рассчитать цену с учетом surge pricing
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

    // Получаем параметры
    const { searchParams } = new URL(request.url);
    const basePriceParam = searchParams.get('basePrice');
    const dateParam = searchParams.get('date');

    // Валидация базовой цены
    if (!basePriceParam) {
      return NextResponse.json(
        { error: 'basePrice parameter is required' },
        { status: 400 }
      );
    }

    const basePrice = parseFloat(basePriceParam);
    if (isNaN(basePrice) || basePrice <= 0) {
      return NextResponse.json(
        { error: 'basePrice must be a positive number' },
        { status: 400 }
      );
    }

    // Валидация даты (опциональная)
    const checkDate = dateParam ? new Date(dateParam) : new Date();
    if (dateParam && isNaN(checkDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Рассчитываем цену
    const multiplier = surgePricingService.getSurgeMultiplier(checkDate);
    const finalPrice = surgePricingService.calculatePrice(basePrice, checkDate);
    const status = surgePricingService.getSurgePricingStatus(checkDate);

    return NextResponse.json({
      basePrice,
      multiplier,
      finalPrice,
      savings: basePrice * (multiplier - 1), // Сколько доплачивается
      status,
      calculation: {
        formula: `${basePrice} × ${multiplier} = ${finalPrice}`,
        isSurgeActive: multiplier > 1,
        surgeAddition: finalPrice - basePrice
      },
      requestedDate: checkDate.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Ошибка расчета surge pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surge-pricing/pricing
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
    const body = await request.json();
    const { operations, date } = body;

    // Валидация
    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: 'operations array is required' },
        { status: 400 }
      );
    }

    if (operations.length === 0 || operations.length > 100) {
      return NextResponse.json(
        { error: 'operations array must contain 1-100 items' },
        { status: 400 }
      );
    }

    // Валидация каждой операции
    for (const op of operations) {
      if (!op.name || typeof op.basePrice !== 'number' || op.basePrice <= 0) {
        return NextResponse.json(
          { error: 'Each operation must have name and positive basePrice' },
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
    const multiplier = surgePricingService.getSurgeMultiplier(checkDate);
    const status = surgePricingService.getSurgePricingStatus(checkDate);

    const results = operations.map(op => {
      const finalPrice = surgePricingService.calculatePrice(op.basePrice, checkDate);
      return {
        name: op.name,
        basePrice: op.basePrice,
        multiplier,
        finalPrice,
        surgeAddition: finalPrice - op.basePrice,
        savings: op.basePrice * (multiplier - 1)
      };
    });

    const totalBase = results.reduce((sum, r) => sum + r.basePrice, 0);
    const totalFinal = results.reduce((sum, r) => sum + r.finalPrice, 0);
    const totalSurgeAddition = totalFinal - totalBase;

    return NextResponse.json({
      results,
      summary: {
        totalOperations: operations.length,
        totalBasePrice: totalBase,
        totalFinalPrice: totalFinal,
        totalSurgeAddition,
        averageMultiplier: multiplier,
        isSurgeActive: multiplier > 1
      },
      status,
      requestedDate: checkDate.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Ошибка массового расчета surge pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
