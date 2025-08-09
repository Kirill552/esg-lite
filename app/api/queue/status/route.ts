import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QueueManager } from '../../../../lib/queue';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Инициализируем Queue Manager
    const queueManager = new QueueManager();
    await queueManager.initialize();

    // Получаем реальную статистику очереди из pg-boss
    const queueStats = await queueManager.getQueueStats();

    // Получаем дополнительную информацию о задачах пользователя (если нужно)
    // TODO: Добавить фильтрацию по пользователю в будущем
    const userTasks = 0; // Пока заглушка
    
    const response = {
      success: true,
      data: {
        ...queueStats,
        userTasks
      }
    };

    // Закрываем соединение с очередью
    await queueManager.stop();

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Queue status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get queue status',
        data: {
          total: 0,
          active: 0,
          waiting: 0,
          completed: 0,
          failed: 0,
          userTasks: 0
        }
      },
      { status: 500 }
    );
  }
}
