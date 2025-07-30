"use client"

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Upload, 
  Zap, 
  Download,
  ArrowRight,
  FileText,
  BarChart3
} from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Загрузите документ",
      description: "Перетащите PDF счёт за электроэнергию или CSV файл с данными. Поддерживаются все основные форматы.",
      icon: Upload,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50/50"
    },
    {
      number: 2,
      title: "Автоматическая обработка",
      description: "ИИ извлекает данные из документа и рассчитывает углеродный след согласно 296-ФЗ с актуальными коэффициентами.",
      icon: Zap,
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50/50"
    },
    {
      number: 3,
      title: "Получите отчёты",
      description: "Скачайте готовые PDF отчёты по 296-ФЗ и CSV/XML файлы для подачи в CBAM ЕС.",
      icon: Download,
      gradient: "from-purple-500 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50/50"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Как это работает?
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Создание ESG отчётов стало проще. Всего 3 шага отделяют вас от готового 
            отчёта по 296-ФЗ и CBAM совместимых документов.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.number} className="relative">
                <Card className={`p-8 border-0 bg-gradient-to-br ${step.bgGradient} hover:shadow-xl transition-all duration-300 group cursor-pointer h-full`}>
                  <div className="text-center">
                    {/* Step Number */}
                    <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-2xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="mb-6">
                      <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Card>

                {/* Arrow (only between steps, not after the last one) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Interactive Demo Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 border border-slate-200/50 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">
                Попробуйте прямо сейчас!
              </h3>
              <p className="text-lg text-slate-600 mb-8">
                Загрузите тестовый файл и убедитесь в простоте и скорости 
                создания ESG отчётов. Полная обработка занимает менее 2 минут.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <FileText className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Поддержка PDF, CSV, Excel форматов</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <BarChart3 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Соответствие российскому 296-ФЗ</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <Zap className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">Совместимость с CBAM ЕС</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  className="flex-1"
                  onClick={() => window.location.href = '/sign-up'}
                >
                  Попробовать бесплатно
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="flex-1"
                  onClick={() => window.location.href = '/sign-up'}
                >
                  Посмотреть демо
                </Button>
              </div>
            </div>

            <div className="relative">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-blue-50 to-purple-100 rounded-2xl rotate-3"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-emerald-100 rounded-2xl -rotate-3"></div>
              
              {/* Content */}
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4">
                    Готовый отчёт за 90 секунд
                  </h4>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Электроэнергия:</span>
                      <span className="font-medium">1,250 кВт·ч</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CO₂ эквивалент:</span>
                      <span className="font-medium">525.5 тCO₂</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Статус 296-ФЗ:</span>
                      <span className="font-medium text-emerald-600">✓ Соответствует</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex justify-center space-x-4">
                      <div className="flex items-center text-sm text-slate-500">
                        <FileText className="w-4 h-4 mr-1" />
                        PDF отчёт
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <Download className="w-4 h-4 mr-1" />
                        CBAM XML
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-20 text-center">
          <p className="text-sm text-slate-500 mb-6">
            Используется российскими компаниями для соответствия 296-ФЗ
          </p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-slate-400">ГАЗПРОМ</div>
            <div className="text-2xl font-bold text-slate-400">РОСАТОМ</div>
            <div className="text-2xl font-bold text-slate-400">СБЕР</div>
            <div className="text-2xl font-bold text-slate-400">ЛУКОЙЛ</div>
          </div>
        </div>
      </div>
    </section>
  );
} 