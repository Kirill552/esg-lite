import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { surgePricingService } from '@/lib/surge-pricing';

/**
 * GET /api/surge-pricing/status
 * Получить статус surge pricing
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

    // Получаем дату из query параметров (опционально)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const checkDate = dateParam ? new Date(dateParam) : new Date();

    // Проверяем валидность даты
    if (dateParam && isNaN(checkDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Получаем статус surge pricing
    const status = surgePricingService.getSurgePricingStatus(checkDate);
    const notification = surgePricingService.getSurgePricingNotification(checkDate);
    const bannerInfo = surgePricingService.getBannerInfo(checkDate);
    const daysToEvent = surgePricingService.getDaysToSurgeEvent(checkDate);

    return NextResponse.json({
      status,
      notification,
      bannerInfo,
      daysToEvent,
      requestedDate: checkDate.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Ошибка получения статуса surge pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/surge-pricing/status
 * Проверить surge pricing для диапазона дат
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
    const { startDate, endDate } = body;

    // Валидация входных данных
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Проверяем будет ли активен surge pricing в диапазоне
    const willBeActive = surgePricingService.willBeSurgeActive(start, end);
    
    // Получаем детальную информацию
    const startStatus = surgePricingService.getSurgePricingStatus(start);
    const endStatus = surgePricingService.getSurgePricingStatus(end);
    const config = surgePricingService.getConfig();

    return NextResponse.json({
      willBeActive,
      startStatus,
      endStatus,
      config: {
        surgeStartDate: config.surgeStartDate.toISOString(),
        surgeEndDate: config.surgeEndDate.toISOString(),
        multiplier: config.multiplier,
        reason: config.reason,
        enabled: config.enabled
      },
      requestedRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Ошибка проверки диапазона surge pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
