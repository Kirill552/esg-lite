/**
 * API Endpoint для валидации CBAM XML отчётов
 * 
 * POST /api/cbam/validate-xml
 * 
 * Принимает XML содержимое и валидирует его против XSD схемы CBAM
 * Интегрирован с микросервисом валидации XML
 * 
 * @version 1.0.0
 * @date 2025-08-01
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Конфигурация валидатора
const VALIDATOR_SERVICE_URL = process.env.XML_VALIDATOR_URL || 'http://xml-validator:3001';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Парсим тело запроса
    const body = await request.json();
    const { 
      xmlContent, 
      schemaType = 'cbam-quarterly', 
      includeStructureCheck = true,
      reportId 
    } = body;

    // Валидация входных данных
    if (!xmlContent) {
      return NextResponse.json(
        { error: 'Параметр xmlContent обязателен' },
        { status: 400 }
      );
    }

    if (typeof xmlContent !== 'string') {
      return NextResponse.json(
        { error: 'xmlContent должен быть строкой' },
        { status: 400 }
      );
    }

    console.log(`🔍 Запрос валидации CBAM XML (схема: ${schemaType})`);

    // Отправляем запрос в микросервис валидации
    const validationResponse = await fetch(`${VALIDATOR_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        xmlContent,
        schemaType,
        includeStructureCheck
      })
    });

    if (!validationResponse.ok) {
      const errorText = await validationResponse.text();
      console.error('❌ Ошибка валидации:', errorText);
      
      return NextResponse.json(
        { 
          error: 'Ошибка сервиса валидации', 
          details: errorText,
          serviceUrl: VALIDATOR_SERVICE_URL 
        },
        { status: 502 }
      );
    }

    const validationResult = await validationResponse.json();
    
    // Добавляем метаданные
    const response = {
      ...validationResult,
      metadata: {
        apiVersion: '1.0.0',
        requestTime: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        reportId: reportId || null,
        schemaVersion: '1.4.1.1'
      }
    };

    // Логгируем результат валидации
    const isValid = response.summary?.isValid || false;
    const totalErrors = response.summary?.totalErrors || 0;
    const totalWarnings = response.summary?.totalWarnings || 0;

    console.log(`${isValid ? '✅' : '❌'} CBAM XML валидация: ${totalErrors} ошибок, ${totalWarnings} предупреждений`);

    // Сохраняем результат валидации в БД (если указан reportId)
    if (reportId) {
      try {
        await saveValidationResult(reportId, response);
      } catch (dbError) {
        console.warn('⚠️ Не удалось сохранить результат валидации в БД:', dbError);
        // Не прерываем выполнение, просто логгируем предупреждение
      }
    }

    // Возвращаем результат
    const statusCode = isValid ? 200 : 422;
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('❌ Ошибка API валидации CBAM XML:', error);
    
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
        metadata: {
          apiVersion: '1.0.0',
          requestTime: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET запрос для получения информации о валидаторе
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем статус сервиса валидации
    const healthResponse = await fetch(`${VALIDATOR_SERVICE_URL}/health`);
    
    if (!healthResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Сервис валидации недоступен',
          serviceUrl: VALIDATOR_SERVICE_URL,
          status: 'offline'
        },
        { status: 503 }
      );
    }

    const healthData = await healthResponse.json();
    
    // Получаем список доступных схем
    const schemasResponse = await fetch(`${VALIDATOR_SERVICE_URL}/schemas`);
    const schemasData = schemasResponse.ok ? await schemasResponse.json() : null;

    const info = {
      service: 'CBAM XML Validator API',
      version: '1.0.0',
      status: 'online',
      validator: healthData,
      schemas: schemasData,
      endpoints: {
        validate: 'POST /api/cbam/validate-xml',
        info: 'GET /api/cbam/validate-xml'
      },
      usage: {
        example: {
          method: 'POST',
          url: '/api/cbam/validate-xml',
          body: {
            xmlContent: '<CBAMQuarterlyReport>...</CBAMQuarterlyReport>',
            schemaType: 'cbam-quarterly',
            includeStructureCheck: true,
            reportId: 'optional-report-id'
          }
        }
      }
    };

    return NextResponse.json(info);

  } catch (error) {
    console.error('❌ Ошибка получения информации о валидаторе:', error);
    
    return NextResponse.json(
      {
        error: 'Ошибка получения статуса сервиса валидации',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
        serviceUrl: VALIDATOR_SERVICE_URL
      },
      { status: 500 }
    );
  }
}

/**
 * Сохранение результата валидации в базе данных
 */
async function saveValidationResult(reportId: string, validationResult: any) {
  try {
    // Проверяем существование отчёта
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      console.warn(`⚠️ Отчёт с ID ${reportId} не найден`);
      return;
    }

    // Сохраняем результат валидации
    await prisma.reportValidation.create({
      data: {
        reportId: reportId,
        validationType: 'CBAM_XML',
        isValid: validationResult.summary?.isValid || false,
        errors: validationResult.validation?.errors || [],
        warnings: validationResult.validation?.warnings || [],
        schemaType: validationResult.summary?.schemaUsed || 'cbam-quarterly',
        validationData: validationResult,
        createdAt: new Date()
      }
    });

    console.log(`✅ Результат валидации сохранён для отчёта ${reportId}`);

  } catch (error) {
    console.error(`❌ Ошибка сохранения валидации для отчёта ${reportId}:`, error);
    throw error;
  }
}
