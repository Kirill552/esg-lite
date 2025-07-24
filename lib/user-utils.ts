import { PrismaClient } from '@prisma/client';
import { currentUser } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

/**
 * Получает или создает пользователя в базе данных на основе данных Clerk
 * @param clerkUserId - ID пользователя из Clerk
 * @returns Пользователь из базы данных
 */
export async function ensureUserExists(clerkUserId: string) {
  try {
    // Используем транзакцию для обеспечения целостности данных
    const user = await prisma.$transaction(async (tx) => {
      // Сначала пытаемся найти существующего пользователя
      let existingUser = await tx.user.findUnique({
        where: { clerkId: clerkUserId }
      });

      if (existingUser) {
        return existingUser;
      }

      // Если пользователь не найден, получаем данные из Clerk
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        throw new Error('Не удалось получить данные пользователя из Clerk');
      }

      // Проверяем обязательные поля
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) {
        throw new Error('У пользователя Clerk отсутствует email адрес');
      }

      // Проверяем, не существует ли уже пользователь с таким email
      const existingEmailUser = await tx.user.findUnique({
        where: { email }
      });

      if (existingEmailUser) {
        // Если пользователь с таким email существует, но с другим clerkId,
        // обновляем clerkId (возможно, пользователь пересоздал аккаунт)
        const updatedUser = await tx.user.update({
          where: { email },
          data: {
            clerkId: clerkUserId,
            firstName: clerkUser.firstName || existingEmailUser.firstName,
            lastName: clerkUser.lastName || existingEmailUser.lastName,
          }
        });
        
        console.log(`✅ Обновлен существующий пользователь: ${updatedUser.id} (Clerk ID: ${clerkUserId})`);
        return updatedUser;
      }

      // Создаем нового пользователя
      const newUser = await tx.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
        }
      });

      console.log(`✅ Создан новый пользователь: ${newUser.id} (Clerk ID: ${clerkUserId})`);
      return newUser;
    });

    return user;

  } catch (error) {
    console.error('❌ Ошибка при создании/получении пользователя:', error);
    
    // Более детальная обработка ошибок
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        throw new Error('Пользователь с такими данными уже существует');
      }
      
      if (error.message.includes('Transaction')) {
        throw new Error('Ошибка транзакции при создании пользователя');
      }
    }
    
    throw error;
  }
}

/**
 * Получает внутренний ID пользователя по Clerk ID
 * @param clerkUserId - ID пользователя из Clerk
 * @returns Внутренний ID пользователя из базы данных
 */
export async function getUserInternalId(clerkUserId: string): Promise<string> {
  const user = await ensureUserExists(clerkUserId);
  return user.id;
}