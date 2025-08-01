#!/usr/bin/env node

/**
 * CBAM XML Validation HTTP Server
 * Микросервис для валидации XML отчётов CBAM
 * 
 * Endpoints:
 * POST /validate - валидация XML файла
 * GET /health - проверка работоспособности
 * GET /schemas - список доступных схем
 * 
 * @version 1.0.0
 * @date 2025-08-01
 * @author ESG-Lite Team
 */

const http = require('http');
const url = require('url');
const { XMLValidator } = require('../lib/xml-validator');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

class ValidationServer {
  constructor() {
    this.validator = new XMLValidator();
    this.server = null;
    this.stats = {
      startTime: new Date(),
      requests: 0,
      validations: 0,
      errors: 0
    };
  }

  /**
   * Запуск HTTP сервера
   */
  async start() {
    try {
      await this.validator.init();
      console.log('✅ XML Validator инициализирован');

      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(PORT, HOST, () => {
        console.log(`🚀 CBAM XML Validation Server запущен`);
        console.log(`📡 Слушает на http://${HOST}:${PORT}`);
        console.log(`🔍 Готов к валидации XML отчётов CBAM`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      console.error('❌ Ошибка запуска сервера:', error.message);
      process.exit(1);
    }
  }

  /**
   * Обработка HTTP запросов
   */
  async handleRequest(req, res) {
    this.stats.requests++;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    try {
      switch (path) {
        case '/validate':
          await this.handleValidation(req, res);
          break;
        case '/health':
          await this.handleHealth(req, res);
          break;
        case '/schemas':
          await this.handleSchemas(req, res);
          break;
        case '/stats':
          await this.handleStats(req, res);
          break;
        default:
          this.sendResponse(res, 404, { error: 'Endpoint не найден' });
      }
    } catch (error) {
      console.error('❌ Ошибка обработки запроса:', error);
      this.stats.errors++;
      this.sendResponse(res, 500, { 
        error: 'Внутренняя ошибка сервера',
        message: error.message 
      });
    }
  }

  /**
   * Обработка валидации XML
   */
  async handleValidation(req, res) {
    if (req.method !== 'POST') {
      this.sendResponse(res, 405, { error: 'Метод не поддерживается. Используйте POST' });
      return;
    }

    const body = await this.readRequestBody(req);
    
    if (!body) {
      this.sendResponse(res, 400, { error: 'Пустое тело запроса' });
      return;
    }

    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (error) {
      this.sendResponse(res, 400, { error: 'Некорректный JSON' });
      return;
    }

    const { xmlContent, schemaType = 'cbam-quarterly', includeStructureCheck = true } = requestData;

    if (!xmlContent) {
      this.sendResponse(res, 400, { error: 'Параметр xmlContent обязателен' });
      return;
    }

    console.log(`🔍 Запрос валидации XML (схема: ${schemaType})`);
    this.stats.validations++;

    try {
      // Основная валидация по XSD
      const validationResult = await this.validator.validateCBAMReport(xmlContent, schemaType);
      
      // Дополнительная проверка структуры CBAM
      let structureResult = null;
      if (includeStructureCheck && schemaType === 'cbam-quarterly') {
        structureResult = await this.validator.validateCBAMStructure(xmlContent);
      }

      const response = {
        validation: validationResult,
        structure: structureResult,
        summary: {
          isValid: validationResult.isValid && (structureResult ? structureResult.isValid : true),
          totalErrors: validationResult.errors.length + (structureResult ? structureResult.issues.length : 0),
          totalWarnings: validationResult.warnings.length,
          schemaUsed: schemaType,
          validatedAt: new Date().toISOString()
        }
      };

      const statusCode = response.summary.isValid ? 200 : 422;
      
      console.log(`${response.summary.isValid ? '✅' : '❌'} Валидация завершена: ${response.summary.totalErrors} ошибок, ${response.summary.totalWarnings} предупреждений`);
      
      this.sendResponse(res, statusCode, response);

    } catch (error) {
      console.error('❌ Ошибка валидации:', error);
      this.sendResponse(res, 500, {
        error: 'Ошибка при валидации XML',
        message: error.message
      });
    }
  }

  /**
   * Проверка работоспособности сервиса
   */
  async handleHealth(req, res) {
    try {
      const schemas = await this.validator.getAvailableSchemas();
      const uptime = Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000);
      
      const health = {
        status: 'healthy',
        uptime: uptime,
        version: '1.0.0',
        service: 'CBAM XML Validator',
        schemasLoaded: Object.keys(schemas).length,
        stats: {
          totalRequests: this.stats.requests,
          totalValidations: this.stats.validations,
          totalErrors: this.stats.errors
        },
        timestamp: new Date().toISOString()
      };

      this.sendResponse(res, 200, health);
    } catch (error) {
      this.sendResponse(res, 503, {
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  /**
   * Получение списка доступных схем
   */
  async handleSchemas(req, res) {
    try {
      const schemas = await this.validator.getAvailableSchemas();
      
      const response = {
        schemas,
        totalSchemas: Object.keys(schemas).length,
        supportedTypes: ['cbam-quarterly', 'cbam-shared'],
        defaultSchema: 'cbam-quarterly-report.xsd'
      };

      this.sendResponse(res, 200, response);
    } catch (error) {
      this.sendResponse(res, 500, {
        error: 'Ошибка получения списка схем',
        message: error.message
      });
    }
  }

  /**
   * Получение статистики сервера
   */
  async handleStats(req, res) {
    const uptime = Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000);
    
    const stats = {
      server: {
        startTime: this.stats.startTime.toISOString(),
        uptime,
        uptimeFormatted: this.formatUptime(uptime)
      },
      requests: {
        total: this.stats.requests,
        validations: this.stats.validations,
        errors: this.stats.errors,
        successRate: this.stats.requests > 0 ? 
          ((this.stats.requests - this.stats.errors) / this.stats.requests * 100).toFixed(2) + '%' : 'N/A'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        pid: process.pid
      }
    };

    this.sendResponse(res, 200, stats);
  }

  /**
   * Чтение тела HTTP запроса
   */
  readRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        resolve(body);
      });
      
      req.on('error', error => {
        reject(error);
      });

      // Таймаут для больших файлов
      const timeout = setTimeout(() => {
        req.destroy();
        reject(new Error('Превышен таймаут чтения запроса'));
      }, 30000); // 30 секунд

      req.on('end', () => clearTimeout(timeout));
    });
  }

  /**
   * Отправка HTTP ответа
   */
  sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Форматирование времени работы
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}д ${hours}ч ${minutes}м ${secs}с`;
    } else if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('\n🛑 Получен сигнал завершения работы...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ HTTP сервер остановлен');
        console.log('📊 Финальная статистика:');
        console.log(`   - Всего запросов: ${this.stats.requests}`);
        console.log(`   - Валидаций выполнено: ${this.stats.validations}`);
        console.log(`   - Ошибок: ${this.stats.errors}`);
        console.log('👋 До свидания!');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Запуск сервера
if (require.main === module) {
  const server = new ValidationServer();
  server.start().catch(error => {
    console.error('💥 Критическая ошибка запуска:', error);
    process.exit(1);
  });
}

module.exports = ValidationServer;
