'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard,
  Crown,
  Shield,
  Users,
  Check,
  TrendingUp,
  Calendar,
  RefreshCw,
  Calculator,
  FileText,
  Download
} from 'lucide-react';

interface SubscriptionData {
  currentPlan: string;
  nextBillingDate: string;
  monthlyUsage: number;
  totalEmissions: number;
  lastPayment?: {
    amount: number;
    date: string;
  };
}

interface PlanTemplate {
  id: string;
  name: string;
  maxEmissions: number;
  features: string[];
  popular?: boolean;
  recommended?: boolean;
}

interface PricingResponse {
  planType: string;
  basePrice: number;
  variablePrice: number;
  finalPrice: number;
  emissions: number;
  breakdown: {
    basePayment: number;
    perTonRate: number;
    tonnageAboveMin: number;
    variableCost: number;
  };
}

export default function TariffsPage() {
  const { user } = useUser();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatorEmissions, setCalculatorEmissions] = useState(100000);
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, PricingResponse>>({});

  // Статические даны о планах (описания) - цены получаем из API
  const planTemplates: PlanTemplate[] = [
    {
      id: 'TRIAL',
      name: 'Пробный',
      maxEmissions: 0,
      features: [
        '14 дней бесплатно',
        'До 1 отчета',
        'Файлы до 200 МБ',
        'Базовые проверки и экспорт',
        'Без интеграций и SLA',
        'Для оценки интерфейса и импорта'
      ]
    },
    {
      id: 'LITE',
      name: 'Лайт',
      maxEmissions: 150000,
      features: [
        'ГИС «Экология» API, SSO (Сбер ID), шифрование, аудит',
        'Экспорт в Excel/PDF/форма ПП № 707',
        'Пользователи: до 5. Проекты: до 3',
        'Интеграции: импорт CSV/JSON (1С вручную)'
      ]
    },
    {
      id: 'STANDARD',
      name: 'Стандарт',
      maxEmissions: 1000000,
      features: [
        'Всё из «Лайт» + коннектор 1С-ESG (REST), планировщик загрузок',
        'Контроль качества данных (валидаторы/аномалии)',
        'Пользователи: до 15. Юрлица: до 3. API: доступ',
        'SLA: приоритетная поддержка в рабочие часы',
        'Авто-повышение: при >1 000 000 т — переход на «Крупный»'
      ],
      popular: true
    },
    {
      id: 'LARGE',
      name: 'Крупное предприятие',
      maxEmissions: 3000000,
      features: [
        'Всё из «Стандарт» + один ЭДО-модуль на выбор (СБИС ESG или Контур.Диадок)',
        'Персональный менеджер, расширенные роли/мульти-юрлица',
        'SLA: 99,9% + окно июня. 24/7 реакция на P1',
        'Подготовка к внешней верификации.'
      ],
      recommended: true
    },
    {
      id: 'ENTERPRISE',
      name: 'Индивидуальный',
      maxEmissions: 10000000,
      features: [
        'Выделенные ресурсы/on-prem, доп. ЭДО-каналы, белый лейбл.',
        'Индивидуальные SLA/интеграции/сегрегация данных.'
      ]
    },
    {
      id: 'CBAM',
      name: 'CBAM отчетность',
      maxEmissions: 0,
      features: [
        'Карта углеродного следа продукции, выгрузки CBAM',
        'Режим «переходного периода 2025», подготовка к 2026.'
      ]
    }
  ];

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
      calculatePricesForAllPlans();
    }
  }, [user]);

  useEffect(() => {
    if (calculatorEmissions > 0) {
      calculatePricesForAllPlans();
    }
  }, [calculatorEmissions]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subscription/current?organizationId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных подписки:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePricesForAllPlans = async () => {
    const prices: Record<string, PricingResponse> = {};
    
    for (const plan of planTemplates) {
      // Используем значения из калькулятора для всех планов
      const emissionsToCalculate = calculatorEmissions || 100000;
      
      try {
        const url = `/api/pricing/calculate?emissions=${emissionsToCalculate}&cbam=${plan.id === 'CBAM'}&plan=${plan.id}`;
        console.log(`Запрос для плана ${plan.id}:`, url);
        
        const response = await fetch(url);
        if (response.ok) {
          const data: PricingResponse = await response.json();
          console.log(`Ответ для плана ${plan.id}:`, data);
          prices[plan.id] = data;
        } else {
          console.error(`Ошибка HTTP для плана ${plan.id}:`, response.status, response.statusText);
        }
      } catch (error) {
        console.error(`Ошибка расчета для плана ${plan.id}:`, error);
      }
    }
    
    console.log('Все цены загружены:', prices);
    setCalculatedPrices(prices);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'LITE':
        return <Users className="h-5 w-5" />;
      case 'STANDARD':
        return <Crown className="h-5 w-5" />;
      case 'LARGE':
        return <Shield className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  // Функция для получения динамических features без дублирования цены
  const getDynamicFeatures = (plan: PlanTemplate) => {
    // Возвращаем только базовые функции без добавления цены
    return [...plan.features];
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Заголовок страницы */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Тарифы и подписка
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Управляйте подпиской, просматривайте тарифы и рассчитывайте стоимость
        </p>
      </div>

      {/* Текущая подписка */}
      {subscriptionData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Текущая подписка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* План */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getPlanIcon(subscriptionData.currentPlan)}
                  <span className="font-medium">
                    {planTemplates.find(p => p.id === subscriptionData.currentPlan)?.name || subscriptionData.currentPlan}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Активен до {formatDate(subscriptionData.nextBillingDate)}
                </p>
              </div>

              {/* Использование */}
              <div className="space-y-2">
                <div className="text-lg font-semibold">
                  {subscriptionData.monthlyUsage.toLocaleString()} т CO₂
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Использовано в этом месяце
                </p>
              </div>

              {/* Последний платеж */}
              {subscriptionData.lastPayment && (
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {formatCurrency(subscriptionData.lastPayment.amount)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Оплачено {formatDate(subscriptionData.lastPayment.date)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Калькулятор стоимости */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Калькулятор стоимости
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Годовой объем выбросов (т CO₂)
                  </label>
                  <input
                    type="number"
                    value={calculatorEmissions}
                    onChange={(e) => setCalculatorEmissions(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="100000"
                    min="0"
                    max="10000000"
                  />
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  *Цены автоматически обновляются при изменении объема
                </div>

                <Button 
                  onClick={calculatePricesForAllPlans}
                  className="w-full"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Пересчитать
                </Button>

                {/* Результат калькулятора */}
                {calculatorEmissions > 0 && (
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-2 border-emerald-200 dark:border-emerald-700">
                    <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Расчет для {calculatorEmissions.toLocaleString()} т CO₂/год:
                    </h4>
                    {(() => {
                      // Определяем подходящий план для введенного объема
                      let suitablePlan = 'LITE';
                      if (calculatorEmissions > 150000 && calculatorEmissions <= 1000000) suitablePlan = 'STANDARD';
                      else if (calculatorEmissions > 1000000 && calculatorEmissions <= 3000000) suitablePlan = 'LARGE';
                      else if (calculatorEmissions > 3000000) suitablePlan = 'ENTERPRISE';
                      
                      const planData = calculatedPrices[suitablePlan];
                      if (planData?.breakdown) {
                        let calculatedPrice;
                        if (suitablePlan === 'ENTERPRISE') {
                          calculatedPrice = Math.min(480000, planData.breakdown.basePayment + (calculatorEmissions * planData.breakdown.perTonRate));
                        } else {
                          calculatedPrice = planData.breakdown.basePayment + (calculatorEmissions * planData.breakdown.perTonRate);
                        }
                        
                        return (
                          <div className="space-y-2">
                            <div className="text-sm text-emerald-700 dark:text-emerald-300">
                              Рекомендуемый план: <span className="font-bold text-emerald-800 dark:text-emerald-200">{planTemplates.find(p => p.id === suitablePlan)?.name}</span>
                            </div>
                            <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100 bg-white dark:bg-emerald-900/20 rounded px-3 py-2 border border-emerald-300 dark:border-emerald-600">
                              {formatCurrency(calculatedPrice)}
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 rounded px-2 py-1">
                              📊 Расчет: {formatCurrency(planData.breakdown.basePayment)} + {calculatorEmissions.toLocaleString()} × {planData.breakdown.perTonRate}₽/т
                            </div>
                            {suitablePlan === 'ENTERPRISE' && calculatedPrice === 480000 && (
                              <div className="text-xs text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 rounded px-2 py-1">
                                ⚠️ Применен потолок цены 480 000₽
                              </div>
                            )}
                          </div>
                        );
                      }
                      return <div className="text-sm text-emerald-700 dark:text-emerald-300 animate-pulse">Загрузка расчета...</div>;
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Тарифные планы */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {planTemplates.map((plan) => {
              const pricing = calculatedPrices[plan.id];
              
              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    plan.popular
                      ? 'border-emerald-500 shadow-emerald-100 dark:shadow-emerald-900/20'
                      : plan.recommended
                      ? 'border-blue-500 shadow-blue-100 dark:shadow-blue-900/20'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-4">
                      <span className="bg-emerald-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                        Популярный
                      </span>
                    </div>
                  )}
                  
                  {plan.recommended && (
                    <div className="absolute -top-2 right-4">
                      <span className="bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                        Рекомендуем
                      </span>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getPlanIcon(plan.id)}
                      {plan.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Персональная цена для введенного объема */}
                      <div className="text-center">
                        {(() => {
                          // Рассчитываем цену для введенного в калькуляторе объема
                          const calculatePersonalPrice = () => {
                            if (plan.id === 'TRIAL') return { price: 0, text: 'Бесплатно', subtext: '14 дней' };
                            
                            const planPricing = calculatedPrices[plan.id];
                            if (!planPricing?.breakdown) {
                              return { price: null, text: 'Загрузка...', subtext: '' };
                            }

                            // Определяем, подходит ли этот план для введенного объема
                            const isApplicable = calculatorEmissions <= plan.maxEmissions || plan.id === 'ENTERPRISE' || plan.id === 'CBAM';
                            
                            if (!isApplicable && calculatorEmissions > plan.maxEmissions) {
                              return { 
                                price: null, 
                                text: 'Не подходит', 
                                subtext: `Макс. ${plan.maxEmissions.toLocaleString()} т CO₂` 
                              };
                            }

                            let finalPrice;
                            if (plan.id === 'ENTERPRISE') {
                              // Для Enterprise используем введенный объем и потолок 480k
                              finalPrice = Math.min(480000, planPricing.breakdown.basePayment + (calculatorEmissions * planPricing.breakdown.perTonRate));
                              return { 
                                price: finalPrice, 
                                text: formatCurrency(finalPrice), 
                                subtext: `для ${calculatorEmissions.toLocaleString()} т CO₂/год` 
                              };
                            } else if (plan.id === 'CBAM') {
                              // Для CBAM фиксированная формула
                              finalPrice = 15000 + (calculatorEmissions * 255);
                              return { 
                                price: finalPrice, 
                                text: formatCurrency(finalPrice), 
                                subtext: `для ${calculatorEmissions.toLocaleString()} т CO₂/год` 
                              };
                            } else {
                              // Для остальных планов используем цену из API (уже рассчитанную для нужного объема)
                              finalPrice = planPricing.breakdown.basePayment + (calculatorEmissions * planPricing.breakdown.perTonRate);
                              return { 
                                price: finalPrice, 
                                text: formatCurrency(finalPrice), 
                                subtext: `для ${calculatorEmissions.toLocaleString()} т CO₂/год` 
                              };
                            }
                          };

                          const result = calculatePersonalPrice();
                          return (
                            <>
                              <div className={`text-3xl font-bold ${
                                result.price === null 
                                  ? 'text-gray-400 dark:text-gray-500' 
                                  : result.price === 0 
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {result.text}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300 font-medium bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 mt-1">
                                {result.subtext}
                              </div>
                              {result.price && result.price > 0 && plan.id !== 'TRIAL' && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded border">
                                  {plan.id === 'ENTERPRISE' ? 'Индивидуальная цена (макс. 480 000₽)' :
                                   plan.id === 'CBAM' ? '15 000₽ фикс + 255₽/т' :
                                   pricing?.breakdown ? `${formatCurrency(pricing.breakdown.basePayment)} базовый + ${pricing.breakdown.perTonRate}₽/т` : ''}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Функции */}
                      <ul className="space-y-2">
                        {getDynamicFeatures(plan).map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-900 dark:text-gray-100">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Кнопка */}
                      <Button
                        className={`w-full ${
                          subscriptionData?.currentPlan === plan.id
                            ? 'bg-gray-500 cursor-not-allowed'
                            : plan.id === 'CBAM'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : plan.popular
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : plan.recommended
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : ''
                        }`}
                        disabled={subscriptionData?.currentPlan === plan.id}
                      >
                        {subscriptionData?.currentPlan === plan.id 
                          ? 'Текущий план' 
                          : plan.id === 'CBAM' 
                          ? 'Подключить CBAM' 
                          : 'Выбрать план'
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Быстрые действия */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="secondary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              История платежей
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Скачать счет-фактуру
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
