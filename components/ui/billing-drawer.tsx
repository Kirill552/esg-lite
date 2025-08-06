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
  Users
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

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

interface PricingPlan {
  id: string;
  name: string;
  basePayment: number;
  perTonRate: number;
  maxEmissions: number;
  features: string[];
  popular?: boolean;
  recommended?: boolean;
}

export default function BillingDrawer({ isOpen, onClose }: BillingDrawerProps) {
  const { user } = useUser();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatorEmissions, setCalculatorEmissions] = useState(100000);
  const [planPricing, setPlanPricing] = useState<any>(null);

  // Статические данные о планах (структура и описания) - цены получаем из API
  const planTemplates = [
    {
      id: 'LITE',
      name: 'Лайт',
      maxEmissions: 150000,
      features: [
        'От 50 000 до 150 000 т CO₂/год',
        'Базовая отчетность',
        'Email поддержка',
        'Экспорт в Excel/PDF'
      ]
    },
    {
      id: 'STANDARD',
      name: 'Стандарт',
      maxEmissions: 1000000,
      features: [
        'От 150 000 до 1 млн т CO₂/год',
        'Расширенная аналитика',
        'Приоритетная поддержка',
        'API доступ',
        'Интеграция с 1С'
      ],
      popular: true
    },
    {
      id: 'LARGE',
      name: 'Крупное предприятие',
      maxEmissions: 3000000,
      features: [
        'От 1 млн до 3 млн т CO₂/год',
        'Персональный менеджер',
        '24/7 поддержка',
        'Кастомизация отчетов',
        'Белый лейбл',
        'SLA 99.9%'
      ],
      recommended: true
    },
    {
      id: 'ENTERPRISE',
      name: 'Индивидуальный',
      maxEmissions: 10000000,
      features: [
        'Свыше 3 млн т CO₂/год',
        'Индивидуальные условия',
        'Выделенные ресурсы',
        'Полная кастомизация',
        'Интеграция с корп. системами',
        'Консультации экспертов'
      ]
    }
  ];

  // Получение ценообразования из API (читает .env)
  const fetchPricingForEmissions = async (emissions: number) => {
    try {
      const response = await fetch(`/api/pricing/calculate?emissions=${emissions}&cbam=false`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
    return null;
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchSubscriptionData();
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
      minimumFractionDigits: 0
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
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
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
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center space-x-3">
                                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                          {getPlanIcon(subscriptionData.currentPlan)}
                                        </div>
                                        <div>
                                          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                                            {planTemplates.find(p => p.id === subscriptionData.currentPlan)?.name}
                                          </h3>
                                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                            Активен до {new Date(subscriptionData.nextBillingDate).toLocaleDateString('ru-RU')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {subscriptionData.lastPayment && (
                                          <>
                                            <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                                              {formatCurrency(subscriptionData.lastPayment.amount)}
                                            </div>
                                            <div className="text-xs text-emerald-700 dark:text-emerald-300">
                                              {new Date(subscriptionData.lastPayment.date).toLocaleDateString('ru-RU')}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Статистика использования */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border border-border bg-card p-4">
                                      <div className="text-sm text-muted-foreground">В этом месяце</div>
                                      <div className="text-lg font-semibold text-foreground font-mono">
                                        {subscriptionData.monthlyUsage.toLocaleString()} т CO₂
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-border bg-card p-4">
                                      <div className="text-sm text-muted-foreground">Всего за год</div>
                                      <div className="text-lg font-semibold text-foreground font-mono">
                                        {subscriptionData.totalEmissions.toLocaleString()} т CO₂
                                      </div>
                                    </div>
                                  </div>

                                  {/* Прогноз стоимости */}
                                  {(() => {
                                    const currentPlan = planTemplates.find(p => p.id === subscriptionData.currentPlan);
                                    if (!currentPlan) return null;
                                    
                                    // Простые моковые расчеты для демонстрации
                                    const estimatedMonthlyCost = subscriptionData.monthlyUsage * 2; // 2₽ за тонну примерно
                                    const estimatedYearlyCost = subscriptionData.totalEmissions * 1.5; // 1.5₽ за тонну примерно
                                    
                                    return (
                                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-600 p-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">Расчет стоимости</h4>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-blue-700 dark:text-blue-300">За текущий месяц:</span>
                                            <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                                              {formatCurrency(estimatedMonthlyCost)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-blue-700 dark:text-blue-300">Прогноз на год:</span>
                                            <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                                              {formatCurrency(estimatedYearlyCost)}
                                            </span>
                                          </div>
                                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 border-t border-blue-200 dark:border-blue-700 pt-2">
                                            Базовая оплата + переменная часть по объему выбросов
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Кнопки управления */}
                                  <div className="space-y-3">
                                    <a 
                                      href="/tariffs"
                                      className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    >
                                      <TrendingUp className="h-4 w-4 mr-2" />
                                      Управление подпиской
                                    </a>
                                    <button className="w-full flex items-center justify-center px-4 py-2 border border-muted text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                                      Скачать счет-фактуру
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-8">
                                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                  <h3 className="text-lg font-medium text-foreground mb-2">Нет активной подписки</h3>
                                  <p className="text-muted-foreground mb-6">
                                    Выберите тарифный план для начала работы с платформой
                                  </p>
                                  <a 
                                    href="/tariffs"
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors inline-block"
                                  >
                                    Выбрать план
                                  </a>
                                </div>
                              )}
                            </div>
                          </Tab.Panel>

                          {/* Панель тарифов */}
                          <Tab.Panel>
                            <div className="space-y-6">
                              {/* Калькулятор стоимости */}
                              <div className="rounded-lg border border-muted bg-card p-4">
                                <h3 className="text-sm font-medium text-foreground mb-3">
                                  Калькулятор стоимости
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs text-muted-foreground">Объем выбросов (т CO₂/год)</label>
                                    <input
                                      type="number"
                                      placeholder="100000"
                                      className="w-full mt-1 px-3 py-2 border border-muted rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        // Здесь можно добавить логику для обновления расчетов
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    *Введите ожидаемый годовой объем для точного расчета
                                  </div>
                                </div>
                              </div>

                              {/* Планы */}
                              <div className="space-y-4">
                                {planTemplates.map((planTemplate) => (
                                  <div
                                    key={planTemplate.id}
                                    className={`relative rounded-lg border p-4 ${
                                      planTemplate.popular
                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-600'
                                        : planTemplate.recommended
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-600'
                                        : 'border-border bg-card'
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
                                    
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${
                                          planTemplate.popular 
                                            ? 'bg-emerald-100 dark:bg-emerald-900/50' 
                                            : planTemplate.recommended
                                            ? 'bg-blue-100 dark:bg-blue-900/50'
                                            : 'bg-muted'
                                        }`}>
                                          {getPlanIcon(planTemplate.id)}
                                        </div>
                                        <div>
                                          <h3 className="font-medium text-foreground">{planTemplate.name}</h3>
                                          <div className="space-y-1">
                                            <div className="text-sm text-foreground">
                                              <span className="font-semibold">Загрузка...</span>
                                              <span className="text-muted-foreground"> базовый платеж</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              + расчет по объему
                                            </div>
                                            {planTemplate.maxEmissions !== Infinity && (
                                              <div className="text-xs text-muted-foreground">
                                                до {(planTemplate.maxEmissions / 1000).toLocaleString()}К т/год
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <ul className="mt-3 space-y-1">
                                      {planTemplate.features.map((feature, index) => (
                                        <li key={index} className="text-sm text-muted-foreground flex items-center">
                                          <span className="mr-2 text-emerald-500">•</span>
                                          {feature}
                                        </li>
                                      ))}
                                    </ul>
                                    
                                    <button
                                      className={`mt-4 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        planTemplate.popular
                                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                          : planTemplate.recommended
                                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                                          : 'bg-muted text-foreground hover:bg-muted/80'
                                      }`}
                                    >
                                      {subscriptionData?.currentPlan === planTemplate.id ? 'Текущий план' : 'Выбрать план'}
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Информация о CBAM */}
                              <div className="rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-600 p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <h4 className="text-sm font-medium text-orange-900 dark:text-orange-200">CBAM отчетность</h4>
                                </div>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                                  Для экспорта в ЕС требуется дополнительная отчетность CBAM
                                </p>
                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                  <strong>Доплата за CBAM:</strong> +0.5₽ за тонну CO₂ для всех планов
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
