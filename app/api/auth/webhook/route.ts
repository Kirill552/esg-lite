import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';

/**
 * Clerk webhook endpoint для синхронизации пользователей
 * POST /api/auth/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем webhook secret из переменных окружения
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET is not configured');
    }

    // Получаем заголовки запроса
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // Проверяем наличие необходимых заголовков
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    // Получаем тело запроса
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Создаем новый Svix instance для верификации
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Обрабатываем различные типы событий
    const eventType = (evt as any).type;
    console.log(`Webhook received: ${eventType}`, (evt as any).data);

    switch (eventType) {
      case 'user.created':
        // Создаем пользователя в нашей БД
        await handleUserCreated((evt as any).data);
        break;
      case 'user.updated':
        // Обновляем данные пользователя
        await handleUserUpdated((evt as any).data);
        break;
      case 'user.deleted':
        // Удаляем пользователя из БД
        await handleUserDeleted((evt as any).data);
        break;
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Функции для обработки событий пользователей
async function handleUserCreated(userData: any) {
  // TODO: Интегрировать с Prisma для создания пользователя в БД
  console.log('Creating user:', userData);
}

async function handleUserUpdated(userData: any) {
  // TODO: Интегрировать с Prisma для обновления пользователя
  console.log('Updating user:', userData);
}

async function handleUserDeleted(userData: any) {
  // TODO: Интегрировать с Prisma для удаления пользователя
  console.log('Deleting user:', userData);
} 