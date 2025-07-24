import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Check, 
  Star,
  Zap,
  Shield,
  Rocket,
  Crown
} from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: "Базовый (Freemium)",
      price: "0",
      period: "Бесплатно",
      description: "Для малых предприятий и стартапов",
      features: [
        "Расчет углеродного следа (Scope 1)",
        "До 1000 тонн CO₂",
        "2 отчёта в месяц",
        "Базовые PDF отчёты по 296-ФЗ",
        "Email поддержка",
        "Хранение данных 30 дней"
      ],
      buttonText: "Начать бесплатно",
      buttonVariant: "secondary" as const,
      popular: false,
      icon: Zap,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50/50"
    },
    {
      name: "Стандартный",
      price: "750",
      period: "/месяц",
      description: "Для компаний среднего размера",
      features: [
        "Полный доступ (Scope 1, 2, 3)",
        "Неограниченное количество отчетов",
        "Все форматы: PDF, CSV, XML",
        "Интеграция с ERP системами",
        "API доступ",
        "Приоритетная поддержка",
        "Хранение данных 1 год"
      ],
      buttonText: "Выбрать план",
      buttonVariant: "primary" as const,
      popular: true,
      icon: Star,
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50/50"
    },
    {
      name: "Премиум",
      price: "3,500",
      period: "/месяц",
      description: "Для крупных предприятий",
      features: [
        "Неограниченный функционал",
        "Индивидуальные отчеты по отделам",
        "API для корпоративных систем",
        "Персональная консультация",
        "Стратегия сокращения CO₂",
        "White-label решения",
        "SLA 99.9%",
        "Персональный менеджер"
      ],
      buttonText: "Связаться с нами",
      buttonVariant: "secondary" as const,
      popular: false,
      icon: Crown,
      gradient: "from-purple-500 to-indigo-600",
      bgGradient: "from-purple-50 to-indigo-50/50"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-white via-slate-50 to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Простые и прозрачные тарифы
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Выберите подходящий план для автоматизации ESG отчётности. 
            Все планы включают соответствие 296-ФЗ и CBAM совместимость.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`relative p-8 border-0 bg-gradient-to-br ${plan.bgGradient} hover:shadow-2xl transition-all duration-300 group ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                      ⭐ Популярный выбор
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  {/* Icon */}
                  <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-8">
                    {plan.price === "Договорная" ? (
                      <div className="text-3xl font-bold text-slate-900">
                        {plan.price}
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center">
                        <span className="text-5xl font-bold text-slate-900">
                          {plan.price === "0" ? "Бесплатно" : `₽${plan.price}`}
                        </span>
                        {plan.period && (
                          <span className="text-xl text-slate-600 ml-2">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button 
                  variant={plan.buttonVariant}
                  size="lg"
                  className="w-full group-hover:scale-105 transition-transform duration-300"
                >
                  {plan.buttonText}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 border border-slate-200/50 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">
                Часто задаваемые вопросы
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Что включает базовый тариф?
                  </h4>
                  <p className="text-slate-600">
                    Базовый тариф предоставляет расчет углеродного следа Scope 1 
                    для компаний до 1000 тонн CO₂ с 2 отчетами в месяц бесплатно.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Доступен ли маркетплейс консультантов?
                  </h4>
                  <p className="text-slate-600">
                    Да, в стандартном и премиум тарифах доступ к экспертам 
                    по снижению углеродного следа через нашу платформу.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Предоставляете ли White-label решения?
                  </h4>
                  <p className="text-slate-600">
                    Да, для ТПП и региональных организаций доступны 
                    White-label решения в рамках премиум тарифа.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl rotate-3"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4">
                    30 дней гарантия возврата
                  </h4>
                  <p className="text-slate-600 mb-6">
                    Если наш сервис вам не подойдёт, мы вернём 100% стоимости 
                    в течение 30 дней без вопросов.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      152-ФЗ
                    </div>
                    <div className="flex items-center">
                      <Rocket className="w-4 h-4 mr-1" />
                      296-ФЗ
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      CBAM ЕС
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Готовы сократить углеродный след?
          </h3>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Начните с базового тарифа бесплатно. Растите вместе с нами: 
            от стартапа до крупного предприятия с полным ESG-функционалом.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button variant="primary" size="lg" className="flex-1">
              Начать бесплатно
            </Button>
            <Button variant="secondary" size="lg" className="flex-1">
              Консультация эксперта
            </Button>
          </div>
          
          {/* Additional monetization info */}
          <div className="mt-12 p-6 bg-emerald-50 rounded-2xl max-w-4xl mx-auto">
            <h4 className="font-semibold text-slate-900 mb-4">
              🎯 Дополнительные возможности:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                <span>Маркетплейс ESG-консультантов</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                <span>White-label для ТПП и регионов</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                <span>Персонализированное обучение</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                <span>Стратегии сокращения CO₂</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 