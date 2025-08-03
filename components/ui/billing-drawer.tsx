'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  X, 
  CreditCard, 
  Coins, 
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

interface BalanceData {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  planType: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

export default function BillingDrawer({ isOpen, onClose }: BillingDrawerProps) {
  const { user } = useUser();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true); // Переключатель месяц/год

  const plans: Plan[] = [
    {
      id: 'FREE',
      name: 'Бесплатный',
      price: 0,
      credits: 1000,
      features: ['1000 т CO₂ бесплатно', 'Базовые отчеты', 'Email поддержка']
    },
    {
      id: 'LITE_ANNUAL',
      name: 'Lite',
      price: isAnnual ? 40000 : 4000, // 40k/год или 4k/месяц
      credits: 1000,
      features: ['1000 т CO₂ в подарок', 'Приоритетная поддержка', 'Расширенная аналитика'],
      popular: true
    },
    {
      id: 'CBAM_ADDON',
      name: 'CBAM Add-on',
      price: isAnnual ? 15000 : 1500, // 15k/год или 1.5k/месяц
      credits: 0,
      features: ['CBAM отчеты', 'Европейское соответствие', 'Экспертная поддержка']
    }
  ];

  // Расчет экономии при годовой оплате
  const getAnnualSavings = (planId: string) => {
    if (planId === 'FREE') return 0;
    const monthlyTotal = planId === 'LITE_ANNUAL' ? 4000 * 12 : 1500 * 12;
    const annualPrice = planId === 'LITE_ANNUAL' ? 40000 : 15000;
    return monthlyTotal - annualPrice;
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchBalanceData();
      fetchTransactions();
    }
  }, [isOpen, user]);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/credits/balance?organizationId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setBalanceData(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/credits/history?organizationId=${user?.id}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
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
      case 'FREE':
        return <Users className="h-5 w-5" />;
      case 'LITE_ANNUAL':
        return <Crown className="h-5 w-5" />;
      case 'CBAM_ADDON':
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
                      
                      {/* Баланс */}
                      <div className="mt-4">
                        <div className="text-emerald-100 text-sm">Текущий баланс</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-white font-mono">
                            {balanceData ? (balanceData.balance || 0).toLocaleString() : '0'} т CO₂
                          </span>
                          {balanceData && (balanceData.balance || 0) < 100 && (
                            <AlertCircle className="h-5 w-5 text-orange-300" />
                          )}
                        </div>
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
                              <Coins className="h-4 w-4" />
                              <span>Кредиты</span>
                            </div>
                          </Tab>
                          <Tab
                            className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ui-selected:bg-card ui-selected:text-foreground ui-selected:shadow ui-not-selected:text-muted-foreground ui-not-selected:hover:bg-card/50 ui-not-selected:hover:text-foreground"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <TrendingUp className="h-4 w-4" />
                              <span>Тарифы</span>
                            </div>
                          </Tab>
                        </Tab.List>

                        <Tab.Panels className="mt-6">
                          {/* Панель кредитов */}
                          <Tab.Panel>
                            <div className="space-y-6">
                              {/* Статистика */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border border-border bg-card p-4">
                                  <div className="text-sm text-muted-foreground">Всего куплено</div>
                                  <div className="text-lg font-semibold text-foreground font-mono">
                                    {balanceData ? (balanceData.totalPurchased || 0).toLocaleString() : '0'} т
                                  </div>
                                </div>
                                <div className="rounded-lg border border-border bg-card p-4">
                                  <div className="text-sm text-muted-foreground">Использовано</div>
                                  <div className="text-lg font-semibold text-foreground font-mono">
                                    {balanceData ? (balanceData.totalUsed || 0).toLocaleString() : '0'} т
                                  </div>
                                </div>
                              </div>

                              {/* График прогресса "Куплено / Использовано" */}
                              {balanceData && (balanceData.totalPurchased > 0) && (
                                <div className="rounded-lg border border-border bg-card p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-foreground">Использование кредитов</h4>
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round((balanceData.totalUsed / balanceData.totalPurchased) * 100)}%
                                    </span>
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  <div className="w-full bg-muted rounded-full h-3 mb-3">
                                    <div 
                                      className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-300 ease-out"
                                      style={{ 
                                        width: `${Math.min((balanceData.totalUsed / balanceData.totalPurchased) * 100, 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                  
                                  {/* Детали */}
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Использовано: {balanceData.totalUsed.toLocaleString()} т</span>
                                    <span>Всего: {balanceData.totalPurchased.toLocaleString()} т</span>
                                  </div>
                                </div>
                              )}

                              {/* Прогноз затрат */}
                              {balanceData && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <h4 className="text-sm font-medium text-amber-900 dark:text-amber-200">Прогноз затрат до конца месяца</h4>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {(() => {
                                      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                                      const currentDay = new Date().getDate();
                                      const daysRemaining = daysInMonth - currentDay;
                                      
                                      // Средний расход в день (если есть данные об использовании)
                                      const dailyUsage = balanceData.totalUsed > 0 ? balanceData.totalUsed / currentDay : 5;
                                      const projectedUsage = dailyUsage * daysRemaining;
                                      const projectedCost = projectedUsage * 5; // 5₽ за тонну
                                      
                                      return (
                                        <>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-amber-700 dark:text-amber-300">Прогноз использования:</span>
                                            <span className="font-mono text-amber-900 dark:text-amber-100">{Math.round(projectedUsage)} т CO₂</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-amber-700 dark:text-amber-300">Ориентировочная стоимость:</span>
                                            <span className="font-mono font-semibold text-amber-900 dark:text-amber-100">{formatCurrency(projectedCost)}</span>
                                          </div>
                                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                            *Прогноз основан на среднем потреблении
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* Кнопка пополнения */}
                              <button className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Пополнить баланс
                              </button>

                              {/* История транзакций */}
                              <div>
                                <h3 className="text-sm font-medium text-foreground mb-3">
                                  Последние операции
                                </h3>
                                <div className="space-y-3">
                                  {transactions.length > 0 ? (
                                    transactions.map((transaction) => (
                                      <div
                                        key={transaction.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted"
                                      >
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-foreground">
                                            {transaction.description}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {formatDate(transaction.createdAt)}
                                          </div>
                                        </div>
                                        <div
                                          className={`text-sm font-semibold font-mono ${
                                            transaction.type === 'CREDIT'
                                              ? 'text-emerald-600'
                                              : 'text-red-600'
                                          }`}
                                        >
                                          {transaction.type === 'CREDIT' ? '+' : '-'}
                                          {transaction.amount.toLocaleString()} т
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-6 text-muted-foreground">
                                      <Coins className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                      <p className="text-sm">Нет транзакций</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Tab.Panel>

                          {/* Панель тарифов */}
                          <Tab.Panel>
                            <div className="space-y-6">
                              {/* Переключатель месяц/год */}
                              <div className="flex items-center justify-center">
                                <div className="flex items-center bg-muted rounded-lg p-1">
                                  <button
                                    onClick={() => setIsAnnual(false)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                      !isAnnual
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    Месяц
                                  </button>
                                  <button
                                    onClick={() => setIsAnnual(true)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                      isAnnual
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    Год
                                    {isAnnual && (
                                      <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-1 rounded-full">
                                        Экономия
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                              {/* Планы */}
                              <div className="space-y-4">
                              {plans.map((plan) => (
                                <div
                                  key={plan.id}
                                  className={`relative rounded-lg border p-4 ${
                                    plan.popular
                                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-600'
                                      : 'border-border bg-card'
                                  }`}
                                >
                                  {plan.popular && (
                                    <div className="absolute -top-2 left-4">
                                      <span className="bg-emerald-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                                        Популярный
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className={`p-2 rounded-lg ${
                                        plan.popular ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-muted'
                                      }`}>
                                        {getPlanIcon(plan.id)}
                                      </div>
                                      <div>
                                        <h3 className="font-medium text-foreground">{plan.name}</h3>
                                        <div className="flex items-baseline space-x-2">
                                          <p className="text-sm text-foreground font-semibold">
                                            {formatCurrency(plan.price)}
                                            {plan.id !== 'FREE' && (
                                              <span className="text-muted-foreground font-normal">
                                                /{isAnnual ? 'год' : 'мес'}
                                              </span>
                                            )}
                                          </p>
                                          {isAnnual && plan.id !== 'FREE' && (
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                              Экономия {formatCurrency(getAnnualSavings(plan.id))}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <ul className="mt-3 space-y-1">
                                    {plan.features.map((feature, index) => (
                                      <li key={index} className="text-sm text-muted-foreground flex items-center">
                                        <span className="mr-2">•</span>
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                  
                                  <button
                                    className={`mt-4 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                      plan.popular
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-muted text-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    {plan.id === 'FREE' ? 'Текущий план' : 'Выбрать план'}
                                  </button>
                                </div>
                              ))}
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
