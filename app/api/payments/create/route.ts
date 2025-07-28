/**
 * API Endpoint: POST /api/payments/create
 * Задача 6.3: Создать API endpoints для платежей
 * 
 * Создание платежей через YooKassa:
 * - Разовые пополнения кредитов
 * - Платежи за подписки  
 * - Платежи за услуги экспертов
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createCreditsPayment, createSubscriptionPayment, createMarketplacePayment } from '@/lib/payment-service';
import { PaymentType } from '@/lib/yookassa-config';

// Схемы валидации для разных типов платежей
const CreditsPaymentSchema = z.object({
  type: z.literal(PaymentType.CREDITS),
  creditsAmount: z.number().min(1, 'Количество кредитов должно быть больше 0'),
  returnUrl: z.string().url().optional()
});

const SubscriptionPaymentSchema = z.object({
  type: z.literal(PaymentType.SUBSCRIPTION),
  subscriptionPlan: z.enum(['LITE_ANNUAL', 'CBAM_ADDON']),
  returnUrl: z.string().url().optional()
});

const MarketplacePaymentSchema = z.object({
  type: z.literal(PaymentType.MARKETPLACE),
  expertId: z.string().min(1, 'ID эксперта обязателен'),
  serviceDescription: z.string().min(1, 'Описание услуги обязательно'),
  amount: z.number().min(100, 'Минимальная сумма 100 рублей'),
  returnUrl: z.string().url().optional()
});

const PaymentRequestSchema = z.discriminatedUnion('type', [
  CreditsPaymentSchema,
  SubscriptionPaymentSchema,
  MarketplacePaymentSchema
]);

export async function POST(request: NextRequest) {
  try {
    // 1. Аутентификация пользователя
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    // 2. Получение organizationId из параметров запроса
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'organizationId обязателен' },
        { status: 400 }
      );
    }

    // 3. Валидация тела запроса
    const body = await request.json();
    const validatedData = PaymentRequestSchema.parse(body);

    // 4. Создание платежа в зависимости от типа
    let paymentResult;

    switch (validatedData.type) {
      case PaymentType.CREDITS:
        paymentResult = await createCreditsPayment(
          organizationId,
          userId,
          validatedData.creditsAmount,
          validatedData.returnUrl
        );
        break;

      case PaymentType.SUBSCRIPTION:
        paymentResult = await createSubscriptionPayment(
          organizationId,
          userId,
          validatedData.subscriptionPlan,
          validatedData.returnUrl
        );
        break;

      case PaymentType.MARKETPLACE:
        paymentResult = await createMarketplacePayment(
          organizationId,
          userId,
          validatedData.expertId,
          validatedData.expertId, // serviceId (используем expertId как serviceId)
          validatedData.amount,
          validatedData.serviceDescription,
          validatedData.returnUrl
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Неизвестный тип платежа' },
          { status: 400 }
        );
    }

    // 5. Успешный ответ с данными платежа
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResult.id,
        status: paymentResult.status,
        amount: paymentResult.amount,
        confirmationUrl: paymentResult.confirmation?.confirmation_url,
        metadata: paymentResult.metadata,
        createdAt: paymentResult.created_at
      },
      message: 'Платеж создан успешно'
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка создания платежа:', error);

    // Обработка ошибок валидации
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Ошибка валидации данных',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Обработка ошибок Payment Service
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Payment Error', 
          message: error.message
        },
        { status: 400 }
      );
    }

    // Общая ошибка сервера
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    // Возвращаем информацию о доступных типах платежей
    return NextResponse.json({
      success: true,
      paymentTypes: [
        {
          type: PaymentType.CREDITS,
          name: 'Пополнение кредитов',
          description: 'Разовое пополнение баланса кредитов',
          pricePerCredit: 5, // 5₽/т CO₂
          minAmount: 1,
          maxAmount: 10000
        },
        {
          type: PaymentType.SUBSCRIPTION,
          name: 'Тариф',
          description: 'Покупка годового тарифа',
          plans: [
            {
              plan: 'LITE_ANNUAL',
              name: 'ESG-Lite Annual',
              price: 40000,
              credits: 1000,
              description: 'Годовой тариф с 1000 т CO₂ кредитов'
            },
            {
              plan: 'CBAM_ADDON',
              name: 'CBAM Add-on',
              price: 15000,
              description: 'Дополнение для CBAM отчетности'
            }
          ]
        },
        {
          type: PaymentType.MARKETPLACE,
          name: 'Услуги экспертов',
          description: 'Оплата услуг верифицированных экспертов',
          minAmount: 5000,
          maxAmount: 200000,
          commission: 10 // 10% комиссия платформы
        }
      ]
    });

  } catch (error) {
    console.error('Ошибка получения типов платежей:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Ошибка получения информации о платежах'
      },
      { status: 500 }
    );
  }
}
