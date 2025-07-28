import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SubscriptionService } from '../../../../lib/subscription-service';
import { SubscriptionPlan } from '@prisma/client';

/**
 * POST /api/subscriptions/change-plan
 * Смена плана подписки для организации
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
    const { newPlanType, immediate } = body;

    // Валидация обязательных полей
    if (!newPlanType) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Поле newPlanType обязательно' },
        { status: 400 }
      );
    }

    // Валидация типа плана
    const validPlans = Object.values(SubscriptionPlan);
    if (!validPlans.includes(newPlanType)) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: `Недопустимый тип плана. Доступные планы: ${validPlans.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const subscriptionService = new SubscriptionService();

    // Получаем текущую активную подписку
    const currentSubscription = await subscriptionService.getActiveSubscription(organizationId);
    
    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'У организации нет активной подписки для смены' },
        { status: 400 }
      );
    }

    // Проверяем, отличается ли новый план от текущего
    if (currentSubscription.planType === newPlanType) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Новый план совпадает с текущим' },
        { status: 400 }
      );
    }

    // Получаем информацию о новом плане
    const newPlanInfo = subscriptionService.getPlanInfo(newPlanType);
    if (!newPlanInfo) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Информация о новом плане не найдена' },
        { status: 400 }
      );
    }

    // Логика смены плана
    let changeResult;
    
    if (immediate) {
      // Немедленная смена плана
      // 1. Отменяем текущую подписку
      const cancelled = await subscriptionService.cancelSubscription(organizationId);
      if (!cancelled) {
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Не удалось отменить текущую подписку' },
          { status: 500 }
        );
      }

      // 2. Создаем новую подписку
      const newSubscription = await subscriptionService.createSubscription({
        organizationId,
        planType: newPlanType,
        autoRenew: currentSubscription.autoRenew
      });

      // 3. Активируем новую подписку
      const activationResult = await subscriptionService.activateSubscription(newSubscription.id);
      
      if (!activationResult.success) {
        return NextResponse.json(
          { error: 'Internal Server Error', message: `Не удалось активировать новую подписку: ${activationResult.error}` },
          { status: 500 }
        );
      }

      changeResult = {
        type: 'immediate',
        oldPlan: currentSubscription.planType,
        newPlan: newPlanType,
        creditsAdded: activationResult.creditsAdded || 0,
        subscription: activationResult.subscription
      };

    } else {
      // Смена плана с конца текущего периода
      // Создаем новую подписку в статусе PENDING
      const newSubscription = await subscriptionService.createSubscription({
        organizationId,
        planType: newPlanType,
        autoRenew: currentSubscription.autoRenew
      });

      changeResult = {
        type: 'scheduled',
        oldPlan: currentSubscription.planType,
        newPlan: newPlanType,
        effectiveDate: currentSubscription.expiresAt,
        pendingSubscription: newSubscription
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        changeResult,
        message: immediate 
          ? `План успешно изменен на ${newPlanInfo.name}. Начислено ${changeResult.creditsAdded} т CO₂ кредитов.`
          : `Смена плана запланирована. Новый план ${newPlanInfo.name} будет активирован ${changeResult.effectiveDate?.toLocaleDateString('ru-RU')}.`
      }
    });

  } catch (error) {
    console.error('Error in POST /api/subscriptions/change-plan:', error);
    
    // Обработка специфических ошибок
    if (error instanceof Error) {
      if (error.message.includes('already has an active subscription')) {
        return NextResponse.json(
          { error: 'Conflict', message: 'У организации уже есть запланированная смена плана' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Неизвестная ошибка при смене плана подписки'
      },
      { status: 500 }
    );
  }
}
