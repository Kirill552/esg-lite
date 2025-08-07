import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { VersionManager, WorksheetGenerator, type CalculationWorksheet } from '@/lib/versioning';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');
    const snapshotId = url.searchParams.get('snapshotId');

    if (!reportId && !snapshotId) {
      return NextResponse.json({ error: 'Требуется reportId или snapshotId' }, { status: 400 });
    }

    // Получаем расчетные ведомости по reportId или конкретному snapshotId
    let auditTrails;
    
    if (snapshotId) {
      // Генерируем расчетную ведомость для конкретного снапшота
      const worksheet = await VersionManager.generateWorksheet(snapshotId);
      auditTrails = [worksheet];
    } else if (reportId) {
      // Получаем все расчетные ведомости для отчета
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          document: true,
          user: true
        }
      });

      if (!report || report.userId !== userId) {
        return NextResponse.json({ error: 'Отчет не найден или нет доступа' }, { status: 404 });
      }

      // Генерируем расчетную ведомость на основе данных отчета
      auditTrails = await generateAuditTrailFromReport(report);
    }

    return NextResponse.json({
      success: true,
      data: auditTrails
    });

  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json(
      { error: 'Ошибка получения расчетной ведомости' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, recalculate = false } = await request.json();

    if (!reportId) {
      return NextResponse.json({ error: 'Требуется reportId' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        document: true,
        user: true
      }
    });

    if (!report || report.userId !== userId) {
      return NextResponse.json({ error: 'Отчет не найден или нет доступа' }, { status: 404 });
    }

    // Создаем снапшот расчета
    const snapshotId = await VersionManager.createCalculationSnapshot(
      'ESG_REPORT_296FZ',
      'v2025-01-01',
      report.emissionData as any[],
      {
        company_name: report.fileName || 'Не указано', // Используем fileName как fallback
        report_period: new Date(report.createdAt).getFullYear().toString(),
        calculation_timestamp: new Date().toISOString(),
        operator: userId,
        regulation_basis: '296-ФЗ'
      }
    );

    // Генерируем расчетную ведомость
    const worksheet = await generateDetailedWorksheet(report, snapshotId);

    return NextResponse.json({
      success: true,
      data: {
        snapshotId,
        worksheet
      }
    });

  } catch (error) {
    console.error('Error creating audit trail:', error);
    return NextResponse.json(
      { error: 'Ошибка создания расчетной ведомости' },
      { status: 500 }
    );
  }
}

async function generateAuditTrailFromReport(report: any): Promise<CalculationWorksheet[]> {
  const worksheets: CalculationWorksheet[] = [];
  
  // Анализируем данные выбросов из отчета
  const emissionData = report.emissionData as any;
  
  // Проверяем наличие структурированных данных выбросов
  if (!emissionData || !emissionData.emissions || !Array.isArray(emissionData.emissions)) {
    return []; // Возвращаем пустой массив для отчетов без структурированных данных
  }

  // Обрабатываем структурированные данные выбросов
  for (let i = 0; i < emissionData.emissions.length; i++) {
    const emission = emissionData.emissions[i];
    
    const worksheet = await WorksheetGenerator.generateWorksheet(
      `calc_${report.id}_${i}`,
      report.id,
      'E = A × EF × (1 - C/100)', // Стандартная формула для выбросов
      {
        activity_level: emission.activityLevel || 0,
        emission_factor: emission.emissionFactor || 0,
        control_efficiency: emission.controlEfficiency || 0
      },
      {
        EF: emission.emissionFactor || 0,
        CE: emission.controlEfficiency || 0
      },
      'v2025-01-01',
      ['EF_296FZ_v2025.01.01'],
      report.userId
    );

    // Вычисляем результат
    const activityLevel = emission.activityLevel || 0;
    const emissionFactor = emission.emissionFactor || 0;
    const controlEfficiency = emission.controlEfficiency || 0;
    
    worksheet.intermediate_results = {
      gross_emission: activityLevel * emissionFactor,
      control_reduction: (activityLevel * emissionFactor * controlEfficiency) / 100
    };
    
    worksheet.final_result = worksheet.intermediate_results.gross_emission - worksheet.intermediate_results.control_reduction;
    
    worksheet.units_conversion = {
      activity_level: emission.unit || 'tonnes',
      emission_factor: 'tCO2eq/unit',
      final_result: 'tCO2eq'
    };

    // Выполняем верификацию расчета
    const verification = await VersionManager.verifyCalculation(
      worksheet.final_result,
      worksheet.input_values,
      worksheet.method_version,
      worksheet.factor_versions
    );
    
    worksheet.verified = verification.verified;
    worksheet.verification_delta = verification.delta;

    worksheets.push(worksheet);
  }

  return worksheets;
}

async function generateDetailedWorksheet(report: any, snapshotId: string): Promise<CalculationWorksheet> {
  const emissionData = report.emissionData as any;
  const totalEmissions = emissionData?.totalEmissions || 0;
  
  const worksheet: CalculationWorksheet = {
    calculation_id: snapshotId,
    report_id: report.id,
    formula: 'ΣE = Σ(Ai × EFi × (1 - CEi/100))',
    input_values: {
      total_activity: emissionData?.totalActivity || 0,
      average_emission_factor: emissionData?.averageEmissionFactor || 0,
      average_control_efficiency: emissionData?.averageControlEfficiency || 0
    },
    factor_values: {
      EF_avg: emissionData?.averageEmissionFactor || 0
    },
    intermediate_results: {
      gross_emissions: (emissionData?.totalActivity || 0) * (emissionData?.averageEmissionFactor || 0),
      total_control_reduction: totalEmissions * 0.05 // Примерная оценка средней эффективности
    },
    final_result: totalEmissions,
    units_conversion: {
      total_activity: 'tonnes',
      final_result: 'tCO2eq',
      EF_avg: 'tCO2eq/tonne'
    },
    method_version: 'v2025-01-01',
    factor_versions: ['296FZ_v2025.01.01'],
    calculated_at: new Date().toISOString(),
    calculated_by: report.userId,
    verified: false,
    verification_delta: null
  };

  return worksheet;
}
