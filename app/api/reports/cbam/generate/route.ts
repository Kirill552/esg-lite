/**
 * API для генерации CBAM отчетов с интегрированным pricing
 * POST /api/reports/cbam/generate - генерация отчета с проверкой подписки
 * POST /api/reports/cbam/preview - предварительный расчет стоимости
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  generateCBAMReportWithPricing,
  getCBAMReportPricing,
  type CBAMReportGenerationData,
  type CBAMReportGenerationOptions
} from '@/lib/enhanced-report-generator';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'generate';
    
    const body = await request.json();
    const { reportData, options = {} }: {
      reportData: CBAMReportGenerationData;
      options?: CBAMReportGenerationOptions;
    } = body;

    // Валидация обязательных полей
    if (!reportData.organizationId) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Не указан organizationId' },
        { status: 400 }
      );
    }

    if (!reportData.org_name) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Не указано название организации' },
        { status: 400 }
      );
    }

    // Обработка предварительного расчета
    if (action === 'preview') {
      const pricingResult = await getCBAMReportPricing(reportData);
      
      if (!pricingResult.success) {
        return NextResponse.json(
          { 
            error: 'Pricing Error',
            message: pricingResult.reason || 'Ошибка при расчете стоимости'
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'preview',
        data: {
          pricing: pricingResult.pricing,
          canGenerate: pricingResult.canGenerate,
          reason: pricingResult.reason,
          organizationId: reportData.organizationId
        },
        meta: {
          timestamp: new Date().toISOString(),
          userId,
          reportType: 'CBAM'
        }
      });
    }

    // Обработка генерации отчета
    if (action === 'generate') {
      const reportResult = await generateCBAMReportWithPricing(reportData, {
        ...options,
        applyCharges: true // Всегда применяем начисления в production
      });

      if (!reportResult.success) {
        const statusCode = reportResult.blocked ? 402 : 400; // 402 Payment Required для блокировки
        
        return NextResponse.json(
          { 
            error: reportResult.blocked ? 'Payment Required' : 'Generation Error',
            message: reportResult.error || 'Ошибка при генерации отчета',
            blocked: reportResult.blocked,
            blockReason: reportResult.blockReason,
            pricing: reportResult.pricingInfo
          },
          { status: statusCode }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'generate',
        data: {
          report: {
            filePath: reportResult.filePath,
            fileName: reportResult.fileName,
            fileSize: reportResult.fileSize
          },
          pricing: reportResult.pricingInfo,
          unreplacedTokens: reportResult.unreplacedTokens
        },
        meta: {
          timestamp: new Date().toISOString(),
          userId,
          reportType: 'CBAM',
          organizationId: reportData.organizationId
        }
      });
    }

    // Неизвестное действие
    return NextResponse.json(
      { 
        error: 'Invalid Action',
        message: `Неизвестное действие: ${action}. Поддерживаются: generate, preview`
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('CBAM report generation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Ошибка при обработке запроса на генерацию CBAM отчета'
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

    // Возвращаем информацию о CBAM генерации
    return NextResponse.json({
      success: true,
      data: {
        supportedActions: ['generate', 'preview'],
        supportedFormats: ['CBAM_XML', 'CBAM_CSV'],
        pricingInfo: {
          ratePerTon: 255,
          currency: 'RUB',
          subscriptionBenefit: 'Бесплатно для владельцев CBAM подписки'
        },
        requiredFields: [
          'organizationId',
          'org_name',
          'org_address',
          'signer_name',
          'sign_date',
          'lineItems[] или product_*_* поля'
        ]
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('CBAM report info API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Ошибка при получении информации о CBAM отчетах'
      },
      { status: 500 }
    );
  }
}
