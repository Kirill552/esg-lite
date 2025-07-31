import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ReportType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
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
      <head>
        <meta charset="UTF-8">
        <title>Отчет 296-ФЗ</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2563eb; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Отчет о выбросах парниковых газов (296-ФЗ)</h1>
        <p><strong>Организация:</strong> ${data.companyName}</p>
        <p><strong>Полное наименование:</strong> ${data.fullCompanyName}</p>
        <p><strong>ИНН:</strong> ${data.inn}</p>
        <p><strong>ОГРН:</strong> ${data.ogrn}</p>
        <p><strong>КПП:</strong> ${data.kpp}</p>
        <p><strong>Отчетный период:</strong> ${data.reportingPeriod}</p>
        <p><strong>Общие выбросы:</strong> ${data.totalEmissions} т CO₂-экв</p>
        <h2>Источники выбросов:</h2>
        <table>
          <tr><th>Источник</th><th>Активность</th><th>Единица</th><th>Фактор</th><th>Выбросы</th></tr>
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
        <p><strong>Методология:</strong> ${data.methodology}</p>
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
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>CBAM Declaration</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2563eb; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>CBAM Declaration</h1>
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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Находим отчет
    const report = await prisma.report.findFirst({
      where: { id, userId }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Если файл уже существует, отправляем его
    if (report.filePath && fs.existsSync(report.filePath)) {
      const fileBuffer = fs.readFileSync(report.filePath);
      const response = new NextResponse(fileBuffer);
      
      response.headers.set('Content-Type', 'application/pdf');
      response.headers.set('Content-Disposition', `inline; filename="${report.fileName}"`);
      
      console.log(`👁️ Отчет открыт для просмотра: ${report.fileName}`);
      return response;
    }

    // Генерируем PDF в реальном времени для просмотра
    console.log(`🔄 Генерация PDF для просмотра: ${report.reportType}`);
    
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
            }
          ],
          totalQuantity: emissionData?.totalQuantity || '100.0 tonnes',
          totalEmissions: emissionData?.totalEmissions || '250.5',
          createdAt: new Date().toLocaleDateString('ru-RU')
        };
        
        pdfBuffer = await generateCbamDeclarationPdf(cbamData);
        break;

      default:
        // Для других типов отчетов используем 296-ФЗ шаблон
        const defaultData: EsgReportData = {
          documentId: report.id,
          companyName: emissionData?.companyName || 'Не указано',
          fullCompanyName: emissionData?.fullCompanyName || emissionData?.companyName || 'Не указано',
          inn: emissionData?.inn || '0000000000',
          ogrn: emissionData?.ogrn || '0000000000000',
          kpp: emissionData?.kpp || '',
          reportingPeriod: emissionData?.reportingPeriod || new Date().getFullYear().toString(),
          emissionSources: emissionData?.emissionSources || [],
          totalEmissions: emissionData?.totalEmissions || '0',
          methodology: report.methodology || 'Стандартная методика',
          createdAt: new Date().toLocaleDateString('ru-RU')
        };
        
        pdfBuffer = await generateEsgReportPdf(defaultData);
        break;
    }

    const response = new NextResponse(pdfBuffer);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `inline; filename="${report.fileName}"`);
    
    console.log(`✅ PDF сгенерирован для просмотра: ${report.fileName}`);
    return response;

  } catch (error) {
    console.error('Ошибка генерации PDF для просмотра:', error);
    
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
(Ошибка генерации отчета для просмотра) Tj
0 -20 Td
(Error generating report for view) Tj
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
    response.headers.set('Content-Disposition', `inline; filename="error_report_view.pdf"`);
    
    return response;
  }
}
