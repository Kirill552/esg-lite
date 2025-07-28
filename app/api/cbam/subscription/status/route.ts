/**
 * API для проверки статуса CBAM подписки
 * GET /api/cbam/subscription/status?organizationId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkCBAMSubscription } from '@/lib/cbam-pricing';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Не указан organizationId' },
        { status: 400 }
      );
    }

    // Проверяем статус CBAM подписки
    const hasSubscription = await checkCBAMSubscription(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        hasActiveSubscription: hasSubscription,
        benefits: hasSubscription ? [
          'Безлимитная генерация CBAM отчетов',
          'Без дополнительной платы за строки',
          'Приоритетная обработка'
        ] : [
          'Тариф: 255₽ за тонну CO₂',
          'Поштучная оплата за каждую строку отчета'
        ],
        pricing: {
          ratePerTon: hasSubscription ? 0 : 255,
          currency: 'RUB',
          description: hasSubscription 
            ? 'Включено в подписку CBAM' 
            : 'Оплата за каждую тонну CO₂ в отчете'
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('CBAM subscription check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Ошибка при проверке статуса CBAM подписки'
      },
      { status: 500 }
    );
  }
}
