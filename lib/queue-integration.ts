/**
 * Интеграция системы очередей с существующими API маршрутами
 */

import { getQueueManager } from './queue';
import { OcrJobData } from './pg-boss-config';

export interface QueuedOcrRequest {
  documentId: string;
  fileKey: string;
  userId: string;
  organizationId?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

export interface QueuedOcrResponse {
  success: boolean;
  jobId?: string;
  status: 'queued' | 'error';
  message: string;
  estimatedWaitTime?: number;
}

/**
 * Добавление OCR задачи в очередь (для использования в API)
 */
export async function queueOcrProcessing(request: QueuedOcrRequest): Promise<QueuedOcrResponse> {
  try {
    const queueManager = await getQueueManager();
    
    // Подготавливаем данные задачи
    const jobData: OcrJobData = {
      documentId: request.documentId,
      fileKey: request.fileKey,
      userId: request.userId,
      organizationId: request.organizationId
    };
    
    // Добавляем задачу в очередь
    const jobId = await queueManager.addOcrJob(jobData, {
      priority: request.priority || 'normal'
    });
    
    if (!jobId) {
      return {
        success: false,
        status: 'error',
        message: 'Не удалось добавить задачу в очередь'
      };
    }
    
    // Получаем статистику для оценки времени ожидания
    const stats = await queueManager.getQueueStats();
    const estimatedWaitTime = Math.max(1, Math.ceil(stats.waiting / 5)) * 60; // примерно 1 минута на задачу при concurrency=5
    
    return {
      success: true,
      jobId,
      status: 'queued',
      message: 'Задача добавлена в очередь на обработку',
      estimatedWaitTime
    };
    
  } catch (error: any) {
    console.error('❌ Ошибка добавления задачи в очередь:', error);
    
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return {
        success: false,
        status: 'error',
        message: 'Недостаточно кредитов для обработки документа'
      };
    }
    
    return {
      success: false,
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    };
  }
}

/**
 * Получение статуса OCR задачи (для использования в API)
 */
export async function getOcrJobStatus(jobId: string): Promise<{
  success: boolean;
  status?: 'waiting' | 'active' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  message: string;
}> {
  try {
    const queueManager = await getQueueManager();
    const jobStatus = await queueManager.getJobStatus(jobId);
    
    if (!jobStatus) {
      return {
        success: false,
        message: 'Задача не найдена'
      };
    }
    
    return {
      success: true,
      status: jobStatus.status,
      progress: jobStatus.progress,
      result: jobStatus.result,
      error: jobStatus.error,
      message: getStatusMessage(jobStatus.status)
    };
    
  } catch (error: any) {
    console.error('❌ Ошибка получения статуса задачи:', error);
    
    return {
      success: false,
      message: 'Ошибка получения статуса задачи'
    };
  }
}

/**
 * Получение статистики очередей (для админ панели)
 */
export async function getQueueStatistics(): Promise<{
  success: boolean;
  stats?: any;
  performance?: any;
  surge?: any;
  message: string;
}> {
  try {
    const queueManager = await getQueueManager();
    
    const [stats, performance, surge] = await Promise.all([
      queueManager.getDetailedQueueStats(),
      queueManager.getPerformanceMetrics(),
      Promise.resolve(queueManager.getSurgePricingInfo())
    ]);
    
    return {
      success: true,
      stats,
      performance,
      surge,
      message: 'Статистика получена успешно'
    };
    
  } catch (error: any) {
    console.error('❌ Ошибка получения статистики очередей:', error);
    
    return {
      success: false,
      message: 'Ошибка получения статистики'
    };
  }
}

/**
 * Повторная обработка неудачной задачи
 */
export async function retryOcrJob(jobId: string): Promise<{
  success: boolean;
  newJobId?: string;
  message: string;
}> {
  try {
    const queueManager = await getQueueManager();
    const newJobId = await queueManager.retryFailedJob(jobId);
    
    if (!newJobId) {
      return {
        success: false,
        message: 'Не удалось перезапустить задачу (возможно, она не в статусе failed)'
      };
    }
    
    return {
      success: true,
      newJobId,
      message: 'Задача перезапущена с новым ID'
    };
    
  } catch (error: any) {
    console.error('❌ Ошибка перезапуска задачи:', error);
    
    return {
      success: false,
      message: 'Ошибка перезапуска задачи'
    };
  }
}

/**
 * Отмена задачи
 */
export async function cancelOcrJob(jobId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const queueManager = await getQueueManager();
    const cancelled = await queueManager.cancelJob(jobId);
    
    return {
      success: cancelled,
      message: cancelled ? 'Задача отменена' : 'Не удалось отменить задачу (возможно, уже выполняется)'
    };
    
  } catch (error: any) {
    console.error('❌ Ошибка отмены задачи:', error);
    
    return {
      success: false,
      message: 'Ошибка отмены задачи'
    };
  }
}

/**
 * Получение человекочитаемого сообщения по статусу
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'waiting':
      return 'Задача в очереди на обработку';
    case 'active':
      return 'Задача обрабатывается';
    case 'completed':
      return 'Задача выполнена успешно';
    case 'failed':
      return 'Задача завершилась с ошибкой';
    default:
      return 'Неизвестный статус';
  }
}