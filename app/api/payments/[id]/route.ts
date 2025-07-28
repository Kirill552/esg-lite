/**
 * API Endpoint: GET /api/payments/[id]
 * Задача 6.3: Создать API endpoints для платежей
 * 
 * Получение информации о конкретном платеже:
 * - Статус платежа
 * - Сумма и валюта
 * - Метаданные
 * - История изменений
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPaymentInfo } from '@/lib/payment-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Аутентификация пользователя
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    // 2. Получение ID платежа из параметров
    const paymentId = params.id;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'ID платежа обязателен' },
        { status: 400 }
      );
    }

    // 3. Получение organizationId из query параметров (для проверки прав доступа)
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'organizationId обязателен' },
        { status: 400 }
      );
    }

    // 4. Получение информации о платеже
    const paymentInfo = await getPaymentInfo(paymentId);
    
    if (!paymentInfo) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Платеж не найден' },
        { status: 404 }
      );
    }

    // 5. Проверка прав доступа - платеж должен принадлежать организации пользователя
    if (paymentInfo.metadata?.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Нет доступа к данному платежу' },
        { status: 403 }
      );
    }

    // 6. Форматирование ответа
    const formattedPayment = {
      id: paymentInfo.id,
      status: paymentInfo.status,
      amount: {
        value: paymentInfo.amount.value,
        currency: paymentInfo.amount.currency
      },
      confirmation: paymentInfo.confirmation ? {
        type: paymentInfo.confirmation.type,
        confirmationUrl: paymentInfo.confirmation.confirmation_url
      } : null,
      metadata: paymentInfo.metadata,
      createdAt: paymentInfo.created_at,
      // Добавляем дополнительную информацию в зависимости от типа платежа
      ...(paymentInfo.metadata?.type === 'credits' && {
        creditsAmount: paymentInfo.metadata.creditsAmount,
        pricePerCredit: 5
      }),
      ...(paymentInfo.metadata?.type === 'subscription' && {
        subscriptionPlan: paymentInfo.metadata.subscriptionPlan,
        planDetails: paymentInfo.metadata.subscriptionPlan ? 
          getSubscriptionPlanDetails(paymentInfo.metadata.subscriptionPlan) : null
      }),
      ...(paymentInfo.metadata?.type === 'marketplace' && {
        expertId: paymentInfo.metadata.expertId,
        serviceId: paymentInfo.metadata.serviceId
      })
    };

    return NextResponse.json({
      success: true,
      payment: formattedPayment
    });

  } catch (error) {
    console.error('Ошибка получения информации о платеже:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Payment Error', 
          message: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}

// Вспомогательная функция для получения деталей плана подписки
function getSubscriptionPlanDetails(plan: string) {
  const plans = {
    'LITE_ANNUAL': {
      name: 'ESG-Lite Annual',
      price: 40000,
      credits: 1000,
      description: 'Годовой тариф с 1000 т CO₂ кредитов'
    },
    'CBAM_ADDON': {
      name: 'CBAM Add-on',
      price: 15000,
      description: 'Дополнение для CBAM отчетности'
    }
  };
  
  return plans[plan as keyof typeof plans] || null;
}
