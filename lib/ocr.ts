// lib/ocr.ts
import { createWorker, Worker } from 'tesseract.js';
import ExcelJS from 'exceljs';
import { getFileBuffer } from './s3';

const DEBUG = process.env.DEBUG_OCR === 'true';
const log = (...args: any[]) => DEBUG && console.log('🔍 OCR:', ...args);

let worker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (worker) return worker;

  log('Initializing Tesseract worker...');
  
  try {
    // Простая инициализация для Tesseract.js 4.x
    worker = await createWorker({
      logger: (m: any) => {
        if (DEBUG) {
          console.log(`🔍 OCR: ${m.status} ${m.progress ? `${Math.round(m.progress * 100)}%` : ''}`);
        }
      }
    });
    
    await worker.loadLanguage('eng+rus');
    await worker.initialize('eng+rus');
    
    log('Tesseract worker initialized successfully');
    return worker;
  } catch (error: any) {
    log('Tesseract worker initialization failed:', error.message);
    throw new Error(`TESSERACT_INIT_FAILED: ${error.message}`);
  }
}

export async function closeWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
    log('Tesseract worker terminated');
  }
}

export async function processPdfBuffer(buf: Buffer): Promise<string> {
  try {
    // гарантия, что это именно Buffer
    const dataBuffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);

    // берём «чистый» CommonJS модуль, чтобы webpack не подменял пути
    const pdfParse = require('pdf-parse');      // НЕ import()
    const data = await pdfParse(dataBuffer);    // pdfParse возвращает { text, numpages ... }

    const text = data.text || '';
    return text.length > 10000 ? text.slice(0, 10000) : text;
  } catch (e: any) {
    throw new Error(`PDF_PARSE_FAILED: ${e.message}`);
  }
}

async function processImage(buffer: Buffer): Promise<string> {
  try {
    log(`Processing image OCR (${buffer.length} bytes)`);
    const w = await getWorker();
    const { data: { text } } = await w.recognize(buffer);
    log(`OCR text extracted: ${text.length} characters`);
    return text.length > 10000 ? text.slice(0, 10000) : text;
  } catch (e: any) {
    log('OCR processing failed:', e.message);
    throw new Error(`OCR_FAILED: ${e.message}`);
  }
}

export async function processS3File(fileKey: string): Promise<string> {
  try {
    log(`Processing S3 file: ${fileKey}`);
    
    // Скачиваем файл из S3
    const { buffer, mime } = await getFileBuffer(fileKey);
    log(`File downloaded. Size: ${buffer.length} bytes, MIME: ${mime}`);
    
    // Определяем тип файла по MIME и расширению
    const fileName = fileKey.toLowerCase();
    
    if (mime === 'application/vnd.ms-excel' || fileName.endsWith('.xls') || 
        mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileName.endsWith('.xlsx')) {
      log('Processing as Excel file (.xls/.xlsx)');
      return processExcelBuffer(Buffer.from(buffer));
    }
    
    if (mime === 'application/pdf' || fileName.endsWith('.pdf')) {
      log('Processing as PDF file');
      return processPdfBuffer(Buffer.from(buffer));
    }
    
    log('Processing as image file');
    return processImage(Buffer.from(buffer));
  } catch (e: any) {
    log('S3 file processing failed:', e.message);
    throw new Error(`S3_FILE_PROCESS_FAILED: ${e.message}`);
  }
}

export async function processExcelBuffer(buf: Buffer): Promise<string> {
  try {
    log(`Processing Excel buffer. Size: ${buf.length} bytes`);
    
    // Читаем Excel файл с помощью ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buf as any);
    
    log(`Excel workbook loaded successfully. Sheets: ${workbook.worksheets.length}`);
    
    let extractedText = '';
    
    // Обрабатываем все листы
    workbook.worksheets.forEach((worksheet, index) => {
      const sheetName = worksheet.name || `Sheet ${index + 1}`;
      
      extractedText += `\n=== ЛИСТ: ${sheetName} ===\n`;
      
      // Итерируемся по всем строкам
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rowValues: string[] = [];
        
        // Получаем значения всех ячеек в строке
        row.eachCell({ includeEmpty: false }, (cell) => {
          let cellValue = '';
          
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === 'object' && 'text' in cell.value) {
              // Rich text
              cellValue = cell.value.text;
            } else if (cell.value instanceof Date) {
              cellValue = cell.value.toLocaleDateString('ru-RU');
            } else {
              cellValue = String(cell.value).trim();
            }
          }
          
          if (cellValue.length > 0) {
            rowValues.push(cellValue);
          }
        });
        
        if (rowValues.length > 0) {
          extractedText += `Строка ${rowNumber}: ${rowValues.join(' | ')}\n`;
        }
      });
    });
    
    log(`Excel text extracted successfully. Length: ${extractedText.length} characters`);
    
    if (extractedText.length < 10) {
      throw new Error('Extracted text is too short, file might be empty or corrupted');
    }
    
    return extractedText;
    
  } catch (e: any) {
    log('Excel processing failed:', e.message);
    throw new Error(`EXCEL_PARSE_FAILED: ${e.message}`);
  }
}

export async function processRemoteImage(url: string): Promise<string> {
  try {
    log(`Processing remote image: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return processImage(buf);
  } catch (e: any) {
    log('Remote image processing failed:', e.message);
    throw new Error(`REMOTE_IMAGE_FAILED: ${e.message}`);
  }
}

export function extractEsgData(text: string): Record<string, any> {
  const esg: Record<string, any> = {};
  try {
    const num = (s: string) => parseFloat(s.replace(/[^\d.,]/g, '').replace(',', '.'));
    const eMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kw[h·]\s*|kwh|kw)/i);
    if (eMatch) esg.energyConsumption = num(eMatch[0]);
    const co2Match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:tonn?\s*co2|t\s*co2|kg\s*co2)/i);
    if (co2Match) esg.co2Emissions = num(co2Match[0]);
    log('ESG data extracted:', esg);
  } catch (e) { /* ignore */ }
  return esg;
} 