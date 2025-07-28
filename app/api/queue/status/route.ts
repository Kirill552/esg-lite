import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Здесь должна быть логика получения статуса очереди
    // Пока возвращаем моковые данные
    const queueStatus = {
      total: 0,
      active: 0,
      waiting: 0,
      completed: 0,
      failed: 0,
      userTasks: 0
    };

    // TODO: Подключить реальную логику очереди
    // const queue = await getQueue();
    // const queueStatus = await queue.getWaiting();

    return NextResponse.json({
      success: true,
      data: queueStatus
    });

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
