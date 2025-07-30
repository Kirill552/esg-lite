import React from 'react';
import { Card } from '@/components/ui/Card';
import { 
  FileText, 
  Zap, 
  Shield, 
  Globe, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Download,
  Calculator
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: FileText,
      title: "Автоматическое распознавание",
      description: "Загрузите PDF/CSV счета за электроэнергию или транспортные накладные. ИИ автоматически извлечет все необходимые данные.",
      gradient: "from-emerald-500 to-green-600"
    },
    {
      icon: Calculator,
      title: "Расчёт по 296-ФЗ",
      description: "Точный расчёт углеродного следа согласно российскому законодательству с актуальными коэффициентами 2025 года.",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Globe,
      title: "CBAM совместимость",
      description: "Генерация отчётов в формате ЕС для углеродного регулирования на границе. Готовность к европейскому экспорту.",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: Clock,
      title: "За 2 минуты",
      description: "Полный цикл от загрузки документа до готового отчёта занимает менее 2 минут. Никаких сложных настроек.",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: CheckCircle,
      title: "99.9% точность",
      description: "Машинное обучение обеспечивает высочайшую точность распознавания данных с возможностью ручной корректировки.",
      gradient: "from-teal-500 to-emerald-600"
    },
    {
      icon: Shield,
      title: "Безопасность данных",
      description: "Все данные хранятся на российских серверах с шифрованием по ГОСТ. Соответствие 152-ФЗ о персональных данных.",
      gradient: "from-slate-500 to-gray-600"
    },
    {
      icon: Download,
      title: "Два формата отчётов",
      description: "PDF отчёт для российских органов и CSV/XML для европейских партнёров. Один клик - два документа.",
      gradient: "from-pink-500 to-rose-600"
    },
    {
      icon: TrendingUp,
      title: "Аналитика трендов",
      description: "Отслеживайте динамику выбросов по месяцам, сравнивайте с отраслевыми показателями и планируйте сокращения.",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      icon: Zap,
      title: "API интеграция",
      description: "REST API для интеграции с 1С, SAP и другими корпоративными системами. Автоматизация всех процессов.",
      gradient: "from-yellow-500 to-amber-600"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Возможности платформы
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Всё для <span className="text-emerald-600">ESG-отчётности</span>
            <br />в одном решении
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Полный цикл работы с углеродной отчётностью: от загрузки документов 
            до готовых отчётов по российским и европейским стандартам
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group p-8 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-2 border-0 bg-white/60 backdrop-blur-sm"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover effect border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-emerald-200 transition-colors duration-300 pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-slate-600 mb-8">
            Готовы начать работу с ESG-отчётностью?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
              onClick={() => window.location.href = '/sign-up'}
            >
              Попробовать бесплатно
            </button>
            <button 
              className="px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-emerald-300 hover:text-emerald-600 transition-all duration-300"
              onClick={() => window.location.href = '/sign-up'}
            >
              Посмотреть демо
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 