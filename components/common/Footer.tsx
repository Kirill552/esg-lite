import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Колонка 1: Логотип и описание */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">ESG-Lite MVP</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Автоматизация ESG отчетности для российского бизнеса. Соответствие 296-ФЗ и подготовка к CBAM ЕС за минуты, а не дни.
            </p>
            <div className="flex space-x-4">
              <div className="w-6 h-6 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"></div>
              <div className="w-6 h-6 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"></div>
              <div className="w-6 h-6 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"></div>
            </div>
          </div>

          {/* Колонка 2: Продукт */}
          <div>
            <h3 className="font-semibold text-white mb-4">Продукт</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Главная</Link></li>
              <li><Link href="/credits" className="text-gray-300 hover:text-white transition-colors">Тарифы</Link></li>
              <li><Link href="/api/docs" className="text-gray-300 hover:text-white transition-colors">Документация</Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Конфиденциальность</Link></li>
              <li><Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">Статус системы</Link></li>
            </ul>
          </div>

          {/* Колонка 3: Ресурсы */}
          <div>
            <h3 className="font-semibold text-white mb-4">Ресурсы</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/knowledge" className="text-gray-300 hover:text-white transition-colors">База знаний</Link></li>
              <li><Link href="/knowledge/296-fz" className="text-gray-300 hover:text-white transition-colors">296-ФЗ гид</Link></li>
              <li><Link href="/knowledge/cbam" className="text-gray-300 hover:text-white transition-colors">CBAM руководство</Link></li>
            </ul>
          </div>

          {/* Колонка 4: Контакты */}
          <div>
            <h3 className="font-semibold text-white mb-4">Контакты</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-gray-300">
                <span className="mr-2">📧</span>
                <span>support@esg-lite.ru</span>
              </li>
              <li className="flex items-center text-gray-300">
                <span className="mr-2">📞</span>
                <span>8 (800) 123-45-67</span>
              </li>
              <li className="flex items-center text-gray-300">
                <span className="mr-2">📍</span>
                <span>Москва, Россия<br />ул. Инновационная, 42</span>
              </li>
            </ul>
            
            <div className="mt-6">
              <h4 className="font-medium text-white mb-2">Поддержка</h4>
              <p className="text-xs text-gray-400">
                Пн-Пт: 9:00 - 18:00 MSK<br />
                Сб-Вс: По заявкам
              </p>
            </div>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col lg:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4 lg:mb-0">
            <span>🛡️ SSL-ФЗ соответствие</span>
            <span>•</span>
            <span>🔒 296-ФЗ сертификация</span>
            <span>•</span>
            <span>v0.1.0</span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center lg:text-right">
            <div className="mb-1">
              Партнеры: Сколково, Российское ПО
            </div>
            <div>
              © {currentYear} ESG-Lite MVP. Все права защищены.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}