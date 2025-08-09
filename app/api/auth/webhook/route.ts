import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  try {
    console.log('📝 Создание пользователя в БД:', userData.id);
    
    const email = userData.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new Error('У пользователя отсутствует email адрес');
    }

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Обновляем clerkId для существующего пользователя
      await prisma.user.update({
        where: { email },
        data: {
          clerkId: userData.id,
          firstName: userData.first_name || existingUser.firstName,
          lastName: userData.last_name || existingUser.lastName,
        }
      });
      console.log('✅ Обновлен существующий пользователь с email:', email);
    } else {
      // Создаем нового пользователя
      await prisma.user.create({
        data: {
          clerkId: userData.id,
          email,
          firstName: userData.first_name || null,
          lastName: userData.last_name || null,
        }
      });
      console.log('✅ Создан новый пользователь:', userData.id);
    }
  } catch (error) {
    console.error('❌ Ошибка создания пользователя:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  try {
    console.log('🔄 Обновление пользователя в БД:', userData.id);
    
    const email = userData.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new Error('У пользователя отсутствует email адрес');
    }

    // Ищем пользователя по clerkId
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userData.id }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { clerkId: userData.id },
        data: {
          email,
          firstName: userData.first_name || null,
          lastName: userData.last_name || null,
        }
      });
      console.log('✅ Пользователь обновлен:', userData.id);
    } else {
      // Если пользователь не найден по clerkId, создаем его
      await handleUserCreated(userData);
    }
  } catch (error) {
    console.error('❌ Ошибка обновления пользователя:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  try {
    console.log('🗑️ Удаление пользователя из БД:', userData.id);
    
    // Находим пользователя по clerkId
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userData.id }
    });

    if (existingUser) {
      // Вместо полного удаления, помечаем пользователя как удаленный
      // или можно сделать мягкое удаление (soft delete)
      await prisma.user.update({
        where: { clerkId: userData.id },
        data: {
          // Можно добавить поле deletedAt или isActive: false
          firstName: null,
          lastName: null,
          // Сохраняем email для возможного восстановления
        }
      });
      console.log('✅ Пользователь помечен как удаленный:', userData.id);
    } else {
      console.log('⚠️ Пользователь не найден для удаления:', userData.id);
    }
  } catch (error) {
    console.error('❌ Ошибка удаления пользователя:', error);
    throw error;
  }
} 