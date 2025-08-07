import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '../../../../lib/subscription-service';

/**
 * GET /api/subscriptions/plans
 * Получение списка доступных планов подписки
 */
export async function GET(request: NextRequest) {
  try {
    const subscriptionService = new SubscriptionService();
    
    // Получаем все доступные планы
    const plans = subscriptionService.getAvailablePlans();

    // Добавляем дополнительную информацию о планах
    const plansWithDetails = plans.map(plan => ({
      ...plan,
      recommended: plan.planType === 'STANDARD', // Рекомендуемый план
      popular: plan.planType === 'STANDARD', // Популярный план
      features: plan.features || [],
      // Форматирование цены для отображения
      formattedPrice: plan.priceRub > 0 
        ? `${plan.priceRub.toLocaleString('ru-RU')} ₽`
        : 'Бесплатно',
      // Информация о сэкономленной сумме для годовых планов
      savings: plan.durationMonths === 12 && plan.priceRub > 0
        ? {
          monthlyEquivalent: Math.round(plan.priceRub / 12),
          formattedMonthlyEquivalent: `${Math.round(plan.priceRub / 12).toLocaleString('ru-RU')} ₽/мес`
        }
        : null
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans: plansWithDetails,
        currency: 'RUB',
        timestamp: new Date().toISOString(),
        note: 'Цены указаны в российских рублях. CBAM Add-on требует отдельной подписки.'
      }
    });

  } catch (error) {
    console.error('Error in GET /api/subscriptions/plans:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Неизвестная ошибка при получении планов подписки'
      },
      { status: 500 }
    );
  }
}
