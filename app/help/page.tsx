'use client'

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  FileText,
  Upload,
  Download,
  Calculator,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  Target,
  BarChart3,
  BookOpen,
  Lightbulb,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen surface-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Хлебные крошки */}
        <Breadcrumbs 
          items={[
            { label: 'Справка', href: '/help' }
          ]}
          className="mb-6"
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="text-center help-content">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 dark:from-slate-100 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent mb-4">
              📚 Руководство ESG-Lite 2025
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Полное руководство по использованию платформы ESG-Lite для автоматизации 
              углеродной отчетности и соответствия требованиям 296-ФЗ и CBAM
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Start */}
            <Card className="card-accent">
              <div className="flex items-center mb-6">
                <Zap className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">🚀 Быстрый старт</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Загрузите документы</h3>
                    <p className="text-muted-foreground">Загружайте счета-фактуры, товарно-транспортные накладные и другие документы через форму загрузки.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Автоматическая обработка</h3>
                    <p className="text-muted-foreground">ESG-Lite автоматически извлечет данные с помощью OCR и рассчитает углеродный след.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Получите отчеты</h3>
                    <p className="text-muted-foreground">Скачайте готовые отчеты 296-ФЗ и CBAM в формате Excel с автоматическими расчетами.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Best Practices */}
            <Card className="card-interactive">
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">💡 Лучшие практики 2025</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Пакетная загрузка</h4>
                      <p className="text-sm text-muted-foreground">Загружайте документы за весь месяц одновременно для создания сводного отчета</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Качество документов</h4>
                      <p className="text-sm text-muted-foreground">Используйте сканы высокого разрешения (минимум 300 DPI) для лучшего распознавания</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Мониторинг кредитов</h4>
                      <p className="text-sm text-muted-foreground">Следите за балансом кредитов и пополняйте заранее во избежание простоев</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Регулярность отчетов</h4>
                      <p className="text-sm text-muted-foreground">Создавайте отчеты ежемесячно для лучшего контроля углеродного следа</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Сезонное повышение цен</h4>
                      <p className="text-sm text-muted-foreground">Планируйте обработку документов с учетом периода повышенных тарифов с 15 по 30 июня (стоимость ×2)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">CBAM подготовка</h4>
                      <p className="text-sm text-muted-foreground">Подключите CBAM Add-on заранее для работы с европейскими партнерами</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Guide */}
            <Card className="surface-secondary rounded-xl p-8 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
              <div className="flex items-center mb-6">
                <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">💰 Система ценообразования</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Базовые тарифы</h3>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-2">
                      <strong>Стандартная стоимость:</strong> 5 ₽ за тонну CO₂-эквивалента
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Действует с 1 июля по 14 июня следующего года. Бесплатный лимит: 1000 т CO₂ в год.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Сезонное повышение цен</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Clock className="w-5 h-5 text-red-600 mr-2" />
                      <span className="font-semibold text-red-800 dark:text-red-300">15-30 июня: Увеличение в 2 раза</span>
                    </div>
                    
                    <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                      <strong>Стоимость в пиковый период:</strong> 10 ₽ за тонну CO₂-эквивалента
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-red-800 dark:text-red-300">Причины повышения цен:</h4>
                      <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 ml-4">
                        <li>• <strong>Пиковая нагрузка:</strong> В июне 70% компаний готовят годовую экологическую отчетность</li>
                        <li>• <strong>Регуляторные сроки:</strong> Дедлайны подачи отчетов в Росприроднадзор и ЕС по CBAM</li>
                        <li>• <strong>Техническая нагрузка:</strong> Серверы работают на максимальной мощности</li>
                        <li>• <strong>Экспертная поддержка:</strong> Привлечение дополнительных специалистов для контроля качества</li>
                        <li>• <strong>Срочная обработка:</strong> Приоритетная обработка документов в сжатые сроки</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Как оптимизировать расходы</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">До пикового сезона</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>• Обрабатывайте документы в мае</li>
                        <li>• Создавайте черновики отчетов заранее</li>
                        <li>• Пополняйте баланс по базовым тарифам</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">После пикового сезона</h4>
                      <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                        <li>• Дождитесь 1 июля для возврата к базовым тарифам</li>
                        <li>• Обрабатывайте несрочные документы</li>
                        <li>• Планируйте следующий отчетный период</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Система уведомлений</h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      ESG-Lite автоматически уведомляет о приближении и начале периода повышенных цен:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                      <li>• За 7 дней до начала (8 июня) - предупреждение</li>
                      <li>• В день начала (15 июня) - уведомление об активации</li>
                      <li>• В день окончания (30 июня) - уведомление о возврате к базовым тарифам</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Technical Guide */}
            <Card className="surface-neutral rounded-xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <Settings className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">⚙️ Техническое руководство</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Форматы документов</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-sm font-medium">PDF</span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-sm font-medium">JPEG</span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-sm font-medium">PNG</span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-sm font-medium">TIFF</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Ограничения системы</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300"><strong>Максимальный размер файла:</strong> 50 МБ</p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300"><strong>Максимальное количество страниц:</strong> 20 страниц в PDF</p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300"><strong>Время обработки:</strong> 30-120 секунд в зависимости от сложности документа</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Navigation */}
            <Card className="surface-elevated rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="font-bold text-foreground mb-4">🔗 Быстрые ссылки</h3>
              <div className="space-y-3">
                <Link href="/upload">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-3" />
                    Загрузить документы
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-3" />
                    Создать отчёт 296-ФЗ
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-3" />
                    Годовая аналитика
                  </Button>
                </Link>
                <Link href="/credits">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Calculator className="w-4 h-4 mr-3" />
                    Управление кредитами
                  </Button>
                </Link>
                <Link href="/subscription">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-3" />
                    Тарифы и подписки
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Pricing Info */}
            <Card className="surface-glass rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="font-bold text-foreground mb-4">💰 Ценообразование 2025</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Базовая ставка:</span>
                  <span className="font-semibold">5 ₽/т CO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Бесплатный лимит:</span>
                  <span className="font-semibold">1 000 т CO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CBAM тарификация:</span>
                  <span className="font-semibold">255 ₽/т CO₂</span>
                </div>
                <hr className="my-3 border-border" />
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-800 dark:text-red-300">Сезонное повышение цен</span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">15-30 июня: тарифы увеличены в 2 раза из-за пиковой нагрузки</p>
                </div>
              </div>
            </Card>

            {/* Support */}
            <Card className="surface-glass-accent rounded-xl p-6 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <h3 className="font-bold text-foreground mb-4">🆘 Поддержка</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Email: support@esg-lite.ru</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Пн-Пт: 9:00-18:00 МСК</span>
                </div>
                <Button size="sm" className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl">
                  Связаться с поддержкой
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
