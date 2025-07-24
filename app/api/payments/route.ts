import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// import { YooKassa } from 'yookassa-ts'; // TODO: Раскомментировать после установки пакетов

/**
 * Payments endpoint для интеграции с YooKassa
 * POST /api/payments/create
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planType, amount, currency = 'RUB' } = body;

    // Валидация тарифного плана
    const validPlans = ['standard', 'premium'];
    if (!validPlans.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // TODO: Интеграция с YooKassa API для создания платежа
    console.log('Creating payment for:', { userId, planType, amount, currency });

    // Заглушка для будущей интеграции
    return NextResponse.json({
      message: 'Payment endpoint ready for YooKassa integration',
      payment: {
        id: `payment_${Date.now()}`,
        status: 'pending',
        planType,
        amount,
        currency,
        userId,
        paymentUrl: `https://yookassa.ru/payments/payment_${Date.now()}`,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/webhook - YooKassa webhook для обработки уведомлений о платежах
 */
export async function webhook(request: NextRequest) {
  try {
    // TODO: Верификация webhook от YooKassa
    const body = await request.json();
    
    console.log('YooKassa webhook received:', body);

    // TODO: Обработка различных типов событий платежей
    // - payment.succeeded
    // - payment.canceled
    // - refund.succeeded

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
} 