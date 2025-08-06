import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { creditsService } from '../../../../lib/credits-service';

/**
 * GET /api/credits/balance
 * Получение баланса кредитов для текущей организации пользователя
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
    const organizationId = orgId || userId; // Используем orgId, если есть, иначе userId
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Organization ID не найден' },
        { status: 400 }
      );
    }

    // Получаем баланс кредитов
    const balance = await creditsService.checkBalance(organizationId);

    // Получаем информацию о стоимости операций
    const operationCost = await creditsService.getOperationCost('report_generation');

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        balance: balance.balance.toString(), // Конвертируем в строку для JSON
        balanceDecimal: balance.balanceDecimal.toString(),
        planType: balance.planType,
        planExpiry: balance.planExpiry,
        lastTopUp: balance.lastTopUp,
        lastUpdated: balance.lastUpdated,
        pricing: {
          operationCost: operationCost.finalCost.toString(),
          baseCost: operationCost.baseCost.toString(),
          surgePricingMultiplier: operationCost.surgePricingMultiplier,
          pricePerTonRub: operationCost.pricePerTonRub
        }
      }
    });

  } catch (error) {
    console.error('Error getting credit balance:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Ошибка при получении баланса кредитов'
      },
      { status: 500 }
    );
  }
}
