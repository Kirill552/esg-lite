/**
 * XML Validator Library для CBAM отчётов
 * Использует xmllint для валидации XML против XSD схем
 * 
 * @version 1.0.0
 * @date 2025-08-01
 * @author ESG-Lite Team
 */

const { execSync, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Класс для валидации XML файлов
 */
class XMLValidator {
  constructor(schemasPath = './schemas') {
    this.schemasPath = schemasPath;
    this.tempDir = process.env.TEMP_DIR || '/tmp/xml-validation';
    this.init();
  }

  /**
   * Инициализация валидатора
   */
  async init() {
    try {
      // Создаём временную директорию если не существует
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Проверяем наличие xmllint
      execSync('which xmllint', { stdio: 'ignore' });
      console.log('✅ xmllint найден и готов к использованию');
      
    } catch (error) {
      console.error('❌ xmllint не найден. Установите libxml2-utils');
      throw new Error('xmllint не доступен в системе');
    }
  }

  /**
   * Валидация CBAM XML отчёта
   * @param {string} xmlContent - содержимое XML файла
   * @param {string} schemaType - тип схемы ('cbam-quarterly' по умолчанию)
   * @returns {Promise<ValidationResult>}
   */
  async validateCBAMReport(xmlContent, schemaType = 'cbam-quarterly') {
    const startTime = Date.now();
    
    try {
      // Определяем файл схемы
      const schemaFile = this.getSchemaFile(schemaType);
      
      // Создаём временный XML файл
      const xmlFilePath = await this.createTempXMLFile(xmlContent);
      
      // Выполняем валидацию
      const validationResult = await this.performValidation(xmlFilePath, schemaFile);
      
      // Очищаем временные файлы
      await this.cleanup(xmlFilePath);
      
      const executionTime = Date.now() - startTime;
      
      return {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        schemaType,
        executionTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Критическая ошибка валидации: ${error.message}`],
        warnings: [],
        schemaType,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Получить путь к файлу схемы
   * @param {string} schemaType - тип схемы
   * @returns {string} путь к XSD файлу
   */
  getSchemaFile(schemaType) {
    const schemaFiles = {
      'cbam-quarterly': 'cbam-quarterly-report.xsd',
      'cbam-shared': 'stypes.xsd'
    };
    
    const fileName = schemaFiles[schemaType];
    if (!fileName) {
      throw new Error(`Неизвестный тип схемы: ${schemaType}`);
    }
    
    return path.join(this.schemasPath, fileName);
  }

  /**
   * Создать временный XML файл
   * @param {string} xmlContent - содержимое XML
   * @returns {Promise<string>} путь к временному файлу
   */
  async createTempXMLFile(xmlContent) {
    const timestamp = Date.now();
    const fileName = `cbam-report-${timestamp}.xml`;
    const filePath = path.join(this.tempDir, fileName);
    
    await fs.writeFile(filePath, xmlContent, 'utf8');
    return filePath;
  }

  /**
   * Выполнить валидацию с помощью xmllint
   * @param {string} xmlFilePath - путь к XML файлу
   * @param {string} schemaFile - путь к XSD схеме
   * @returns {Promise<{isValid: boolean, errors: string[], warnings: string[]}>}
   */
  async performValidation(xmlFilePath, schemaFile) {
    try {
      // Команда xmllint для валидации
      const command = `xmllint --noout --schema "${schemaFile}" "${xmlFilePath}"`;
      
      console.log(`🔍 Выполняю валидацию: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      // Если нет ошибок - валидация успешна
      if (!stderr || stderr.trim() === '') {
        console.log('✅ XML валидация успешна');
        return {
          isValid: true,
          errors: [],
          warnings: this.parseWarnings(stdout)
        };
      }
      
      // Парсим ошибки из stderr
      const errors = this.parseErrors(stderr);
      
      return {
        isValid: false,
        errors,
        warnings: this.parseWarnings(stdout)
      };
      
    } catch (error) {
      // xmllint возвращает код ошибки при невалидном XML
      const errors = this.parseErrors(error.stderr || error.message);
      
      return {
        isValid: false,
        errors,
        warnings: []
      };
    }
  }

  /**
   * Парсинг ошибок из вывода xmllint
   * @param {string} stderr - вывод ошибок
   * @returns {string[]} массив ошибок
   */
  parseErrors(stderr) {
    if (!stderr) return [];
    
    const lines = stderr.split('\n').filter(line => line.trim());
    const errors = [];
    
    for (const line of lines) {
      if (line.includes('error:') || line.includes('fails to validate')) {
        // Убираем пути к файлам для чистоты вывода
        const cleanError = line
          .replace(/.*?:(\d+):\s*/, 'Строка $1: ')
          .replace(/element\s+(\w+):\s*/, 'Элемент "$1": ')
          .replace(/attribute\s+(\w+):\s*/, 'Атрибут "$1": ')
          .replace(/Schemas validity error:\s*/, '')
          .trim();
        
        if (cleanError) {
          errors.push(cleanError);
        }
      }
    }
    
    return errors.length > 0 ? errors : ['Ошибка валидации XML против XSD схемы'];
  }

  /**
   * Парсинг предупреждений из вывода xmllint
   * @param {string} stdout - стандартный вывод
   * @returns {string[]} массив предупреждений
   */
  parseWarnings(stdout) {
    if (!stdout) return [];
    
    const lines = stdout.split('\n').filter(line => line.trim());
    const warnings = [];
    
    for (const line of lines) {
      if (line.includes('warning:')) {
        const cleanWarning = line
          .replace(/.*?warning:\s*/, '')
          .trim();
        
        if (cleanWarning) {
          warnings.push(cleanWarning);
        }
      }
    }
    
    return warnings;
  }

  /**
   * Очистка временных файлов
   * @param {string} filePath - путь к файлу для удаления
   */
  async cleanup(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`⚠️ Не удалось удалить временный файл: ${filePath}`);
    }
  }

  /**
   * Валидация структуры CBAM отчёта (дополнительные проверки)
   * @param {string} xmlContent - содержимое XML
   * @returns {Promise<{isValid: boolean, issues: string[]}>}
   */
  async validateCBAMStructure(xmlContent) {
    const issues = [];
    
    try {
      // Проверяем наличие обязательных элементов
      const requiredElements = [
        'CBAMQuarterlyReport',
        'ReportHeader',
        'Declarant',
        'ReportingPeriod',
        'Summary',
        'Declaration'
      ];
      
      for (const element of requiredElements) {
        if (!xmlContent.includes(`<${element}`)) {
          issues.push(`Отсутствует обязательный элемент: ${element}`);
        }
      }
      
      // Проверяем EORI номер
      const eoriMatch = xmlContent.match(/<EORI>([^<]+)<\/EORI>/);
      if (eoriMatch) {
        const eori = eoriMatch[1];
        if (!/^[A-Z]{2}[A-Z0-9]{1,15}$/.test(eori)) {
          issues.push(`Некорректный формат EORI номера: ${eori}`);
        }
      } else {
        issues.push('Отсутствует EORI номер декларанта');
      }
      
      // Проверяем даты отчётного периода
      const yearMatch = xmlContent.match(/<Year>(\d{4})<\/Year>/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const currentYear = new Date().getFullYear();
        if (year < 2023 || year > currentYear + 1) {
          issues.push(`Некорректный год отчётности: ${year}`);
        }
      }
      
      // Проверяем квартал
      const quarterMatch = xmlContent.match(/<Quarter>(\d)<\/Quarter>/);
      if (quarterMatch) {
        const quarter = parseInt(quarterMatch[1]);
        if (quarter < 1 || quarter > 4) {
          issues.push(`Некорректный квартал: ${quarter}`);
        }
      }
      
      return {
        isValid: issues.length === 0,
        issues
      };
      
    } catch (error) {
      return {
        isValid: false,
        issues: [`Ошибка при проверке структуры: ${error.message}`]
      };
    }
  }

  /**
   * Получить информацию о доступных схемах
   * @returns {Promise<Object>} информация о схемах
   */
  async getAvailableSchemas() {
    try {
      const files = await fs.readdir(this.schemasPath);
      const xsdFiles = files.filter(file => file.endsWith('.xsd'));
      
      const schemas = {};
      for (const file of xsdFiles) {
        const filePath = path.join(this.schemasPath, file);
        const stat = await fs.stat(filePath);
        
        schemas[file] = {
          name: file,
          path: filePath,
          size: stat.size,
          modified: stat.mtime.toISOString()
        };
      }
      
      return schemas;
    } catch (error) {
      throw new Error(`Ошибка при получении списка схем: ${error.message}`);
    }
  }
}

/**
 * Типы результатов валидации
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - результат валидации
 * @property {string[]} errors - массив ошибок
 * @property {string[]} warnings - массив предупреждений
 * @property {string} schemaType - тип использованной схемы
 * @property {number} executionTime - время выполнения в мс
 * @property {string} timestamp - timestamp валидации
 */

module.exports = XMLValidator;

// Дополнительные экспорты для удобства
module.exports.XMLValidator = XMLValidator;
module.exports.validateCBAMReport = async (xmlContent, schemaType = 'cbam-quarterly') => {
  const validator = new XMLValidator();
  return await validator.validateCBAMReport(xmlContent, schemaType);
};
