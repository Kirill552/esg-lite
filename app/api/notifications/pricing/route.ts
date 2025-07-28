/**
 * API endpoint для уведомлений о ценах
 * Задача 5.3: Создать систему уведомлений о ценах
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { pricingNotificationService } from '@/lib/pricing-notifications';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const includeEmail = searchParams.get('includeEmail') === 'true';
    
    const date = dateParam ? new Date(dateParam) : new Date();
    
    // Валидация даты
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Получаем полный статус ценообразования
    const pricingStatus = await pricingNotificationService.getCurrentPricingStatus(date);
    
    // Если запрошены email уведомления
    const emailNotifications = includeEmail 
      ? await pricingNotificationService.getEmailNotifications(userId, date)
      : [];

    // Сводка по ценам
    const pricingSummary = await pricingNotificationService.getPricingSummary(date);

    return NextResponse.json({
      status: 'success',
      data: {
        pricing: pricingStatus,
        emailNotifications,
        summary: pricingSummary,
        requestedDate: date.toISOString(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Ошибка получения уведомлений о ценах:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { action, notificationId, date: dateParam } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const date = dateParam ? new Date(dateParam) : new Date();

    switch (action) {
      case 'mark_sent':
        if (!notificationId) {
          return NextResponse.json(
            { error: 'notificationId is required for mark_sent action' },
            { status: 400 }
          );
        }
        
        await pricingNotificationService.markNotificationAsSent(
          userId,
          notificationId,
          date
        );
        
        return NextResponse.json({
          status: 'success',
          message: 'Notification marked as sent'
        });

      case 'check_email_needed':
        const { notificationType } = body;
        
        if (!notificationType) {
          return NextResponse.json(
            { error: 'notificationType is required for check_email_needed action' },
            { status: 400 }
          );
        }
        
        const shouldSend = await pricingNotificationService.shouldSendEmailNotification(
          userId,
          notificationType,
          date
        );
        
        return NextResponse.json({
          status: 'success',
          data: {
            shouldSendEmail: shouldSend
          }
        });

      case 'get_banner_info':
        const pricingStatus = await pricingNotificationService.getCurrentPricingStatus(date);
        
        return NextResponse.json({
          status: 'success',
          data: {
            banner: pricingStatus.bannerInfo,
            isSurgeActive: pricingStatus.isSurgeActive,
            currentMultiplier: pricingStatus.currentMultiplier
          }
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Ошибка обработки действия с уведомлениями:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
