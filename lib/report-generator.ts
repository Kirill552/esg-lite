/**
 * Интегрированный сервис генерации отчетов
 * Объединяет template-engine и pdf-generator
 */

import fs from 'fs/promises';
import path from 'path';
import { processTemplate, TemplateData, ReportType } from './template-engine';
import { generateReportPDF, PDFGenerationResult } from './pdf-generator';

export interface ReportGenerationData {
  // Общие поля
  org_name: string;
  org_address: string;
  signer_name: string;
  signer_position?: string; // для 296-FZ
  signer_pos?: string; // для CBAM
  sign_date: string;
  generation_date: string;
  generation_time: string;
  document_id: string;
  
  // Поля для 296-FZ
  org_inn?: string;
  org_okpo?: string;
  org_oktmo?: string;
  org_phone?: string;
  org_email?: string;
  report_year?: string;
  
  // Поля для CBAM
  eori?: string;
  cbam_id?: string;
  org_country?: string;
  report_year_q?: string;
  
  // Данные о товарах/выбросах (динамические)
  [key: string]: string | number | boolean | undefined;
}

export interface ReportGenerationOptions {
  outputDir?: string;
  templateDir?: string;
  includeMetadata?: boolean;
}

export interface ReportGenerationResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  templateErrors?: string[];
  unreplacedTokens?: string[];
  error?: string;
}

/**
 * Загрузка HTML шаблона
 */
async function loadTemplate(reportType: ReportType, templateDir: string = 'templates'): Promise<string> {
  const templateFileName = reportType === '296-FZ' 
    ? 'ru-296fz-report-2025.html'
    : 'eu-cbam-quarterly-2025.html';
    
  const templatePath = path.join(templateDir, templateFileName);
  
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`Не удалось загрузить шаблон ${templateFileName}: ${error}`);
  }
}

/**
 * Подготовка данных с метаданными
 */
function prepareTemplateData(
  data: ReportGenerationData, 
  reportType: ReportType,
  includeMetadata: boolean = true
): TemplateData {
  const now = new Date();
  
  const baseData: TemplateData = { ...data };
  
  if (includeMetadata) {
    // Добавляем метаданные если не указаны
    baseData.generation_date = data.generation_date || now.toLocaleDateString('ru-RU');
    baseData.generation_time = data.generation_time || now.toLocaleTimeString('ru-RU');
    baseData.document_id = data.document_id || `${reportType}_${Date.now()}`;
    baseData.sign_date = data.sign_date || now.toLocaleDateString('ru-RU');
  }
  
  // Унификация полей подписанта
  if (reportType === '296-FZ' && data.signer_pos && !data.signer_position) {
    baseData.signer_position = data.signer_pos;
  }
  if (reportType === 'CBAM' && data.signer_position && !data.signer_pos) {
    baseData.signer_pos = data.signer_position;
  }
  
  // Маппинг полей для шаблона 296-FZ (исправляем несоответствие токенов)
  if (reportType === '296-FZ') {
    // Основные поля организации
    baseData.inn = data.org_inn || baseData.inn || 'Не указано';
    baseData.address = data.org_address || baseData.address || 'Не указано';
    baseData.phone = data.org_phone || baseData.phone || 'Не указано';
    baseData.email = data.org_email || baseData.email || 'Не указано';
    baseData.okpo = data.org_okpo || baseData.okpo || 'Не указано';
    baseData.oktmo = data.org_oktmo || baseData.oktmo || 'Не указано';
    
    // Поля подписанта для 296-FZ (executor)
    baseData.executor_fio = data.signer_name || baseData.executor_fio || 'Не указано';
    baseData.executor_phone = data.org_phone || baseData.executor_phone || 'Не указано';
    
    // Дополнительные поля для 296-FZ
    baseData.legal_form = baseData.legal_form || 'ООО';
    baseData.ogrn = baseData.ogrn || data.org_okpo || 'Не указано';
    baseData.okved = baseData.okved || '38.11';
    baseData.submission_basis = baseData.submission_basis || 'п. 4 ст. 23 296-ФЗ';
    
    // Данные о выбросах (заполняем базовыми значениями если не указаны)
    baseData.co2_mass = baseData.co2_mass || '0';
    baseData.co2e_co2 = baseData.co2e_co2 || '0';
    baseData.co2_percent = baseData.co2_percent || '0';
    baseData.ch4_mass = baseData.ch4_mass || '0';
    baseData.co2e_ch4 = baseData.co2e_ch4 || '0';
    baseData.ch4_percent = baseData.ch4_percent || '0';
    baseData.n2o_mass = baseData.n2o_mass || '0';
    baseData.co2e_n2o = baseData.co2e_n2o || '0';
    baseData.n2o_percent = baseData.n2o_percent || '0';
    baseData.hfc_mass = baseData.hfc_mass || '0';
    baseData.hfc_gwp = baseData.hfc_gwp || '0';
    baseData.co2e_hfc = baseData.co2e_hfc || '0';
    baseData.hfc_percent = baseData.hfc_percent || '0';
    baseData.pfc_mass = baseData.pfc_mass || '0';
    baseData.pfc_gwp = baseData.pfc_gwp || '0';
    baseData.co2e_pfc = baseData.co2e_pfc || '0';
    baseData.pfc_percent = baseData.pfc_percent || '0';
    baseData.sf6_mass = baseData.sf6_mass || '0';
    baseData.co2e_sf6 = baseData.co2e_sf6 || '0';
    baseData.sf6_percent = baseData.sf6_percent || '0';
    baseData.total_co2e = baseData.total_co2e || '0';
    
    // Процессы (заполняем базовыми значениями если не указаны)
    baseData.proc_1_code = baseData.proc_1_code || 'Не указано';
    baseData.proc_1_desc = baseData.proc_1_desc || 'Не указано';
    baseData.proc_1_nvos = baseData.proc_1_nvos || 'Не указано';
    baseData.proc_1_capacity = baseData.proc_1_capacity || '0';
    baseData.proc_1_unit = baseData.proc_1_unit || 'шт.';
    
    baseData.proc_2_code = baseData.proc_2_code || '';
    baseData.proc_2_desc = baseData.proc_2_desc || '';
    baseData.proc_2_nvos = baseData.proc_2_nvos || '';
    baseData.proc_2_capacity = baseData.proc_2_capacity || '';
    baseData.proc_2_unit = baseData.proc_2_unit || '';
    
    baseData.proc_3_code = baseData.proc_3_code || '';
    baseData.proc_3_desc = baseData.proc_3_desc || '';
    baseData.proc_3_nvos = baseData.proc_3_nvos || '';
    baseData.proc_3_capacity = baseData.proc_3_capacity || '';
    baseData.proc_3_unit = baseData.proc_3_unit || '';
  }
  
  return baseData;
}

/**
 * Основная функция генерации отчета
 */
export async function generateReport(
  reportType: ReportType,
  data: ReportGenerationData,
  options: ReportGenerationOptions = {}
): Promise<ReportGenerationResult> {
  try {
    const {
      outputDir = 'public/reports',
      templateDir = 'templates',
      includeMetadata = true
    } = options;
    
    console.log(`📋 Генерация отчета ${reportType} для ${data.org_name}`);
    
    // 1. Загружаем шаблон
    const template = await loadTemplate(reportType, templateDir);
    console.log(`✅ Шаблон ${reportType} загружен`);
    
    // 2. Подготавливаем данные
    const templateData = prepareTemplateData(data, reportType, includeMetadata);
    
    // 3. Обрабатываем шаблон
    const templateResult = processTemplate(template, templateData, reportType);
    
    if (templateResult.errors.length > 0) {
      return {
        success: false,
        templateErrors: templateResult.errors,
        error: 'Ошибки валидации данных шаблона'
      };
    }
    
    if (templateResult.unreplacedTokens.length > 0) {
      console.warn('⚠️ Незамененные токены:', templateResult.unreplacedTokens);
    }
    
    console.log('✅ Шаблон обработан, токены заменены');
    
    // 4. Генерируем PDF
    const reportPeriod = reportType === '296-FZ' 
      ? (data.report_year || '2025')
      : (data.report_year_q || '2025-2');
      
    const pdfResult = await generateReportPDF(
      templateResult.processedHtml,
      reportType,
      data.org_name,
      reportPeriod,
      outputDir
    );
    
    if (!pdfResult.success) {
      return {
        success: false,
        error: `Ошибка генерации PDF: ${pdfResult.error}`
      };
    }
    
    console.log(`🎉 Отчет ${reportType} успешно создан`);
    
    return {
      success: true,
      filePath: pdfResult.filePath,
      fileName: pdfResult.filePath ? path.basename(pdfResult.filePath) : undefined,
      fileSize: pdfResult.fileSize,
      unreplacedTokens: templateResult.unreplacedTokens
    };
    
  } catch (error) {
    console.error(`❌ Ошибка генерации отчета ${reportType}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

/**
 * Генерация отчета 296-FZ
 */
export async function generate296FZReport(
  data: ReportGenerationData,
  options?: ReportGenerationOptions
): Promise<ReportGenerationResult> {
  return generateReport('296-FZ', data, options);
}

/**
 * Генерация отчета CBAM
 */
export async function generateCBAMReport(
  data: ReportGenerationData,
  options?: ReportGenerationOptions
): Promise<ReportGenerationResult> {
  return generateReport('CBAM', data, options);
}

/**
 * Пакетная генерация отчетов
 */
export async function generateBatchReports(
  reports: Array<{
    type: ReportType;
    data: ReportGenerationData;
    options?: ReportGenerationOptions;
  }>
): Promise<ReportGenerationResult[]> {
  const results: ReportGenerationResult[] = [];
  
  for (const report of reports) {
    const result = await generateReport(report.type, report.data, report.options);
    results.push(result);
    
    // Небольшая пауза между генерациями для стабильности
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}