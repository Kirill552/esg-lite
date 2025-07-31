import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ReportType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { getUserInternalId } from '@/lib/user-utils';
import fs from 'fs';
import path from 'path';
import { generate296FZReport, generateCBAMReport, ReportGenerationData } from '@/lib/report-generator';

// Типы для отчетов
interface EsgReportData {
  documentId: string;
  companyName: string;
  fullCompanyName: string;
  inn: string;
  ogrn: string;
  kpp: string;
  reportingPeriod: string;
  emissionSources: Array<{
    source: string;
    activity: string;
    unit: string;
    emissionFactor: string;
    emissions: string;
  }>;
  totalEmissions: string;
  methodology: string;
  createdAt: string;
}

interface CbamDeclarationData {
  documentId: string;
  companyName: string;
  eori: string;
  quarter: string;
  goods: Array<{
    cnCode: string;
    goodType: string;
    quantity: string;
    unit: string;
    totalEmissions: string;
  }>;
  totalQuantity: string;
  totalEmissions: string;
  createdAt: string;
}

// Функции генерации PDF (заглушки, пока не реализованы)
async function generateEsgReportPdf(data: EsgReportData): Promise<Buffer> {
  // Временная заглушка - возвращаем простой PDF
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const html = `
    <html>
      <head><title>ESG Отчет 296-ФЗ</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>Отчет о выбросах парниковых газов</h1>
        <p><strong>Организация:</strong> ${data.companyName}</p>
        <p><strong>ИНН:</strong> ${data.inn}</p>
        <p><strong>Отчетный период:</strong> ${data.reportingPeriod}</p>
        <p><strong>Общие выбросы:</strong> ${data.totalEmissions} тCO₂-экв</p>
        <h2>Источники выбросов:</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr><th>Источник</th><th>Активность</th><th>Единица</th><th>Коэффициент</th><th>Выбросы</th></tr>
          ${data.emissionSources.map(source => `
            <tr>
              <td>${source.source}</td>
              <td>${source.activity}</td>
              <td>${source.unit}</td>
              <td>${source.emissionFactor}</td>
              <td>${source.emissions}</td>
            </tr>
          `).join('')}
        </table>
        <p><strong>Дата создания:</strong> ${data.createdAt}</p>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  
  return Buffer.from(pdfBuffer);
}

async function generateCbamDeclarationPdf(data: CbamDeclarationData): Promise<Buffer> {
  // Временная заглушка - возвращаем простой PDF
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const html = `
    <html>
      <head><title>CBAM Декларация</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>CBAM Quarterly Declaration</h1>
        <p><strong>Company:</strong> ${data.companyName}</p>
        <p><strong>EORI:</strong> ${data.eori}</p>
        <p><strong>Quarter:</strong> ${data.quarter}</p>
        <p><strong>Total Emissions:</strong> ${data.totalEmissions} tCO₂-eq</p>
        <h2>Goods:</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr><th>CN Code</th><th>Good Type</th><th>Quantity</th><th>Unit</th><th>Emissions</th></tr>
          ${data.goods.map(good => `
            <tr>
              <td>${good.cnCode}</td>
              <td>${good.goodType}</td>
              <td>${good.quantity}</td>
              <td>${good.unit}</td>
              <td>${good.totalEmissions}</td>
            </tr>
          `).join('')}
        </table>
        <p><strong>Created:</strong> ${data.createdAt}</p>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  
  return Buffer.from(pdfBuffer);
}

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    console.log(`🔍 [DOWNLOAD] Trying to access report with clerkUserId: ${clerkUserId}`);
    
    if (!clerkUserId) {
      console.log('❌ [DOWNLOAD] No clerkUserId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем внутренний ID пользователя
    const internalUserId = await getUserInternalId(clerkUserId);
    console.log(`🔍 [DOWNLOAD] Internal userId: ${internalUserId}`);

    const { id } = await params;
    console.log(`🔍 [DOWNLOAD] Looking for report ID: ${id}`);

    // Находим отчет
    const report = await prisma.report.findFirst({
      where: { id, userId: internalUserId }
    });

    console.log(`🔍 [DOWNLOAD] Found report:`, report ? 'YES' : 'NO');

    if (!report) {
      // Пробуем найти отчет без userId для отладки
      const anyReport = await prisma.report.findFirst({
        where: { id }
      });
      console.log(`🔍 [DOWNLOAD] Report exists without userId filter:`, anyReport ? 'YES' : 'NO');
      if (anyReport) {
        console.log(`🔍 [DOWNLOAD] Report belongs to userId: ${anyReport.userId}`);
      }
      
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Обновляем счетчик скачиваний
    await prisma.report.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    // Если файл уже существует, отправляем его
    if (report.filePath && fs.existsSync(report.filePath)) {
      const fileBuffer = fs.readFileSync(report.filePath);
      const response = new NextResponse(fileBuffer);
      
      response.headers.set('Content-Type', 'application/pdf');
      response.headers.set('Content-Disposition', `attachment; filename="${report.fileName}"`);
      
      console.log(`📥 Готовый отчет скачан: ${report.fileName}`);
      return response;
    }

    // Генерируем PDF в реальном времени
    console.log(`🔄 Генерация PDF для отчета: ${report.reportType}`);
    
    let pdfBuffer: Buffer;

    // Приводим emissionData к правильному типу
    const emissionData = report.emissionData as any;

    switch (report.reportType as string) {
      case 'REPORT_296FZ':
        // Генерируем 296-ФЗ отчет
        const esgData: EsgReportData = {
          documentId: report.id,
          companyName: emissionData?.companyName || 'Не указано',
          fullCompanyName: emissionData?.fullCompanyName || emissionData?.companyName || 'Не указано',
          inn: emissionData?.inn || '0000000000',
          ogrn: emissionData?.ogrn || '0000000000000',
          kpp: emissionData?.kpp || '',
          reportingPeriod: emissionData?.reportingPeriod || new Date().getFullYear().toString(),
          emissionSources: emissionData?.emissionSources || [
            {
              source: 'Электроэнергия',
              activity: '1000',
              unit: 'кВт·ч',
              emissionFactor: '0.322',
              emissions: '322.0'
            },
            {
              source: 'Природный газ',
              activity: '500',
              unit: 'м³',
              emissionFactor: '2.349',
              emissions: '1174.5'
            }
          ],
          totalEmissions: emissionData?.totalEmissions || '1496.5',
          methodology: report.methodology || '296-ФЗ-2025',
          createdAt: new Date().toLocaleDateString('ru-RU')
        };
        
        pdfBuffer = await generateEsgReportPdf(esgData);
        break;

      case 'CBAM_XML':
        // Генерируем CBAM отчет
        const cbamData: CbamDeclarationData = {
          documentId: report.id,
          companyName: emissionData?.companyName || 'Не указано',
          eori: emissionData?.eori || 'RU000000000000000',
          quarter: emissionData?.quarter || 'Q1 2025',
          goods: emissionData?.goods || [
            {
              cnCode: '7208 51 200',
              goodType: 'Steel sheets, hot-rolled',
              quantity: '100.0',
              unit: 'tonnes',
              totalEmissions: '250.5'
            },
            {
              cnCode: '2710 12 410',
              goodType: 'Light petroleum distillates',
              quantity: '50.0',
              unit: 'tonnes',
              totalEmissions: '125.8'
            }
          ],
          totalQuantity: emissionData?.totalQuantity || '150.0 tonnes',
          totalEmissions: emissionData?.totalEmissions || '376.3',
          createdAt: new Date().toLocaleDateString('ru-RU')
        };
        
        pdfBuffer = await generateCbamDeclarationPdf(cbamData);
        break;

      case 'CARBON_FOOTPRINT':
        // Генерируем отчет по углеродному следу (используем 296-ФЗ шаблон)
        const carbonData: EsgReportData = {
          documentId: report.id,
          companyName: emissionData?.companyName || 'Не указано',
          fullCompanyName: emissionData?.fullCompanyName || emissionData?.companyName || 'Не указано',
          inn: emissionData?.inn || '0000000000',
          ogrn: emissionData?.ogrn || '0000000000000',
          kpp: emissionData?.kpp || '',
          reportingPeriod: emissionData?.reportingPeriod || new Date().getFullYear().toString(),
          emissionSources: emissionData?.emissionSources || [
            {
              source: 'Scope 1: Прямые выбросы',
              activity: '1500',
              unit: 'кВт·ч',
              emissionFactor: '0.322',
              emissions: '483.0'
            },
            {
              source: 'Scope 2: Косвенные выбросы (энергия)',
              activity: '2000',
              unit: 'кВт·ч',
              emissionFactor: '0.408',
              emissions: '816.0'
            },
            {
              source: 'Scope 3: Прочие косвенные выбросы',
              activity: '500',
              unit: 'т км',
              emissionFactor: '0.151',
              emissions: '75.5'
            }
          ],
          totalEmissions: emissionData?.totalEmissions || '1374.5',
          methodology: 'GHG Protocol / ISO 14067',
          createdAt: new Date().toLocaleDateString('ru-RU')
        };
        
        pdfBuffer = await generateEsgReportPdf(carbonData);
        break;

      default:
        throw new Error(`Неподдерживаемый тип отчета: ${report.reportType}`);
    }

    // Возвращаем PDF
    const response = new NextResponse(pdfBuffer);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${report.fileName}"`);
    
    console.log(`✅ PDF сгенерирован и отправлен: ${report.fileName} (${pdfBuffer.length} байт)`);
    
    return response;

  } catch (error) {
    console.error('Ошибка генерации/скачивания отчета:', error);
    
    // В случае ошибки генерации, создаем простую заглушку
    const errorPdf = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 120
>>
stream
BT
/F1 12 Tf
100 700 Td
(Ошибка генерации отчета) Tj
0 -20 Td
(Error generating report) Tj
0 -20 Td
(Свяжитесь с технической поддержкой) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`);

    const response = new NextResponse(errorPdf);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="error_report.pdf"`);
    
    return response;
  }
} 