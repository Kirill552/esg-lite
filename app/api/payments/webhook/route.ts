/**
 * API Endpoint: POST /api/payments/webhook
 * Задача 6.3: Создать API endpoints для платежей
 * 
 * Webhook для обработки уведомлений от YooKassa:
 * - Автоматическое пополнение кредитов при успешном платеже
 * - Активация подписок
 * - Защита от подделки запросов (HMAC signature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPaymentWebhook, WebhookPayload } from '@/lib/payment-service';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // 1. Получение тела запроса и заголовков
    const rawBody = await request.text();
    const headersList = await headers();
    
    // Получаем signature из заголовков YooKassa
    const signature = headersList.get('yookassa-signature');
    
    if (!signature) {
      console.error('Webhook: отсутствует signature в заголовках');
      return NextResponse.json(
        { error: 'Bad Request', message: 'Отсутствует подпись webhook' },
        { status: 400 }
      );
    }

    // 2. Парсинг JSON payload
    let webhookPayload: WebhookPayload;
    try {
      webhookPayload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Webhook: ошибка парсинга JSON:', parseError);
      return NextResponse.json(
        { error: 'Bad Request', message: 'Некорректный JSON payload' },
        { status: 400 }
      );
    }

    // 3. Подготовка заголовков для валидации
    const requestHeaders: Record<string, string | string[] | undefined> = {
      'yookassa-signature': signature
    };

    // 4. Обработка webhook через Payment Service
    const result = await processPaymentWebhook(
      rawBody,
      requestHeaders
    );

    if (!result.success) {
      console.error('Webhook: ошибка обработки:', result.message);
      
      // Возвращаем статус в зависимости от типа ошибки
      if (result.message.includes('подпись')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: result.message },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Bad Request', message: result.message },
        { status: 400 }
      );
    }

    // 4. Успешная обработка
    console.log('Webhook обработан успешно:', {
      paymentId: webhookPayload.object?.id,
      type: webhookPayload.type,
      event: webhookPayload.event,
      metadata: webhookPayload.object?.metadata
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook обработан успешно',
      paymentId: webhookPayload.object?.id
    }, { status: 200 });

  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    
    // Возвращаем 500 для повторной отправки webhook YooKassa
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Внутренняя ошибка при обработке webhook'
      },
      { status: 500 }
    );
  }
}

// GET метод для проверки работоспособности webhook endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint работает',
    endpoint: '/api/payments/webhook',
    methods: ['POST'],
    description: 'Endpoint для обработки уведомлений YooKassa о статусе платежей'
  });
}
