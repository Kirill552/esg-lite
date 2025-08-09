/**
 * Скрипт для запуска OCR Worker процесса (Production)
 */

require('dotenv').config();

async function startWorker() {
  console.log('🚀 Запуск OCR Worker процесса...');
  console.log('📂 Текущая директория:', process.cwd());
  
  try {
        // Загружаем скомпилированный OCR Worker модуль
        console.log('🔍 Загружаем модуль по абсолютному пути: /app/dist/workers/ocr-worker.js');
        const ocrWorkerModule = require('/app/dist/workers/ocr-worker.js');
        console.log('✅ OCR Worker модуль успешно загружен');    const { startOcrWorker } = ocrWorkerModule;
    
    // Конфигурация worker'а из переменных окружения
    const config = {
      concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '5'),
      pollInterval: 5000,
      maxRetries: 3
    };
    
    console.log('⚙️ Конфигурация worker:', config);
    
    // Запускаем worker
    const worker = await startOcrWorker(config);
    
    console.log('✅ OCR Worker запущен и готов к обработке задач');
    console.log('📋 Для остановки нажмите Ctrl+C');
    
    // Показываем статистику каждые 30 секунд
    setInterval(async () => {
      try {
        const stats = await worker.getWorkerStats();
        console.log('📊 Статистика worker:', {
          running: stats.isRunning,
          queueSize: stats.queueSize,
          concurrency: stats.config.concurrency
        });
      } catch (error) {
        console.error('⚠️ Ошибка получения статистики:', error.message);
      }
    }, 30000);
    
  } catch (error) {
    console.error('❌ Ошибка запуска OCR Worker:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Запускаем worker
startWorker();