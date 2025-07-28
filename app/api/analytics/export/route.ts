import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const range = searchParams.get('range') || '12months';

    // Получаем данные аналитики (повторяем логику из основного API)
    const analyticsData = await getAnalyticsData(userId, range);

    switch (format) {
      case 'csv':
        return generateCSV(analyticsData);
      case 'xlsx':
        return generateExcel(analyticsData);
      case 'pdf':
        return generatePDF(analyticsData);
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAnalyticsData(userId: string, range: string) {
  // Заглушка данных для экспорта
  return {
    summary: {
      period: range,
      totalReports: 45,
      totalEmissions: 14850,
      totalCost: 85300,
      complianceScore: 98
    },
    monthlyData: [
      { month: 'Янв 2024', emissions: 1200, cost: 6000, reports: 4 },
      { month: 'Фев 2024', emissions: 1150, cost: 5750, reports: 3 },
      { month: 'Мар 2024', emissions: 1300, cost: 6500, reports: 4 },
      { month: 'Апр 2024', emissions: 1100, cost: 5500, reports: 3 },
      { month: 'Май 2024', emissions: 1250, cost: 6250, reports: 4 },
      { month: 'Июн 2024', emissions: 1400, cost: 14000, reports: 5 }, // Surge pricing
      { month: 'Июл 2024', emissions: 1180, cost: 5900, reports: 4 },
      { month: 'Авг 2024', emissions: 1220, cost: 6100, reports: 4 },
      { month: 'Сен 2024', emissions: 1050, cost: 5250, reports: 3 },
      { month: 'Окт 2024', emissions: 1350, cost: 6750, reports: 4 },
      { month: 'Ноя 2024', emissions: 1280, cost: 6400, reports: 4 },
      { month: 'Дек 2024', emissions: 1150, cost: 5750, reports: 3 }
    ],
    reportTypes: [
      { type: '296-ФЗ', count: 24, percentage: 60 },
      { type: 'CBAM', count: 12, percentage: 30 },
      { type: 'Carbon Footprint', count: 4, percentage: 10 }
    ],
    topSources: [
      { source: 'Электроэнергия', emissions: 4500, percentage: 35 },
      { source: 'Природный газ', emissions: 3200, percentage: 25 },
      { source: 'Транспорт', emissions: 2800, percentage: 22 },
      { source: 'Производство', emissions: 1500, percentage: 12 },
      { source: 'Прочее', emissions: 800, percentage: 6 }
    ]
  };
}

function generateCSV(data: any) {
  const csvContent = [
    // Заголовок
    'ESG-Lite Analytics Export',
    `Generated: ${new Date().toLocaleDateString('ru-RU')}`,
    `Period: ${data.summary.period}`,
    '',
    // Общая статистика
    'Summary Statistics',
    'Metric,Value',
    `Total Reports,${data.summary.totalReports}`,
    `Total Emissions (t CO2),${data.summary.totalEmissions}`,
    `Total Cost (RUB),${data.summary.totalCost}`,
    `Compliance Score (%),${data.summary.complianceScore}`,
    '',
    // Помесячные данные
    'Monthly Data',
    'Month,Emissions (t CO2),Cost (RUB),Reports Count',
    ...data.monthlyData.map((month: any) => 
      `${month.month},${month.emissions},${month.cost},${month.reports}`
    ),
    '',
    // Типы отчетов
    'Report Types',
    'Type,Count,Percentage',
    ...data.reportTypes.map((type: any) => 
      `${type.type},${type.count},${type.percentage}%`
    ),
    '',
    // Топ источники
    'Top Emission Sources',
    'Source,Emissions (t CO2),Percentage',
    ...data.topSources.map((source: any) => 
      `${source.source},${source.emissions},${source.percentage}%`
    )
  ].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="esg_analytics_${data.summary.period}.csv"`,
      'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString()
    }
  });
}

async function generateExcel(data: any) {
  // Заглушка для Excel - возвращаем CSV с правильными заголовками
  const csvContent = generateCSVContent(data);
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="esg_analytics_${data.summary.period}.xls"`,
      'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString()
    }
  });
}

async function generatePDF(data: any) {
  const puppeteer = require('puppeteer');
  
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const html = `
      <html>
        <head>
          <title>ESG Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #059669; }
            .metric-label { color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .chart-placeholder { background: #f3f4f6; height: 200px; display: flex; align-items: center; justify-content: center; margin: 20px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 ESG Analytics Report</h1>
            <p>Generated: ${new Date().toLocaleDateString('ru-RU')}</p>
            <p>Period: ${data.summary.period}</p>
          </div>
          
          <div class="summary">
            <div class="metric">
              <div class="metric-value">${data.summary.totalReports}</div>
              <div class="metric-label">Total Reports</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.summary.totalEmissions.toLocaleString()}</div>
              <div class="metric-label">Total Emissions (t CO₂)</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.summary.totalCost.toLocaleString()} ₽</div>
              <div class="metric-label">Total Cost</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.summary.complianceScore}%</div>
              <div class="metric-label">Compliance Score</div>
            </div>
          </div>

          <h2>Monthly Emissions Trend</h2>
          <div class="chart-placeholder">
            [Chart: Monthly emissions data would be visualized here]
          </div>
          
          <h2>Monthly Data</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Emissions (t CO₂)</th>
                <th>Cost (₽)</th>
                <th>Reports</th>
              </tr>
            </thead>
            <tbody>
              ${data.monthlyData.map((month: any) => `
                <tr>
                  <td>${month.month}</td>
                  <td>${month.emissions}</td>
                  <td>${month.cost.toLocaleString()}</td>
                  <td>${month.reports}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Report Types Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>Report Type</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${data.reportTypes.map((type: any) => `
                <tr>
                  <td>${type.type}</td>
                  <td>${type.count}</td>
                  <td>${type.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Top Emission Sources</h2>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Emissions (t CO₂)</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${data.topSources.map((source: any) => `
                <tr>
                  <td>${source.source}</td>
                  <td>${source.emissions}</td>
                  <td>${source.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });
    
    await browser.close();
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="esg_analytics_${data.summary.period}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

function generateCSVContent(data: any) {
  return [
    'ESG-Lite Analytics Export',
    `Generated: ${new Date().toLocaleDateString('ru-RU')}`,
    `Period: ${data.summary.period}`,
    '',
    'Summary Statistics',
    'Metric,Value',
    `Total Reports,${data.summary.totalReports}`,
    `Total Emissions (t CO2),${data.summary.totalEmissions}`,
    `Total Cost (RUB),${data.summary.totalCost}`,
    `Compliance Score (%),${data.summary.complianceScore}`,
    '',
    'Monthly Data',
    'Month,Emissions (t CO2),Cost (RUB),Reports Count',
    ...data.monthlyData.map((month: any) => 
      `${month.month},${month.emissions},${month.cost},${month.reports}`
    ),
    '',
    'Report Types',
    'Type,Count,Percentage',
    ...data.reportTypes.map((type: any) => 
      `${type.type},${type.count},${type.percentage}%`
    ),
    '',
    'Top Emission Sources',
    'Source,Emissions (t CO2),Percentage',
    ...data.topSources.map((source: any) => 
      `${source.source},${source.emissions},${source.percentage}%`
    )
  ].join('\n');
}
