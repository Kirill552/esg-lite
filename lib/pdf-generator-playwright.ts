import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

export interface PdfConfig {
  format?: 'A4' | 'A3' | 'Letter';
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  scale?: number;
}

export interface EsgReportData {
  documentId: string;
  companyName: string;
  fullCompanyName?: string;
  inn: string;
  ogrn: string;
  kpp?: string;
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
  createdAt?: string;
}

export interface CbamDeclarationData {
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
  createdAt?: string;
}

export class PlaywrightPdfGenerator {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      console.log('🚀 Инициализация Playwright браузера...');
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔧 Playwright браузер закрыт');
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    return fs.readFileSync(templatePath, 'utf-8');
  }

  private processTemplate(template: string, data: any): string {
    let processed = template;

    // Простая замена переменных {{variable}}
    processed = processed.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || '';
    });

    // Обработка циклов {{#each array}}...{{/each}}
    processed = processed.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';

      return array.map(item => {
        let itemContent = content;
        Object.keys(item).forEach(key => {
          itemContent = itemContent.replace(new RegExp(`\\{\\{this\\.${key}\\}\\}`, 'g'), item[key]);
        });
        return itemContent;
      }).join('');
    });

    // Обработка условий {{#if condition}}...{{/if}}
    processed = processed.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    return processed;
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();
    
    // Настройка viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    return page;
  }

  async generateEsgReport(data: EsgReportData, config: PdfConfig = {}): Promise<Buffer> {
    console.log('📊 Генерация ESG отчета 296-ФЗ...');
    
    await this.initialize();
    const page = await this.createPage();

    try {
      // Загружаем шаблон
      const template = await this.loadTemplate('ru-296fz-report');
      
      // Подготавливаем данные для шаблона
      const templateData = {
        documentId: data.documentId,
        companyName: data.companyName,
        fullCompanyName: data.fullCompanyName || data.companyName,
        inn: data.inn,
        ogrn: data.ogrn,
        kpp: data.kpp || '',
        reportingPeriod: data.reportingPeriod,
        emissionSources: data.emissionSources || [],
        totalEmissions: data.totalEmissions || '0',
        methodology: data.methodology || '296-ФЗ-2025',
        createdAt: data.createdAt || new Date().toLocaleDateString('ru-RU'),
        generatedDate: new Date().toLocaleDateString('ru-RU'),
        generatedTime: new Date().toLocaleTimeString('ru-RU')
      };

      // Обрабатываем шаблон
      const html = this.processTemplate(template, templateData);
      
      // Устанавливаем содержимое страницы
      await page.setContent(html);
      
      // Ждем загрузки шрифтов
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Конфигурация PDF
      const pdfConfig = {
        format: config.format || 'A4',
        printBackground: config.printBackground !== false,
        margin: config.margin || {
          top: '2cm',
          right: '1.5cm',
          bottom: '2cm',
          left: '1.5cm'
        },
        ...config
      };

      // Генерируем PDF
      const pdf = await page.pdf(pdfConfig as any);
      
      console.log(`✅ ESG отчет сгенерирован: ${pdf.length} байт`);
      return pdf;

    } finally {
      await page.close();
    }
  }

  async generateCbamDeclaration(data: CbamDeclarationData, config: PdfConfig = {}): Promise<Buffer> {
    console.log('🌍 Генерация CBAM декларации...');
    
    await this.initialize();
    const page = await this.createPage();

    try {
      // Загружаем шаблон
      const template = await this.loadTemplate('eu-cbam-quarterly');
      
      // Подготавливаем данные для шаблона
      const templateData = {
        documentId: data.documentId,
        companyName: data.companyName,
        eori: data.eori,
        quarter: data.quarter,
        goods: data.goods || [],
        totalQuantity: data.totalQuantity || '0',
        totalEmissions: data.totalEmissions || '0',
        createdAt: data.createdAt || new Date().toLocaleDateString('ru-RU'),
        generatedDate: new Date().toLocaleDateString('ru-RU'),
        generatedTime: new Date().toLocaleTimeString('ru-RU')
      };

      // Обрабатываем шаблон
      const html = this.processTemplate(template, templateData);
      
      // Устанавливаем содержимое страницы
      await page.setContent(html);
      
      // Ждем загрузки шрифтов
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Конфигурация PDF
      const pdfConfig = {
        format: config.format || 'A4',
        printBackground: config.printBackground !== false,
        margin: config.margin || {
          top: '2cm',
          right: '1.5cm',
          bottom: '2cm',
          left: '1.5cm'
        },
        ...config
      };

      // Генерируем PDF
      const pdf = await page.pdf(pdfConfig as any);
      
      console.log(`✅ CBAM декларация сгенерирована: ${pdf.length} байт`);
      return pdf;

    } finally {
      await page.close();
    }
  }

  async generateFromHtml(html: string, config: PdfConfig = {}): Promise<Buffer> {
    console.log('📄 Генерация PDF из HTML...');
    
    await this.initialize();
    const page = await this.createPage();

    try {
      await page.setContent(html);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pdfConfig = {
        format: config.format || 'A4',
        printBackground: config.printBackground !== false,
        margin: config.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        ...config
      };

      const pdf = await page.pdf(pdfConfig as any);
      
      console.log(`✅ PDF сгенерирован: ${pdf.length} байт`);
      return pdf;

    } finally {
      await page.close();
    }
  }
}

// Экспорт готовых функций для удобства
export async function generateEsgReportPdf(data: EsgReportData, config?: PdfConfig): Promise<Buffer> {
  const generator = new PlaywrightPdfGenerator();
  try {
    return await generator.generateEsgReport(data, config);
  } finally {
    await generator.cleanup();
  }
}

export async function generateCbamDeclarationPdf(data: CbamDeclarationData, config?: PdfConfig): Promise<Buffer> {
  const generator = new PlaywrightPdfGenerator();
  try {
    return await generator.generateCbamDeclaration(data, config);
  } finally {
    await generator.cleanup();
  }
} 