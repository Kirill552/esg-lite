import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QueueManager } from '../../../../../../lib/queue';

/**
 * Повторная попытка выполнения задачи
 * POST /api/queue/jobs/[id]/retry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const queueManager = new QueueManager();
    await queueManager.initialize();

    try {
      // Получаем информацию о задаче для проверки
      const jobStatus = await queueManager.getJobStatus(jobId);
      
      if (!jobStatus) {
        await queueManager.stop();
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }

      if (jobStatus.status !== 'failed') {
        await queueManager.stop();
        return NextResponse.json(
          { success: false, error: 'Can only retry failed jobs' },
          { status: 400 }
        );
      }

      // Используем pg-boss для повторной попытки
      const boss = (queueManager as any).boss;
      if (boss && boss.retry) {
        const newJobId = await boss.retry(jobId);
        console.log(`✅ Задача ${jobId} перезапущена с новым ID: ${newJobId}`);
        
        await queueManager.stop();

        return NextResponse.json({
          success: true,
          message: 'Job retry scheduled successfully',
          data: { 
            originalJobId: jobId,
            newJobId: newJobId || jobId
          }
        });
      } else {
        // Fallback: получаем оригинальную задачу из БД для создания новой
        await queueManager.stop();

        return NextResponse.json({
          success: false,
          error: 'Cannot retry job: pg-boss retry method not available',
          message: 'Please create a new task manually'
        }, { status: 501 });
      }

    } catch (queueError) {
      await queueManager.stop();
      throw queueError;
    }

  } catch (error) {
    console.error(`❌ Retry job ${params.id} error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retry job'
      },
      { status: 500 }
    );
  }
}
