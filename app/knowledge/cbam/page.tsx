'use client'

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { 
  ArrowLeft,
  Globe,
  Calendar,
  Building,
  TrendingUp,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Shield,
  BookOpen,
  ExternalLink,
  Download,
  Truck,
  Factory,
  Zap,
  DollarSign
} from 'lucide-react';

export default function CBAMGuide() {
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-600 bg-clip-text text-transparent mb-4">
              🌍 CBAM - Углеродная корректировка ЕС
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              Carbon Border Adjustment Mechanism — Европейский механизм пограничной углеродной корректировки. 
              Полное руководство для российских экспортеров
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <Globe className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">🌐 Что такое CBAM?</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Carbon Border Adjustment Mechanism (CBAM)</strong> — это система подтверждения того, 
                  что была выплачена цена за углеродные выбросы, содержащиеся в товарах, импортируемых в ЕС. 
                  Механизм направлен на предотвращение "углеродной утечки" и защиту европейских производителей.
                </p>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Цель CBAM</h4>
                      <p className="text-muted-foreground text-sm">
                        Предотвращение переноса производства в страны с менее строгими климатическими требованиями 
                        и стимулирование глобального сокращения выбросов парниковых газов.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Важно для российских экспортеров</h4>
                      <p className="text-muted-foreground text-sm">
                        С 1 января 2026 года CBAM станет обязательным. Компании, экспортирующие в ЕС, 
                        должны подготовиться к новым требованиям по углеродной отчетности и оплате.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Covered Sectors */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <Factory className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">🏭 Охватываемые секторы</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                CBAM применяется к ключевым углеродоемким секторам экономики:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-3">🔥 Основные секторы (с 2026)</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-muted-foreground">Цемент</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-muted-foreground">Железо и сталь</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-muted-foreground">Алюминий</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-muted-foreground">Удобрения</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-muted-foreground">Электроэнергия</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-muted-foreground">Водород</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-3">⚡ Расширение (планируется)</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Органическая химия</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Пластмассы</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Аммиак</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Стекло</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">Бумага и целлюлоза</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* How CBAM Works */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <Calculator className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">⚙️ Как работает CBAM</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Расчет выбросов</h3>
                    <p className="text-sm text-muted-foreground">
                      Производитель рассчитывает углеродный след продукции по утвержденным методикам
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-emerald-600">2</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Покупка сертификатов</h3>
                    <p className="text-sm text-muted-foreground">
                      Импортер в ЕС покупает CBAM-сертификаты соответственно объему выбросов
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-indigo-600">3</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Сдача сертификатов</h3>
                    <p className="text-sm text-muted-foreground">
                      Импортер сдает сертификаты соответствующему национальному органу ЕС
                    </p>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">💰 Расчет стоимости CBAM</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Базовая формула:</span>
                      <code className="bg-background px-3 py-1 rounded text-foreground font-mono text-sm border border-border">
                        Стоимость = Выбросы × Цена EU ETS - Уплаченная цена CO₂
                      </code>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p><strong className="text-foreground">Где:</strong></p>
                      <p>• Выбросы — т CO₂-эквивалента, встроенные в товар</p>
                      <p>• Цена EU ETS — средняя недельная цена в системе торговли выбросами ЕС</p>
                      <p>• Уплаченная цена CO₂ — углеродная цена, уплаченная в стране производства</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline and Requirements */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">📅 Временная шкала CBAM</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      <h3 className="text-lg font-semibold text-foreground">2023-2025: Переходный период</h3>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Только отчетность, без финансовых обязательств</p>
                      <p>• Квартальные отчеты о содержании углерода</p>
                      <p>• Изучение процедур и подготовка систем</p>
                      <p>• Обучение импортеров и экспортеров</p>
                    </div>
                  </div>
                  
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                      <h3 className="text-lg font-semibold text-foreground">С 1 января 2026: Полное применение</h3>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Обязательная покупка CBAM-сертификатов</p>
                      <p>• Финансовые обязательства импортеров</p>
                      <p>• Штрафы за несоблюдение требований</p>
                      <p>• Полноценная система мониторинга</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Текущая ситуация (2025)</h4>
                      <p className="text-muted-foreground text-sm">
                        Идет активная подготовка к полному запуску. Российские экспортеры должны 
                        подготовить системы расчета углеродного следа и наладить взаимодействие с импортерами в ЕС.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* ESG-Lite for CBAM */}
            <Card className="p-8 border-0 bg-card">
              <div className="flex items-center mb-6">
                <Zap className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-foreground">🚀 ESG-Lite для CBAM</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  ESG-Lite предоставляет полный набор инструментов для соблюдения требований CBAM:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Расчет углеродного следа</h4>
                    <p className="text-sm text-muted-foreground">По методикам ЕС для всех охватываемых секторов</p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">CBAM-отчетность</h4>
                    <p className="text-sm text-muted-foreground">Автоматическая генерация отчетов для импортеров</p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Интеграция с EU ETS</h4>
                    <p className="text-sm text-muted-foreground">Актуальные цены на углеродные сертификаты</p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                    <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-foreground mb-1">Поддержка экспорта</h4>
                    <p className="text-sm text-muted-foreground">Документы для европейских партнеров</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Link href="/reports">
                    <Button className="w-full">
                      Создать CBAM-отчет сейчас
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
                  <span className="text-muted-foreground">Запуск:</span>
                  <span className="font-semibold text-foreground">01.10.2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Переходный период:</span>
                  <span className="font-semibold text-foreground">2023-2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Полное применение:</span>
                  <span className="font-semibold text-red-600">01.01.2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Охват секторов:</span>
                  <span className="font-semibold text-foreground">6 основных</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Текущая цена EU ETS:</span>
                  <span className="font-semibold text-foreground">~85 €/т CO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CBAM тариф ESG-Lite:</span>
                  <span className="font-semibold text-blue-600">255 ₽/т CO₂</span>
                </div>
              </div>
            </Card>

            {/* Impact Calculator */}
            <Card className="p-6 border-0 bg-card">
              <h3 className="font-bold text-foreground mb-4">🧮 Калькулятор влияния</h3>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">Примерная стоимость CBAM для типичных товаров:</p>
                
                <div className="space-y-3">
                  <div className="bg-background rounded p-3 border border-border">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-foreground">Сталь</span>
                      <span className="text-emerald-600">~170 €/т</span>
                    </div>
                    <div className="text-xs text-muted-foreground">2.0 т CO₂/т × 85 €/т CO₂</div>
                  </div>
                  
                  <div className="bg-background rounded p-3 border border-border">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-foreground">Цемент</span>
                      <span className="text-emerald-600">~68 €/т</span>
                    </div>
                    <div className="text-xs text-muted-foreground">0.8 т CO₂/т × 85 €/т CO₂</div>
                  </div>
                  
                  <div className="bg-background rounded p-3 border border-border">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-foreground">Алюминий</span>
                      <span className="text-emerald-600">~1275 €/т</span>
                    </div>
                    <div className="text-xs text-muted-foreground">15.0 т CO₂/т × 85 €/т CO₂</div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  * Приблизительные расчеты. Фактические значения зависят от технологии производства.
                </p>
              </div>
            </Card>

            {/* Resources */}
            <Card className="p-6 border-0 bg-card">
              <h3 className="font-bold text-foreground mb-4">📚 Полезные ресурсы</h3>
              <div className="space-y-3">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-3" />
                  CBAM Regulation EU
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-3" />
                  Методики расчета ЕС
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-3" />
                  CBAM Transitional Registry
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-3" />
                  Руководство для импортеров
                </Button>
              </div>
            </Card>

            {/* Support for CBAM */}
            <Card className="p-6 border-0 bg-card">
              <h3 className="font-bold text-foreground mb-4">🆘 Помощь с CBAM</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Получите консультацию по подготовке к CBAM и европейскому экспорту.
                </p>
                <Button size="sm" className="w-full">
                  Консультация по CBAM
                </Button>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Truck className="w-3 h-3" />
                    <span>Специализация: экспорт в ЕС</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
