/**
 * API для расчета стоимости CBAM отчетов
 * POST /api/cbam/pricing - расчет стоимости
 * GET /api/cbam/pricing/info - информация о тарифах
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  calculateCBAMPricing, 
  validateCBAMLineItems,
  getCBAMPricingInfo,
  type CBAMPricingRequest 
} from '@/lib/cbam-pricing';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId, lineItems, reportType }: CBAMPricingRequest = body;

    // Валидация входных данных
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Не указан organizationId' },
        { status: 400 }
      );
    }

    if (!reportType || !['CBAM_XML', 'CBAM_CSV'].includes(reportType)) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Некорректный тип отчета. Поддерживаются: CBAM_XML, CBAM_CSV' 
        },
        { status: 400 }
      );
    }

    // Валидация строк CBAM
    const validation = validateCBAMLineItems(lineItems);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Ошибки в данных CBAM',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Расчет стоимости
    const pricingCalculation = await calculateCBAMPricing({
      organizationId,
      lineItems,
      reportType
    });

    return NextResponse.json({
      success: true,
      data: pricingCalculation,
      meta: {
        timestamp: new Date().toISOString(),
        reportType,
        lineCount: lineItems.length
      }
    });

  } catch (error) {
    console.error('CBAM pricing calculation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Ошибка при расчете стоимости CBAM отчета'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const pricingInfo = getCBAMPricingInfo();

    return NextResponse.json({
      success: true,
      data: pricingInfo,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('CBAM pricing info error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Ошибка при получении информации о тарифах CBAM'
      },
      { status: 500 }
    );
  }
}
