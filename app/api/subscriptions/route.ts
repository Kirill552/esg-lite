import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SubscriptionService, CreateSubscriptionRequest } from '../../../lib/subscription-service';
import { SubscriptionPlan } from '@prisma/client';

/**
 * GET /api/subscriptions
 * Получение активной подписки и истории подписок организации
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    // Получаем organization_id из Clerk
    const organizationId = orgId || userId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Organization ID не найден' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();

    // Получаем активную подписку
    const activeSubscription = await subscriptionService.getActiveSubscription(organizationId);

    // Получаем историю подписок
    const history = await subscriptionService.getSubscriptionHistory(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        activeSubscription,
        history,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Неизвестная ошибка при получении подписок'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Создание новой подписки для организации
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    // Получаем organization_id из Clerk
    const organizationId = orgId || userId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Organization ID не найден' },
        { status: 400 }
      );
    }

    // Парсинг тела запроса
    const body = await request.json();
    const { planType, durationMonths, autoRenew, customPriceRub } = body;

    // Валидация обязательных полей
    if (!planType) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Поле planType обязательно' },
        { status: 400 }
      );
    }

    // Валидация типа плана
    const validPlans = Object.values(SubscriptionPlan);
    if (!validPlans.includes(planType)) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: `Недопустимый тип плана. Доступные планы: ${validPlans.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Валидация дополнительных полей
    if (durationMonths !== undefined && (typeof durationMonths !== 'number' || durationMonths < 1 || durationMonths > 60)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Продолжительность должна быть от 1 до 60 месяцев' },
        { status: 400 }
      );
    }

    if (customPriceRub !== undefined && (typeof customPriceRub !== 'number' || customPriceRub < 0)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Пользовательская цена должна быть положительным числом' },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();

    // Создаем подписку
    const createRequest: CreateSubscriptionRequest = {
      organizationId,
      planType,
      durationMonths,
      autoRenew: typeof autoRenew === 'boolean' ? autoRenew : false,
      customPriceRub
    };

    const newSubscription = await subscriptionService.createSubscription(createRequest);

    return NextResponse.json({
      success: true,
      data: {
        subscription: newSubscription,
        message: 'Тариф успешно создан. Для активации требуется оплата.'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/subscriptions:', error);
    
    // Обработка специфических ошибок
    if (error instanceof Error) {
      if (error.message.includes('already has an active subscription')) {
        return NextResponse.json(
          { error: 'Conflict', message: 'У организации уже есть активный тариф' },
          { status: 409 }
        );
      }
      if (error.message.includes('Invalid subscription plan')) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Недопустимый тип тарифа' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Неизвестная ошибка при создании подписки'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscriptions
 * Управление подпиской (активация, продление, отмена)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Проверка аутентификации
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Требуется аутентификация' },
        { status: 401 }
      );
    }

    // Получаем organization_id из Clerk
    const organizationId = orgId || userId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Organization ID не найден' },
        { status: 400 }
      );
    }

    // Парсинг тела запроса
    const body = await request.json();
    const { action, subscriptionId } = body;

    // Валидация action
    const validActions = ['activate', 'renew', 'cancel'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: `Недопустимое действие. Доступные действия: ${validActions.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();

    let result;
    let message;

    switch (action) {
      case 'activate':
        if (!subscriptionId) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'Для активации требуется subscriptionId' },
            { status: 400 }
          );
        }
        result = await subscriptionService.activateSubscription(subscriptionId);
        message = result.success 
          ? `Тариф активирован. Начислено ${result.creditsAdded} т CO₂ кредитов.`
          : result.error;
        break;

      case 'renew':
        result = await subscriptionService.renewSubscription(organizationId);
        message = result.success 
          ? `Тариф продлен. Начислено ${result.creditsAdded} т CO₂ кредитов.`
          : result.error;
        break;

      case 'cancel':
        const cancelled = await subscriptionService.cancelSubscription(organizationId);
        result = { success: cancelled };
        message = cancelled 
          ? 'Тариф успешно отменен'
          : 'Не удалось отменить тариф или активный тариф не найден';
        break;

      default:
        return NextResponse.json(
          { error: 'Bad Request', message: 'Неподдерживаемое действие' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Bad Request', message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        result,
        message
      }
    });

  } catch (error) {
    console.error('Error in PATCH /api/subscriptions:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Неизвестная ошибка при управлении подпиской'
      },
      { status: 500 }
    );
  }
}
