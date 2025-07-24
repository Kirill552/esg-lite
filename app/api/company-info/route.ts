import { NextRequest, NextResponse } from 'next/server';

const CHECKO_API_KEY = process.env.CHECKO_API_KEY;

interface CompanyInfo {
  inn: string;
  name: string;
  fullName: string;
  ogrn: string;
  kpp?: string;
  legalForm: string;
  address: string;
  okved: string;
  okvedName: string;
  status: string;
  source: string;
}

// Функция для получения данных из Checko API
async function fetchFromChecko(inn: string): Promise<CompanyInfo | null> {
  if (!CHECKO_API_KEY) {
    console.log('⚠️ CHECKO_API_KEY не настроен');
    return null;
  }

  try {
    const url = `https://api.checko.ru/v2/company?key=${CHECKO_API_KEY}&inn=${inn}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Ошибка Checko API:', response.status);
      return null;
    }

    const result = await response.json();
    
    if (!result.data) {
      console.log('Компания не найдена в Checko API');
      return null;
    }

    const data = result.data;
    
    return {
      inn: data.ИНН,
      name: data.НаимСокр || data.НаимПолн,
      fullName: data.НаимПолн,
      ogrn: data.ОГРН,
      kpp: data.КПП,
      legalForm: data.ОКОПФ?.Наим || 'Не указано',
      address: data.ЮрАдрес?.АдресРФ || 'Не указан',
      okved: data.ОКВЭД?.Код || '',
      okvedName: data.ОКВЭД?.Наим || '',
      status: data.Статус?.Наим || 'Неизвестно',
      source: 'checko'
    };
  } catch (error) {
    console.error('Ошибка при запросе к Checko API:', error);
    return null;
  }
}

// Функция валидации ИНН
function validateINN(inn: string): boolean {
  if (!inn || !/^\d{10}$|^\d{12}$/.test(inn)) {
    return false;
  }

  const digits = inn.split('').map(Number);

  if (inn.length === 10) {
    // Для юридических лиц
    const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    const sum = weights.reduce((acc, weight, i) => acc + weight * digits[i], 0);
    const checksum = (sum % 11) % 10;
    return checksum === digits[9];
  } else {
    // Для индивидуальных предпринимателей
    const weights1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const sum1 = weights1.reduce((acc, weight, i) => acc + weight * digits[i], 0);
    const checksum1 = (sum1 % 11) % 10;

    const weights2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const sum2 = weights2.reduce((acc, weight, i) => acc + weight * digits[i], 0);
    const checksum2 = (sum2 % 11) % 10;

    return checksum1 === digits[10] && checksum2 === digits[11];
  }
}

// Мок данные для тестирования
function getMockCompanyData(inn: string): CompanyInfo | null {
  const mockData: Record<string, CompanyInfo> = {
    '7707083893': {
      inn: '7707083893',
      name: 'ПАО Сбербанк',
      fullName: 'ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО "СБЕРБАНК РОССИИ"',
      ogrn: '1027700132195',
      kpp: '770701001',
      legalForm: 'Публичные акционерные общества',
      address: '117997, г. Москва, ул. Вавилова, д. 19',
      okved: '64.19',
      okvedName: 'Денежное посредничество прочее',
      status: 'Действует',
      source: 'mock'
    },
    '7736207543': {
      inn: '7736207543',
      name: 'ООО "ЯНДЕКС"',
      fullName: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЯНДЕКС"',
      ogrn: '1027739850962',
      kpp: '770301001',
      legalForm: 'Общества с ограниченной ответственностью',
      address: '119021, г. Москва, ул. Льва Толстого, д. 16',
      okved: '62.01',
      okvedName: 'Разработка компьютерного программного обеспечения',
      status: 'Действует',
      source: 'mock'
    },
    '6314022920': {
      inn: '6314022920',
      name: 'ООО "ТЕСТОВАЯ КОМПАНИЯ"',
      fullName: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТЕСТОВАЯ КОМПАНИЯ"',
      ogrn: '1106314010340',
      kpp: '631401001',
      legalForm: 'Общества с ограниченной ответственностью',
      address: '445351, Самарская обл., г. Жигулевск, ул. Гагарина, д. 1',
      okved: '25.50',
      okvedName: 'Ковка, прессование, штамповка и профилирование; порошковая металлургия',
      status: 'Действует',
      source: 'mock'
    }
  };

  return mockData[inn] || null;
}

// GET - получение информации о компании по ИНН
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inn = searchParams.get('inn');

    if (!inn) {
      return NextResponse.json({ error: 'ИНН не указан' }, { status: 400 });
    }

    if (!validateINN(inn)) {
      return NextResponse.json({ error: 'Некорректный формат ИНН' }, { status: 400 });
    }

    // Пробуем получить данные из мок данных (для тестирования)
    let companyInfo = getMockCompanyData(inn);
    
    // Если не найдено в мок данных, пробуем Checko API
    if (!companyInfo) {
      companyInfo = await fetchFromChecko(inn);
    }

    if (!companyInfo) {
      return NextResponse.json({ error: 'Компания не найдена' }, { status: 404 });
    }

    console.log(`✅ Данные компании найдены для ИНН: ${inn}, источник: ${companyInfo.source}`);
    
    return NextResponse.json(companyInfo);

  } catch (error) {
    console.error('Ошибка API company-info:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 