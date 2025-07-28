#!/usr/bin/env node

/**
 * Metrics Exporter для ESG-Lite
 * Экспортирует метрики в формате Prometheus и отправляет в Yandex Cloud Monitoring
 */

const express = require('express');
const { createServer } = require('http');
const { PrismaClient } = require('@prisma/client');

// Импортируем наши модули
const { MetricsCollector } = require('../lib/metrics');
const { HealthMonitor } = require('../lib/health-monitor');
const { createStructuredLogger } = require('../lib/structured-logger');

const prisma = new PrismaClient();
const logger = createStructuredLogger('metrics-exporter');
const metricsCollector = new MetricsCollector();
const healthMonitor = new HealthMonitor();

const app = express();
const PORT = process.env.METRICS_PORT || 9090;
const METRICS_INTERVAL = parseInt(process.env.METRICS_INTERVAL) || 60000; // 1 минута

// ============================================================================
// Prometheus Metrics Endpoint
// ============================================================================
app.get('/metrics', async (req, res) => {
  try {
    logger.info('Generating Prometheus metrics');
    
    // Получаем текущие метрики
    const queueStats = await metricsCollector.getQueueMetrics();
    const healthStats = await healthMonitor.getOverallHealth();
    
    // Время работы приложения
    const uptimeSeconds = Math.floor(process.uptime());
    
    // Формируем Prometheus формат
    const metrics = [
      '# HELP esg_lite_queue_jobs_total Total number of jobs in queue',
      '# TYPE esg_lite_queue_jobs_total counter',
      `esg_lite_queue_jobs_total{state="waiting"} ${queueStats.waiting || 0}`,
      `esg_lite_queue_jobs_total{state="processing"} ${queueStats.processing || 0}`,
      `esg_lite_queue_jobs_total{state="completed"} ${queueStats.completed || 0}`,
      `esg_lite_queue_jobs_total{state="failed"} ${queueStats.failed || 0}`,
      '',
      '# HELP esg_lite_processing_time_seconds Average job processing time',
      '# TYPE esg_lite_processing_time_seconds gauge',
      `esg_lite_processing_time_seconds ${(queueStats.avgProcessingTime || 0) / 1000}`,
      '',
      '# HELP esg_lite_error_rate Error rate percentage',
      '# TYPE esg_lite_error_rate gauge',
      `esg_lite_error_rate ${queueStats.errorRate || 0}`,
      '',
      '# HELP esg_lite_throughput_jobs_per_hour Jobs processed per hour',
      '# TYPE esg_lite_throughput_jobs_per_hour gauge',
      `esg_lite_throughput_jobs_per_hour ${queueStats.throughput || 0}`,
      '',
      '# HELP esg_lite_health_status System health status (1=healthy, 0=unhealthy)',
      '# TYPE esg_lite_health_status gauge',
      `esg_lite_health_status{component="overall"} ${healthStats.status === 'healthy' ? 1 : 0}`,
      `esg_lite_health_status{component="database"} ${healthStats.components?.database?.status === 'healthy' ? 1 : 0}`,
      `esg_lite_health_status{component="queue"} ${healthStats.components?.queue?.status === 'healthy' ? 1 : 0}`,
      '',
      '# HELP esg_lite_uptime_seconds Application uptime in seconds',
      '# TYPE esg_lite_uptime_seconds counter',
      `esg_lite_uptime_seconds ${uptimeSeconds}`,
      '',
      '# HELP esg_lite_memory_usage_bytes Memory usage in bytes',
      '# TYPE esg_lite_memory_usage_bytes gauge',
      `esg_lite_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}`,
      `esg_lite_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}`,
      `esg_lite_memory_usage_bytes{type="external"} ${process.memoryUsage().external}`,
      '',
      '# HELP esg_lite_database_connections Database connection pool status',
      '# TYPE esg_lite_database_connections gauge',
      `esg_lite_database_connections{state="active"} ${healthStats.components?.database?.connections?.active || 0}`,
      `esg_lite_database_connections{state="idle"} ${healthStats.components?.database?.connections?.idle || 0}`,
    ].join('\n');
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
    
    logger.info('Prometheus metrics exported successfully');
    
  } catch (error) {
    logger.error('Failed to generate metrics', { error: error.message });
    res.status(500).send('# Error generating metrics\n');
  }
});

// ============================================================================
// Health Check Endpoint
// ============================================================================
app.get('/health', async (req, res) => {
  try {
    const health = await healthMonitor.getOverallHealth();
    
    if (health.status === 'healthy') {
      res.status(200).json(health);
    } else {
      res.status(503).json(health);
    }
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// JSON Metrics Endpoint
// ============================================================================
app.get('/metrics/json', async (req, res) => {
  try {
    const queueStats = await metricsCollector.getQueueMetrics();
    const healthStats = await healthMonitor.getOverallHealth();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      queue: queueStats,
      health: healthStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        environment: process.env.NODE_ENV
      }
    };
    
    res.json(metrics);
    
  } catch (error) {
    logger.error('Failed to generate JSON metrics', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Periodic Metrics Collection
// ============================================================================
async function collectAndExportMetrics() {
  try {
    logger.info('Starting periodic metrics collection');
    
    const queueStats = await metricsCollector.getQueueMetrics();
    const healthStats = await healthMonitor.getOverallHealth();
    
    // Отправляем в Yandex Cloud Monitoring
    if (process.env.YANDEX_MONITORING_ENABLED === 'true') {
      await metricsCollector.sendToYandexCloud({
        'queue.jobs.waiting': queueStats.waiting || 0,
        'queue.jobs.processing': queueStats.processing || 0,
        'queue.jobs.completed': queueStats.completed || 0,
        'queue.jobs.failed': queueStats.failed || 0,
        'queue.processing_time_avg': queueStats.avgProcessingTime || 0,
        'queue.error_rate': queueStats.errorRate || 0,
        'queue.throughput': queueStats.throughput || 0,
        'system.uptime': process.uptime(),
        'system.memory.heap_used': process.memoryUsage().heapUsed,
        'system.memory.heap_total': process.memoryUsage().heapTotal,
        'health.overall': healthStats.status === 'healthy' ? 1 : 0,
        'health.database': healthStats.components?.database?.status === 'healthy' ? 1 : 0,
        'health.queue': healthStats.components?.queue?.status === 'healthy' ? 1 : 0,
      });
      
      logger.info('Metrics sent to Yandex Cloud successfully');
    }
    
    // Сохраняем метрики локально для исторических данных
    await metricsCollector.saveMetrics({
      timestamp: new Date(),
      queue_stats: queueStats,
      health_stats: healthStats,
      system_stats: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });
    
  } catch (error) {
    logger.error('Failed to collect and export metrics', { 
      error: error.message,
      stack: error.stack 
    });
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  try {
    // Останавливаем periodic collection
    if (metricsInterval) {
      clearInterval(metricsInterval);
      logger.info('Stopped metrics collection interval');
    }
    
    // Закрываем HTTP сервер
    server.close(() => {
      logger.info('HTTP server closed');
    });
    
    // Закрываем Prisma соединение
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    process.exit(0);
    
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
}

// ============================================================================
// Startup
// ============================================================================
async function startMetricsExporter() {
  try {
    // Проверяем подключение к базе данных
    await prisma.$connect();
    logger.info('Connected to database');
    
    // Запускаем HTTP сервер
    const server = createServer(app);
    
    server.listen(PORT, () => {
      logger.info(`Metrics exporter started on port ${PORT}`, {
        endpoints: {
          prometheus: `http://localhost:${PORT}/metrics`,
          json: `http://localhost:${PORT}/metrics/json`,
          health: `http://localhost:${PORT}/health`
        },
        interval: METRICS_INTERVAL
      });
    });
    
    // Запускаем periodic collection
    const metricsInterval = setInterval(collectAndExportMetrics, METRICS_INTERVAL);
    
    // Собираем метрики сразу при старте
    await collectAndExportMetrics();
    
    // Обработчики сигналов для graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return { server, metricsInterval };
    
  } catch (error) {
    logger.error('Failed to start metrics exporter', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

// Запускаем exporter если файл запущен напрямую
if (require.main === module) {
  startMetricsExporter();
}

module.exports = { startMetricsExporter };
