import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Моковые данные для демонстрации
    // В реальном приложении здесь будет запрос к базе данных
    const mockSubscriptionData = {
      currentPlan: 'STANDARD',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 дней
      monthlyUsage: 75000, // тонн CO₂ в текущем месяце
      totalEmissions: 850000, // тонн CO₂ за год
      lastPayment: {
        amount: 174000, // 150k базовый + 24k за 75k тонн * 0.32₽
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // -5 дней
      }
    };

    return NextResponse.json(mockSubscriptionData);
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
