'use client'

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Building,
  Users,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingDown,
  Shield,
  BookOpen,
  ExternalLink,
  Download
} from 'lucide-react';

export default function Guide296FZ() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/knowledge">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к базе знаний
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-teal-600 bg-clip-text text-transparent mb-4">
              📋 Федеральный закон 296-ФЗ
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto">
              "Об ограничении выбросов парниковых газов" — полное руководство по соблюдению требований закона для российских организаций
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview */}
            <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <FileText className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-slate-900">📖 Обзор закона</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-slate-700 leading-relaxed">
                  <strong>Федеральный закон от 02.07.2021 № 296-ФЗ "Об ограничении выбросов парниковых газов"</strong> — 
                  ключевой нормативный акт, регулирующий деятельность российских организаций в сфере сокращения 
                  выбросов парниковых газов и обеспечения климатической безопасности.
                </p>
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-emerald-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 mb-2">Цель закона</h4>
                      <p className="text-emerald-800 text-sm">
                        Создание условий для устойчивого и сбалансированного развития экономики 
                        Российской Федерации при снижении объемов выбросов парниковых газов.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Provisions */}
            <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-slate-900">⚖️ Ключевые положения</h2>
              </div>
              
              <div className="space-y-6">
                <div className="border-l-4 border-emerald-500 pl-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Сфера применения</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-slate-700">Организации с выбросами свыше 150 000 тонн CO₂-эквивалента в год</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-slate-700">Энергетические компании с мощностью свыше 50 МВт</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-slate-700">Организации топливно-энергетического комплекса</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-slate-700">Промышленные предприятия металлургии, химии, нефтепереработки</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Основные обязанности</h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">1. Инвентаризация выбросов</h4>
                      <p className="text-blue-800 text-sm">
                        Ежегодное проведение инвентаризации объемов выбросов парниковых газов 
                        в соответствии с утвержденными методиками.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">2. Отчетность</h4>
                      <p className="text-blue-800 text-sm">
                        Предоставление отчетов о выбросах в Росприроднадзор до 1 июля года, 
                        следующего за отчетным периодом.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">3. Планы мероприятий</h4>
                      <p className="text-blue-800 text-sm">
                        Разработка и реализация планов мероприятий по ограничению выбросов 
                        парниковых газов (при превышении установленных пороговых значений).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reporting Requirements */}
            <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <Calculator className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-slate-900">📊 Требования к отчетности</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-6">
                    <Calendar className="w-8 h-8 text-emerald-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Сроки подачи отчетов</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Отчеты за 2025 год:</span>
                        <span className="font-semibold text-emerald-700">до 1 июля 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Периодичность:</span>
                        <span className="font-semibold text-emerald-700">Ежегодно</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Орган контроля:</span>
                        <span className="font-semibold text-emerald-700">Росприроднадзор</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                    <Building className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Содержание отчета</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-slate-700">Объемы прямых выбросов (Scope 1)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-slate-700">Объемы косвенных выбросов (Scope 2)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-slate-700">Методики расчета и коэффициенты</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-slate-700">Мероприятия по снижению выбросов</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-2">Ответственность за нарушения</h4>
                      <div className="text-yellow-800 text-sm space-y-1">
                        <p><strong>Административные штрафы (с 02.07.2025):</strong></p>
                        <p>• Для должностных лиц: 20 000 - 50 000 рублей</p>
                        <p>• Для юридических лиц: 100 000 - 300 000 рублей</p>
                        <p>• При повторном нарушении штрафы увеличиваются в 2 раза</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* ESG-Lite Integration */}
            <Card className="p-8 border-0 bg-gradient-to-br from-emerald-50 to-green-50">
              <div className="flex items-center mb-6">
                <TrendingDown className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-slate-900">🚀 ESG-Lite для 296-ФЗ</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-slate-700">
                  Платформа ESG-Lite автоматизирует все процессы, связанные с соблюдением требований 296-ФЗ:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-slate-900 mb-1">Автоматическая инвентаризация</h4>
                    <p className="text-sm text-slate-600">OCR-извлечение данных из документов и расчет выбросов</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-slate-900 mb-1">Соответствие методикам</h4>
                    <p className="text-sm text-slate-600">Расчеты по утвержденным коэффициентам эмиссии</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-slate-900 mb-1">Готовые отчеты</h4>
                    <p className="text-sm text-slate-600">Экспорт в формате Excel для подачи в Росприроднадзор</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibull text-slate-900 mb-1">Календарь сроков</h4>
                    <p className="text-sm text-slate-600">Напоминания о приближающихся дедлайнах</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Link href="/create-report">
                    <Button className="w-full">
                      Создать отчет 296-ФЗ сейчас
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Facts */}
            <Card className="p-6 border-0 bg-white/80 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 mb-4">📋 Ключевые факты</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Принят:</span>
                  <span className="font-semibold">02.07.2021</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Вступил в силу:</span>
                  <span className="font-semibold">01.09.2021</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Отчетность с:</span>
                  <span className="font-semibold">2022 года</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Штрафы с:</span>
                  <span className="font-semibold text-red-600">02.07.2025</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between">
                  <span className="text-slate-600">Пороговое значение:</span>
                  <span className="font-semibold">150 000 т CO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Срок подачи:</span>
                  <span className="font-semibold">до 1 июля</span>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h3 className="font-bold text-slate-900 mb-4">📅 Временная шкала</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">2021-2024</p>
                    <p className="text-xs text-slate-600">Переходный период, штрафы не применялись</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">02.07.2025</p>
                    <p className="text-xs text-slate-600">Начало применения административных штрафов</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">01.07.2026</p>
                    <p className="text-xs text-slate-600">Срок подачи отчетов за 2025 год</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Resources */}
            <Card className="p-6 border-0 bg-gradient-to-br from-emerald-50 to-green-50">
              <h3 className="font-bold text-slate-900 mb-4">📚 Полезные ресурсы</h3>
              <div className="space-y-3">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-3" />
                  Текст закона 296-ФЗ
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-3" />
                  Методики расчета
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-3" />
                  Формы отчетности
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-3" />
                  Практические примеры
                </Button>
              </div>
            </Card>

            {/* Support */}
            <Card className="p-6 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h3 className="font-bold text-slate-900 mb-4">🆘 Нужна помощь?</h3>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Наши эксперты помогут с внедрением 296-ФЗ и подготовкой отчетности.
                </p>
                <Button size="sm" className="w-full">
                  Связаться с экспертом
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
