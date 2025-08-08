import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ReportType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { getUserInternalId } from '@/lib/user-utils';
import { validateReportData } from '@/lib/report-validation';
import { generateReport, ReportGenerationData } from '@/lib/report-generator';

const prisma = new PrismaClient();

// GET - получение списка отчетов
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем внутренний ID пользователя
    const internalUserId = await getUserInternalId(clerkUserId);

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id: internalUserId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const reports = await prisma.report.findMany({
      where: { userId: internalUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Ошибка получения отчетов:', error);
    
    if (error instanceof Error) {
      // Ошибки аутентификации пользователя
      if (error.message.includes('Не удалось получить данные пользователя')) {
        return NextResponse.json(
          { error: 'Ошибка аутентификации пользователя' },
          { status: 401 }
        );
      }

      // Ошибки базы данных
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Ошибка подключения к базе данных' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST - создание отчета
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📋 Создание отчета:', body);

    // Валидация входных данных
    const validationErrors = validateReportData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Ошибки валидации данных',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Используем транзакцию для обеспечения целостности данных
    const result = await prisma.$transaction(async (tx) => {
      // Получаем или создаем пользователя в базе данных
      const internalUserId = await getUserInternalId(clerkUserId);

      // Проверяем, что пользователь действительно существует
      const user = await tx.user.findUnique({
        where: { id: internalUserId }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Генерируем отчет с использованием нового движка
      const reportType = body.reportType === 'CBAM_QUARTERLY' ? 'CBAM' : '296-FZ';
      
      // Определяем источник данных (для совместимости)
      const companyData = body.companyData || body.emissionData || {};
      const signerData = body.signerData || {};
      
      const reportGenerationData: ReportGenerationData = {
        // Общие поля
        org_name: companyData.companyName || companyData.name || 'Не указано',
        org_address: companyData.address || 'Не указано',
        signer_name: signerData.name || 'Не указано',
        signer_position: signerData.position || 'Не указано',
        signer_pos: signerData.position || 'Не указано',
        sign_date: new Date().toLocaleDateString('ru-RU'),
        generation_date: new Date().toLocaleDateString('ru-RU'),
        generation_time: new Date().toLocaleTimeString('ru-RU'),
        document_id: `${reportType}_${Date.now()}`,
        
        // Поля для 296-FZ
        org_inn: companyData.inn || 'Не указано',
        org_okpo: companyData.okpo || companyData.ogrn || 'Не указано',
        org_oktmo: companyData.oktmo || 'Не указано',
        org_phone: companyData.phone || 'Не указано',
        org_email: companyData.email || 'Не указано',
        report_year: companyData.reportingPeriod || body.reportPeriod || '2025',
        
        // Поля для CBAM
        eori: companyData.eori || 'RU000000000000000',
        cbam_id: companyData.cbamId || 'DL-2025-000000',
        org_country: companyData.country || 'RU',
        report_year_q: body.reportPeriod || '2025-2',
        
        // Данные о выбросах/товарах
        ...body.emissionData,
        ...body.goodsData
      };
      
      const generationResult = await generateReport(reportType, reportGenerationData);
      
      if (!generationResult.success) {
        throw new Error(`Ошибка генерации отчета: ${generationResult.error}`);
      }
      
      // Создаем запись в базе данных
      const reportData = {
        userId: internalUserId,
        reportType: body.reportType as ReportType,
        format: 'PDF',
        fileName: generationResult.fileName || `Report_${Date.now()}.pdf`,
        filePath: generationResult.filePath || '',
        fileSize: generationResult.fileSize || 0,
        emissionData: body.emissionData || {},
        methodology: reportType === 'CBAM' ? 'CBAM-2025' : '296-FZ-2025',
        downloadCount: 0,
        version: 1,
        isLocked: false
      };

      const report = await tx.report.create({
        data: reportData,
      });

      return { report, user, generationResult };
    });

    console.log(`✅ Отчет создан: ${result.report.id}, тип: ${result.report.reportType}, пользователь: ${result.user.id}`);
    
    if (result.generationResult?.unreplacedTokens && result.generationResult.unreplacedTokens.length > 0) {
      console.warn('⚠️ Незамененные токены:', result.generationResult.unreplacedTokens);
    }

    return NextResponse.json({
      ...result.report,
      generationInfo: {
        success: result.generationResult?.success || false,
        unreplacedTokens: result.generationResult?.unreplacedTokens || []
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка при создании отчета:', error);
    
    // Детальная обработка ошибок
    if (error instanceof Error) {
      // Ошибки аутентификации пользователя
      if (error.message.includes('Не удалось получить данные пользователя') || 
          error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Ошибка аутентификации пользователя' },
          { status: 401 }
        );
      }

      // Ошибки базы данных
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Отчет с такими параметрами уже существует' },
          { status: 409 }
        );
      }

      // Ошибки валидации Prisma
      if (error.message.includes('Invalid') || error.message.includes('Required')) {
        return NextResponse.json(
          { error: 'Некорректные данные для создания отчета' },
          { status: 400 }
        );
      }

      // Ошибки транзакций
      if (error.message.includes('Transaction')) {
        return NextResponse.json(
          { error: 'Ошибка транзакции базы данных' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при создании отчета' },
      { status: 500 }
    );
  }
} 