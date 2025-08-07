'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  X, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Crown,
  Shield,
  Users,
  Calculator,
  Check,
  Star,
  Zap,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface BillingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

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

interface PricingData {
  planType: string;
  basePrice: number;
  variablePrice: number;
  finalPrice: number;
  currency: string;
  breakdown: {
    basePayment: number;
    perTonRate: number;
    tonnageAboveMin: number;
    variableCost: number;
    surgeApplied: boolean;
  };
}

export default function BillingDrawer({ isOpen, onClose }: BillingDrawerProps) {
  const { user } = useUser();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, PricingData>>({});
  const [calculatingPrices, setCalculatingPrices] = useState(false);

  // Статические данные о планах с обновленными функциями
  const planTemplates = [
    {
      id: 'TRIAL',
      name: 'Пробный',
      maxEmissions: 0,
      duration: '14 дней бесплатно',
      icon: <Users className="h-5 w-5" />,
      features: [
        '14 дней бесплатно',
        'До 1 отчета',
        'Файлы до 200 МБ',
        'Базовые проверки и экспорт',
        'Без интеграций и SLA'
      ]
    },
    {
      id: 'LITE',
      name: 'Лайт',
      maxEmissions: 150000,
      icon: <Users className="h-5 w-5" />,
      features: [
        'ГИС «Экология» API, SSO (Сбер ID), шифрование, аудит',
        'Экспорт в Excel/PDF/форма ПП № 707',
        'Пользователи: до 5. Проекты: до 3',
        'Интеграции: импорт CSV/JSON (1С вручную)'
      ],
      recommended: true
    },
    {
      id: 'STANDARD',
      name: 'Стандарт',
      maxEmissions: 1000000,
      icon: <Crown className="h-5 w-5" />,
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
      icon: <Shield className="h-5 w-5" />,
      features: [
        'Всё из «Стандарт» + один ЭДО-модуль на выбор (СБИС ESG или Контур.Диадок)',
        'Персональный менеджер, расширенные роли/мульти-юрлица',
        'SLA: 99,9% + окно июня. 24/7 реакция на P1',
        'Подготовка к внешней верификации.'
      ]
    },
    {
      id: 'ENTERPRISE',
      name: 'Индивидуальный',
      maxEmissions: 10000000,
      icon: <Crown className="h-5 w-5" />,
      features: [
        'Выделенные ресурсы/on-prem, доп. ЭДО-каналы, белый лейбл.',
        'Индивидуальные SLA/интеграции/сегрегация данных.'
      ]
    }
  ];

  // CBAM план как отдельный аддон
  const cbamAddon = {
    id: 'CBAM',
    name: 'CBAM отчетность',
    icon: <Zap className="h-5 w-5" />,
    features: [
      'Карта углеродного следа продукции, выгрузки CBAM',
      'Режим «переходного периода 2025», подготовка к 2026.'
    ]
  };

  // Получение ценообразования из API
  const fetchPricingForEmissions = async (emissions: number, plan: string, withCbam: boolean = false) => {
    try {
      const response = await fetch(`/api/pricing/calculate?emissions=${emissions}&plan=${plan}&cbam=${withCbam}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
    return null;
  };

  // Расчет цен для всех планов (базовый объем 100к тонн)
  const calculatePricesForAllPlans = async () => {
    const baseEmissions = 100000; // базовый объем для отображения цен
    
    setCalculatingPrices(true);
    const newPrices: Record<string, PricingData> = {};
    
    try {
      // Рассчитываем цены для всех планов
      const planIds = ['TRIAL', 'LITE', 'STANDARD', 'LARGE', 'ENTERPRISE'];
      
      for (const planId of planIds) {
        const pricing = await fetchPricingForEmissions(baseEmissions, planId, false);
        if (pricing) {
          newPrices[planId] = pricing;
        }
      }
      
      // Рассчитываем CBAM отдельно
      const cbamPricing = await fetchPricingForEmissions(baseEmissions, 'CBAM', true);
      if (cbamPricing) {
        newPrices['CBAM'] = cbamPricing;
      }
      
      setCalculatedPrices(newPrices);
    } catch (error) {
      console.error('Error calculating prices:', error);
    } finally {
      setCalculatingPrices(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchSubscriptionData();
      calculatePricesForAllPlans();
    }
  }, [isOpen, user]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanIcon = (planId: string) => {
    const plan = planTemplates.find(p => p.id === planId);
    return plan?.icon || <CreditCard className="h-5 w-5" />;
  };

  const handleCalculatorRedirect = () => {
    onClose();
    router.push('/tariffs');
  };

  // Функция для получения динамических features с ценами из API
  const getDynamicFeatures = (plan: any) => {
    const pricing = calculatedPrices[plan.id];
    const baseFeatures = [...plan.features];
    
    // Добавляем ценовую информацию в начало списка features
    if (pricing?.breakdown && plan.id !== 'TRIAL') {
      let priceFeature = '';
      if (plan.id === 'ENTERPRISE') {
        priceFeature = `Индивидуально, потолок цены — ${formatCurrency(480000)}/год`;
      } else if (plan.id === 'CBAM') {
        priceFeature = `${formatCurrency(15000)}/год + ${formatCurrency(255)}/т (переходный учёт/квартальная отчётность)`;
      } else {
        priceFeature = `${formatCurrency(pricing.breakdown.basePayment)} базовый + ${pricing.breakdown.perTonRate}₽/т`;
      }
      baseFeatures.unshift(priceFeature);
    }
    
    return baseFeatures;
  };

  const getCbamFeatures = () => {
    const pricing = calculatedPrices['CBAM'];
    const baseFeatures = [...cbamAddon.features];
    
    if (pricing?.breakdown) {
      const priceFeature = `${formatCurrency(15000)} базовый + 255₽/т`;
      baseFeatures.unshift(priceFeature);
    }
    
    return baseFeatures;
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-background shadow-xl border-l border-border">
                    {/* Хедер */}
                    <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-white">
                          Управление счетом
                        </Dialog.Title>
                        <button
                          type="button"
                          className="relative rounded-md text-emerald-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          onClick={onClose}
                        >
                          <span className="absolute -inset-2.5" />
                          <span className="sr-only">Закрыть панель</span>
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                      
                      {/* Текущий план и использование */}
                      <div className="mt-4">
                        {subscriptionData ? (
                          <>
                            <div className="text-emerald-100 text-sm">Текущий план</div>
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-white">
                                {planTemplates.find(p => p.id === subscriptionData.currentPlan)?.name || 'Неизвестен'}
                              </span>
                              <div className="text-right">
                                <div className="text-emerald-100 text-xs">В этом месяце</div>
                                <div className="text-white font-mono text-sm">
                                  {subscriptionData.monthlyUsage.toLocaleString()} т CO₂
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-emerald-100 text-sm">Нет активной подписки</div>
                            <div className="text-white text-lg font-semibold">
                              Выберите тарифный план
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Контент */}
                    <div className="flex-1 px-4 py-6 sm:px-6">
                      <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-muted p-1">
                          <Tab
                            className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ui-selected:bg-card ui-selected:text-foreground ui-selected:shadow ui-not-selected:text-muted-foreground ui-not-selected:hover:bg-card/50 ui-not-selected:hover:text-foreground"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <TrendingUp className="h-4 w-4" />
                              <span>Подписка</span>
                            </div>
                          </Tab>
                          <Tab
                            className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ui-selected:bg-card ui-selected:text-foreground ui-selected:shadow ui-not-selected:text-muted-foreground ui-not-selected:hover:bg-card/50 ui-not-selected:hover:text-foreground"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <CreditCard className="h-4 w-4" />
                              <span>Тарифы</span>
                            </div>
                          </Tab>
                        </Tab.List>

                        <Tab.Panels className="mt-6">
                          {/* Панель подписки */}
                          <Tab.Panel>
                            <div className="space-y-6">
                              {subscriptionData ? (
                                <>
                                  {/* Текущий план */}
                                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-600 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-3">
                                        {getPlanIcon(subscriptionData.currentPlan)}
                                        <div>
                                          <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                                            {planTemplates.find(p => p.id === subscriptionData.currentPlan)?.name}
                                          </h3>
                                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                            Активен до {formatDate(subscriptionData.nextBillingDate)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                                          {subscriptionData.lastPayment ? formatCurrency(subscriptionData.lastPayment.amount) : '—'}
                                        </div>
                                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                          Последний платеж
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Кнопка управления тарифами */}
                                    <button
                                      onClick={handleCalculatorRedirect}
                                      className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Settings className="h-4 w-4" />
                                      Управление тарифами и подписками
                                    </button>
                                  </div>

                                  {/* Статистика использования */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-card p-4 rounded-lg border">
                                      <div className="text-2xl font-bold text-foreground">
                                        {subscriptionData.monthlyUsage.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-muted-foreground">т CO₂ в этом месяце</div>
                                    </div>
                                    <div className="bg-card p-4 rounded-lg border">
                                      <div className="text-2xl font-bold text-foreground">
                                        {subscriptionData.totalEmissions.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-muted-foreground">т CO₂ всего</div>
                                    </div>
                                  </div>

                                  {/* Прогноз трат */}
                                  {subscriptionData && (() => {
                                    const currentPlan = planTemplates.find(p => p.id === subscriptionData.currentPlan);
                                    const pricing = calculatedPrices[subscriptionData.currentPlan];
                                    
                                    if (currentPlan && pricing?.breakdown && subscriptionData.monthlyUsage > 0) {
                                      // Прогнозируем годовое потребление на основе текущего месячного
                                      const projectedYearlyEmissions = subscriptionData.monthlyUsage * 12;
                                      const projectedYearlyCost = pricing.breakdown.basePayment + (projectedYearlyEmissions * pricing.breakdown.perTonRate);
                                      
                                      return (
                                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-600 rounded-lg p-4">
                                          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Прогноз годовых расходов
                                          </h4>
                                          <div className="space-y-2">
                                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                              {formatCurrency(projectedYearlyCost)}
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400">
                                              📊 На основе: {projectedYearlyEmissions.toLocaleString()} т CO₂/год
                                            </div>
                                            <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-1">
                                              {formatCurrency(pricing.breakdown.basePayment)} базовый + {projectedYearlyEmissions.toLocaleString()} × {pricing.breakdown.perTonRate}₽/т
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              ) : (
                                <div className="text-center py-8">
                                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                  <h3 className="text-lg font-medium text-foreground mb-2">
                                    Нет активной подписки
                                  </h3>
                                  <p className="text-muted-foreground mb-4">
                                    Выберите подходящий тарифный план
                                  </p>
                                  
                                  {/* Кнопка для перехода к тарифам */}
                                  <button
                                    onClick={handleCalculatorRedirect}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center justify-center gap-2 mx-auto"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Выбрать тарифный план
                                  </button>
                                </div>
                              )}
                            </div>
                          </Tab.Panel>

                          {/* Панель тарифов */}
                          <Tab.Panel>
                            <div className="space-y-6">
                              {/* Кнопка калькулятора стоимости */}
                              <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-600 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Calculator className="h-5 w-5 text-blue-600" />
                                    <div>
                                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                                        Калькулятор стоимости
                                      </h3>
                                      <p className="text-sm text-blue-600 dark:text-blue-400">
                                        Рассчитайте точную стоимость для ваших выбросов
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={handleCalculatorRedirect}
                                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Перейти к калькулятору тарифов
                                </button>
                              </div>

                              {/* Планы */}
                              <div className="grid gap-4">
                                {planTemplates.map((planTemplate) => {
                                  const pricing = calculatedPrices[planTemplate.id];
                                  
                                  return (
                                    <div
                                      key={planTemplate.id}
                                      className={`relative border rounded-lg p-4 transition-all ${
                                        planTemplate.popular
                                          ? 'border-emerald-500 shadow-emerald-100 dark:shadow-emerald-900/20'
                                          : planTemplate.recommended
                                          ? 'border-blue-500 shadow-blue-100 dark:shadow-blue-900/20'
                                          : 'border-border'
                                      }`}
                                    >
                                      {planTemplate.popular && (
                                        <div className="absolute -top-2 left-4">
                                          <span className="bg-emerald-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                                            Популярный
                                          </span>
                                        </div>
                                      )}
                                      
                                      {planTemplate.recommended && (
                                        <div className="absolute -top-2 right-4">
                                          <span className="bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                                            Рекомендуем
                                          </span>
                                        </div>
                                      )}

                                      <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                          {planTemplate.icon}
                                          <div>
                                            <h4 className="text-lg font-semibold text-foreground">
                                              {planTemplate.name}
                                            </h4>
                                            {planTemplate.id !== 'TRIAL' && planTemplate.maxEmissions > 0 && (
                                              <p className="text-sm text-muted-foreground">
                                                до {planTemplate.maxEmissions.toLocaleString()} т CO₂/год
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="text-right">
                                          <div className={`text-xl font-bold ${
                                            planTemplate.id === 'TRIAL'
                                              ? 'text-emerald-600 dark:text-emerald-400'
                                              : 'text-foreground'
                                          }`}>
                                            {planTemplate.id === 'TRIAL' 
                                              ? 'Бесплатно'
                                              : pricing?.breakdown 
                                              ? `от ${formatCurrency(pricing.breakdown.basePayment)}`
                                              : calculatingPrices 
                                              ? 'Загрузка...' 
                                              : 'от 15 000 ₽'
                                            }
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {planTemplate.id === 'TRIAL' ? '14 дней' : 'базовая цена'}
                                          </div>
                                        </div>
                                      </div>

                                      <ul className="space-y-1 mb-4">
                                        {getDynamicFeatures(planTemplate).map((feature, index) => (
                                          <li key={index} className="flex items-start space-x-2 text-sm">
                                            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground">{feature}</span>
                                          </li>
                                        ))}
                                      </ul>

                                      <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                        {planTemplate.id === 'TRIAL' ? 'Начать бесплатный период' : 'Выбрать план'}
                                      </button>
                                    </div>
                                  );
                                })}

                                {/* CBAM модуль как отдельная карточка */}
                                <div className="border border-orange-200 dark:border-orange-600 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-950/20">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                      {cbamAddon.icon}
                                      <div>
                                        <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                                          {cbamAddon.name}
                                        </h4>
                                        <p className="text-sm text-orange-600 dark:text-orange-400">
                                          Дополнительный модуль
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <div className="text-xl font-bold text-orange-800 dark:text-orange-200">
                                        {calculatedPrices['CBAM']?.breakdown 
                                          ? `от ${formatCurrency(15000)}`
                                          : calculatingPrices 
                                          ? 'Загрузка...' 
                                          : 'от 15 000 ₽'
                                        }
                                      </div>
                                      <div className="text-xs text-orange-600 dark:text-orange-400">
                                        базовая цена
                                      </div>
                                    </div>
                                  </div>

                                  <ul className="space-y-1 mb-4">
                                    {getCbamFeatures().map((feature, index) => (
                                      <li key={index} className="flex items-start space-x-2 text-sm">
                                        <Check className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-orange-700 dark:text-orange-300">{feature}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                                    Подключить CBAM
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
