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
    <div className="min-h-screen bg-background">
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
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              "Об ограничении выбросов парниковых газов" — полное руководство по соблюдению требований закона для российских организаций
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <FileText className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">📖 Обзор закона</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Федеральный закон от 02.07.2021 № 296-ФЗ "Об ограничении выбросов парниковых газов"</strong> — 
                  ключевой нормативный акт, регулирующий деятельность российских организаций в сфере сокращения 
                  выбросов парниковых газов и обеспечения климатической безопасности.
                </p>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-emerald-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Цель закона</h4>
                      <p className="text-muted-foreground text-sm">
                        Создание условий для устойчивого и сбалансированного развития экономики 
                        Российской Федерации при снижении объемов выбросов парниковых газов.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Provisions */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">⚖️ Ключевые положения</h2>
              </div>
              
              <div className="space-y-6">
                <div className="border-l-4 border-emerald-500 pl-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Сфера применения</h3>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-muted-foreground">Организации с выбросами свыше 150 000 тонн CO₂-эквивалента в год</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-muted-foreground">Энергетические компании с мощностью свыше 50 МВт</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-muted-foreground">Организации топливно-энергетического комплекса</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="text-muted-foreground">Промышленные предприятия металлургии, химии, нефтепереработки</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Основные обязанности</h3>
                  <div className="space-y-3">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">1. Инвентаризация выбросов</h4>
                      <p className="text-muted-foreground text-sm">
                        Ежегодное проведение инвентаризации объемов выбросов парниковых газов 
                        в соответствии с утвержденными методиками.
                      </p>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">2. Отчетность</h4>
                      <p className="text-muted-foreground text-sm">
                        Предоставление отчетов о выбросах в Росприроднадзор до 1 июля года, 
                        следующего за отчетным периодом.
                      </p>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">3. Планы мероприятий</h4>
                      <p className="text-muted-foreground text-sm">
                        Разработка и реализация планов мероприятий по ограничению выбросов 
                        парниковых газов (при превышении установленных пороговых значений).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reporting Requirements */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <Calculator className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">📊 Требования к отчетности</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <Calendar className="w-8 h-8 text-emerald-600 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-3">Сроки подачи отчетов</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Отчеты за 2025 год:</span>
                        <span className="font-semibold text-emerald-700">до 1 июля 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Периодичность:</span>
                        <span className="font-semibold text-emerald-700">Ежегодно</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Орган контроля:</span>
                        <span className="font-semibold text-emerald-700">Росприроднадзор</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card border border-border rounded-lg p-6">
                    <Building className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-3">Содержание отчета</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-muted-foreground">Объемы прямых выбросов (Scope 1)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-muted-foreground">Объемы косвенных выбросов (Scope 2)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-muted-foreground">Методики расчета и коэффициенты</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <span className="text-muted-foreground">Мероприятия по снижению выбросов</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Ответственность за нарушения</h4>
                      <div className="text-muted-foreground text-sm space-y-1">
                        <p><strong className="text-foreground">Административные штрафы (с 02.07.2025):</strong></p>
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
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <TrendingDown className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">🚀 ESG-Lite для 296-ФЗ</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Платформа ESG-Lite автоматизирует все процессы, связанные с соблюдением требований 296-ФЗ:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Автоматическая инвентаризация</h4>
                    <p className="text-sm text-muted-foreground">OCR-извлечение данных из документов и расчет выбросов</p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Соответствие методикам</h4>
                    <p className="text-sm text-muted-foreground">Расчеты по утвержденным коэффициентам эмиссии</p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Готовые отчеты</h4>
                    <p className="text-sm text-muted-foreground">Экспорт в формате Excel для подачи в Росприроднадзор</p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Календарь сроков</h4>
                    <p className="text-sm text-muted-foreground">Напоминания о приближающихся дедлайнах</p>
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
            <Card className="p-6 border-0 bg-card">
              <h3 className="font-bold text-foreground mb-4">📋 Ключевые факты</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Принят:</span>
                  <span className="font-semibold text-foreground">02.07.2021</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Вступил в силу:</span>
                  <span className="font-semibold text-foreground">01.09.2021</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Отчетность с:</span>
                  <span className="font-semibold text-foreground">2022 года</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Штрафы с:</span>
                  <span className="font-semibold text-red-600">02.07.2025</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Пороговое значение:</span>
                  <span className="font-semibold text-foreground">150 000 т CO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Срок подачи:</span>
                  <span className="font-semibold text-foreground">до 1 июля</span>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6 border-0 bg-card">
              <h3 className="font-bold text-foreground mb-4">📅 Временная шкала</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">2021-2024</p>
                    <p className="text-xs text-muted-foreground">Переходный период, штрафы не применялись</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">02.07.2025</p>
                    <p className="text-xs text-muted-foreground">Начало применения административных штрафов</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">01.07.2026</p>
                    <p className="text-xs text-muted-foreground">Срок подачи отчетов за 2025 год</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Resources */}
            <Card className="p-6 border-0 bg-card">
              <h3 className="font-bold text-foreground mb-4">📚 Полезные ресурсы</h3>
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
            <Card className="p-6 border-0 bg-card">
              <h3 className="font-bold text-foreground mb-4">🆘 Нужна помощь?</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
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
