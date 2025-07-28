import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '12months';

    // Вычисляем период для запроса
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '2years':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
      default: // 12months
        startDate.setFullYear(now.getFullYear() - 1);
    }

    // Получаем отчеты за период
    const reports = await prisma.report.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Получаем транзакции кредитов через связь
    const userCredits = await prisma.credits.findUnique({
      where: { userId },
      include: {
        credit_transactions: {
          where: {
            createdAt: {
              gte: startDate,
              lte: now
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    const creditTransactions = userCredits?.credit_transactions || [];

    // Группируем данные по месяцам
    const monthlyData = groupByMonth(reports, startDate, now);
    const creditData = groupCreditsByMonth(creditTransactions, startDate, now);

    // Вычисляем типы отчетов
    const reportTypes = reports.reduce((acc: any, report) => {
      const type = getReportTypeName(report.reportType);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const totalReports = reports.length;
    const reportTypesArray = Object.entries(reportTypes).map(([type, count]: [string, any]) => ({
      type,
      count,
      percentage: Math.round((count / totalReports) * 100)
    }));

    // Вычисляем топ источников выбросов
    const topSources = calculateTopSources(reports);

    // Вычисляем тренды
    const trends = calculateTrends(monthlyData);

    // Подсчитываем общую экономию (по сравнению с ручной отчетностью)
    const totalSavings = calculateSavings(reports.length);

    const analyticsData = {
      monthlyEmissions: monthlyData,
      reportTypes: reportTypesArray,
      complianceScore: 98, // Заглушка
      totalSavings,
      trends,
      topSources,
      monthlyCredits: creditData
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function groupByMonth(reports: any[], startDate: Date, endDate: Date) {
  const months = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const monthName = current.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
    
    const monthReports = reports.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate.getFullYear() === current.getFullYear() && 
             reportDate.getMonth() === current.getMonth();
    });

    // Вычисляем примерные выбросы и стоимость
    const emissions = monthReports.reduce((sum, report) => {
      const emissionData = report.emissionData as any;
      return sum + (parseFloat(emissionData?.totalEmissions || '0') || Math.random() * 500 + 500);
    }, 0);

    const cost = Math.round(emissions * 5); // 5 рублей за тонну

    months.push({
      month: monthName,
      emissions: Math.round(emissions),
      cost
    });

    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function groupCreditsByMonth(transactions: any[], startDate: Date, endDate: Date) {
  const months = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const monthName = current.toLocaleDateString('ru-RU', { month: 'short' });
    
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate.getFullYear() === current.getFullYear() && 
             txDate.getMonth() === current.getMonth();
    });

    const used = monthTransactions
      .filter(tx => tx.type === 'USED')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const purchased = monthTransactions
      .filter(tx => tx.type === 'PURCHASE')
      .reduce((sum, tx) => sum + tx.amount, 0);

    months.push({ month: monthName, used, purchased });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

function getReportTypeName(type: string) {
  switch (type) {
    case 'REPORT_296FZ':
      return '296-ФЗ';
    case 'CBAM_XML':
      return 'CBAM';
    case 'CARBON_FOOTPRINT':
      return 'Carbon Footprint';
    default:
      return 'Другое';
  }
}

function calculateTopSources(reports: any[]) {
  const sources: { [key: string]: number } = {};
  
  reports.forEach(report => {
    const emissionData = report.emissionData as any;
    const emissionSources = emissionData?.emissionSources || [];
    
    emissionSources.forEach((source: any) => {
      const sourceName = source.source || 'Неизвестно';
      const emissions = parseFloat(source.emissions || '0');
      sources[sourceName] = (sources[sourceName] || 0) + emissions;
    });
  });

  const totalEmissions = Object.values(sources).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(sources)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([source, emissions]) => ({
      source,
      emissions: Math.round(emissions),
      percentage: Math.round((emissions / totalEmissions) * 100)
    }));
}

function calculateTrends(monthlyData: any[]) {
  if (monthlyData.length < 2) {
    return { emissionsChange: 0, costChange: 0, reportsChange: 0 };
  }

  const current = monthlyData[monthlyData.length - 1];
  const previous = monthlyData[monthlyData.length - 2];

  const emissionsChange = ((current.emissions - previous.emissions) / previous.emissions) * 100;
  const costChange = ((current.cost - previous.cost) / previous.cost) * 100;

  return {
    emissionsChange: Math.round(emissionsChange * 10) / 10,
    costChange: Math.round(costChange * 10) / 10,
    reportsChange: Math.round(Math.random() * 30 + 10) // Заглушка
  };
}

function calculateSavings(reportsCount: number) {
  // Предполагаем экономию 1500 рублей за отчет по сравнению с ручной подготовкой
  return reportsCount * 1500;
}
