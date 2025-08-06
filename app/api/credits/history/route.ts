import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { creditsService } from '../../../../lib/credits-service';

/**
 * GET /api/credits/history
 * Получение истории транзакций кредитов для текущей организации
 * Поддерживает пагинацию через query параметры: page, limit
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

    // Получаем параметры пагинации из query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Валидация параметров пагинации
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Неверные параметры пагинации. page >= 1, limit: 1-100' 
        },
        { status: 400 }
      );
    }

    // Получаем историю транзакций
    const allTransactions = await creditsService.getTransactionHistory(organizationId);

    // Реализуем пагинацию на уровне API
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    // Форматируем транзакции для JSON ответа
    const formattedTransactions = paginatedTransactions.map(transaction => ({
      id: transaction.id,
      organizationId: transaction.organizationId,
      amount: transaction.amount.toString(),
      amountDecimal: transaction.amountDecimal.toString(),
      type: transaction.type,
      description: transaction.description,
      metadata: transaction.metadata,
      timestamp: transaction.timestamp
    }));

    // Подсчитываем общее количество и страниц
    const totalTransactions = allTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: page,
          limit,
          totalTransactions,
          totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      }
    });

  } catch (error) {
    console.error('Error getting credit transaction history:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Ошибка при получении истории транзакций'
      },
      { status: 500 }
    );
  }
}
