'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard,
  Crown,
  Star,
  Check,
  X,
  Calendar,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Globe,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  plan: 'FREE' | 'LITE_ANNUAL' | 'CBAM_ADDON';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  created_at: string;
}

interface SubscriptionPlan {
  planType: 'FREE' | 'LITE_ANNUAL' | 'CBAM_ADDON';
  name: string;
  description: string;
  priceRub: number;
  durationMonths: number;
  creditsIncluded: number;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
  formattedPrice?: string;
  savings?: {
    monthlyEquivalent: number;
    formattedMonthlyEquivalent: string;
  } | null;
}

const getStatusColors = (status: string) => {
  const colors = {
    ACTIVE: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    CANCELLED: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    EXPIRED: 'text-muted-foreground bg-accent',
    PENDING: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
  };
  return colors[status as keyof typeof colors] || 'text-muted-foreground bg-accent';
};

// Функция для получения стиля кнопки в зависимости от типа плана
const getPlanButtonStyle = (planType: string) => {
  const styles = {
    'FREE': 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-lg hover:shadow-xl border-0',
    'LITE_ANNUAL': 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl border-0',
    'CBAM_ADDON': 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl border-0'
  };
  return styles[planType as keyof typeof styles] || 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-lg hover:shadow-xl border-0';
};

export default function SubscriptionPage() {
  const { user } = useUser();
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Получение organizationId из Clerk
  const organizationId = useMemo(() => {
    console.log('🔍 Subscription page - user:', user);
    console.log('🔍 Subscription page - organizationMemberships:', user?.organizationMemberships);
    const orgId = user?.organizationMemberships?.[0]?.organization?.id;
    console.log('🔍 Subscription page - organizationId:', orgId);
    return orgId;
  }, [user]);

  // Загрузка данных о тарифах
  const fetchSubscriptionData = async () => {
    const targetId = organizationId || user?.id;
    console.log('🔍 Subscription page - fetchSubscriptionData targetId:', targetId);
    
    if (!targetId) {
      console.log('❌ Subscription page - No targetId available');
      return;
    }
    
    try {
      const [subscriptionsResponse, plansResponse] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/subscriptions/plans')
      ]);
      
      console.log('🔍 Subscription page - subscriptionsResponse status:', subscriptionsResponse.status);
      console.log('🔍 Subscription page - plansResponse status:', plansResponse.status);
      
      const subscriptionsData = await subscriptionsResponse.json();
      const plansData = await plansResponse.json();
      
      console.log('🔍 Subscription page - subscriptionsData:', subscriptionsData);
      console.log('🔍 Subscription page - plansData:', plansData);
      
      if (subscriptionsData.success) {
        setActiveSubscription(subscriptionsData.data?.activeSubscription || subscriptionsData.activeSubscription);
        setSubscriptionHistory(subscriptionsData.data?.history || subscriptionsData.history || []);
      }
      
      if (plansData.success) {
        setAvailablePlans(plansData.data?.plans || plansData.plans || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных тарифа:', error);
    }
  };

  // Первоначальная загрузка
  useEffect(() => {
    const targetId = organizationId || user?.id;
    console.log('🔍 Subscription page - useEffect targetId:', targetId);
    
    if (targetId) {
      console.log('🔍 Subscription page - Starting data fetch...');
      setLoading(true);
      fetchSubscriptionData().finally(() => {
        console.log('🔍 Subscription page - Data fetch completed, setting loading to false');
        setLoading(false);
      });
    } else if (user !== undefined) {
      // Если user загружен, но нет targetId - это не состояние загрузки
      console.log('🔍 Subscription page - User loaded but no targetId, stopping loading');
      setLoading(false);
    }
  }, [organizationId, user?.id, user]);

  // Обработчики событий
  const handleRefresh = async () => {
    await fetchSubscriptionData();
  };

  const handleChangePlan = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowChangePlanModal(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan || !organizationId) return;
    
    setActionLoading('change-plan');
    try {
      const response = await fetch('/api/subscriptions/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          newPlan: selectedPlan.planType,
          immediate: true
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchSubscriptionData();
        setShowChangePlanModal(false);
        setSelectedPlan(null);
      } else {
        console.error('Ошибка смены плана:', data.message);
      }
    } catch (error) {
      console.error('Ошибка запроса смены плана:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription || !organizationId) return;
    
    setActionLoading('cancel');
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          action: 'cancel'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchSubscriptionData();
      } else {
        console.error('Ошибка отмены тарифа:', data.message);
      }
    } catch (error) {
      console.error('Ошибка запроса отмены:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Утилиты форматирования
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ACTIVE: 'Активна',
      CANCELLED: 'Отменена',
      EXPIRED: 'Истекла',
      PENDING: 'Ожидание'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'text-emerald-600 bg-emerald-50',
      CANCELLED: 'text-red-600 bg-red-50',
      EXPIRED: 'text-gray-600 bg-gray-50',
      PENDING: 'text-amber-600 bg-amber-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getPlanIcon = (planId: string) => {
    const icons = {
      FREE: Users,
      LITE_ANNUAL: Crown,
      CBAM_ADDON: Shield
    };
    return icons[planId as keyof typeof icons] || Star;
  };

  // Функция для получения цветовой схемы плана
  const getPlanColorScheme = (planType: string) => {
    const colorSchemes = {
      FREE: {
        bg: 'bg-accent',
        text: 'text-muted-foreground',
        border: 'border-border',
        button: 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-lg hover:shadow-xl'
      },
      LITE_ANNUAL: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
      },
      CBAM_ADDON: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
      }
    };
    return colorSchemes[planType as keyof typeof colorSchemes] || colorSchemes.FREE;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-accent rounded w-64 mb-4"></div>
            <div className="h-4 bg-accent rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-48 bg-accent rounded-xl"></div>
              <div className="h-48 bg-accent rounded-xl"></div>
              <div className="h-48 bg-accent rounded-xl"></div>
            </div>
            <div className="h-64 bg-accent rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8" data-testid="subscription-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Управление тарифами
              </h1>
              <p className="text-muted-foreground">
                Просматривайте и управляйте вашим тарифным планом
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Обновить</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        {activeSubscription && (
          <Card className="mb-8 bg-card border border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Текущий тариф</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(activeSubscription.status)
                  }`}>
                    {getStatusLabel(activeSubscription.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {activeSubscription.plan === 'FREE' ? 'Бесплатный план' :
                       activeSubscription.plan === 'LITE_ANNUAL' ? 'ESG-Lite Annual' :
                       'CBAM Add-on'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {activeSubscription.end_date 
                        ? `Действует до ${formatDate(activeSubscription.end_date)}`
                        : 'Бессрочно'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {activeSubscription.status === 'ACTIVE' && activeSubscription.plan !== 'FREE' && (
                    <Button
                      onClick={handleCancelSubscription}
                      variant="error"
                      size="sm"
                      loading={actionLoading === 'cancel'}
                    >
                      Отменить тариф
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Доступные планы</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => {
              const IconComponent = getPlanIcon(plan.planType);
              const colorScheme = getPlanColorScheme(plan.planType);
              const isCurrentPlan = activeSubscription?.plan === plan.planType;
              
              return (
                <Card 
                  key={plan.planType} 
                  className={`relative overflow-hidden transition-shadow hover:shadow-card-hover bg-card border border-border ${
                    plan.popular ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-xs font-medium">
                      Популярный
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className={`w-12 h-12 ${colorScheme.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`w-6 h-6 ${colorScheme.text}`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-card-foreground">
                      {plan.name}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {plan.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-card-foreground">
                        {plan.priceRub === 0 ? 'Бесплатно' : `${plan.priceRub.toLocaleString()} ₽`}
                      </div>
                      {plan.priceRub > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {plan.durationMonths === 12 ? 'в год' : 'в месяц'}
                        </div>
                      )}
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                      
                      {plan.creditsIncluded > 0 && (
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {plan.creditsIncluded} т CO₂ кредитов включено
                          </span>
                        </li>
                      )}
                    </ul>
                    
                    <Button
                      onClick={() => handleChangePlan(plan)}
                      disabled={isCurrentPlan || actionLoading === 'change-plan'}
                      className={`w-full ${getPlanColorScheme(plan.planType).button}`}
                      loading={actionLoading === 'change-plan' && selectedPlan?.planType === plan.planType}
                    >
                      {isCurrentPlan ? 'Текущий план' : 'Выбрать план'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tariff History */}
        {subscriptionHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span>История тарифов</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        План
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Период
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Автопродление
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptionHistory.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {React.createElement(getPlanIcon(subscription.plan), { 
                              className: "w-4 h-4 text-gray-500" 
                            })}
                            <span className="text-sm font-medium text-gray-900">
                              {subscription.plan === 'FREE' ? 'Бесплатный' :
                               subscription.plan === 'LITE_ANNUAL' ? 'ESG-Lite Annual' :
                               'CBAM Add-on'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getStatusColor(subscription.status)
                          }`}>
                            {getStatusLabel(subscription.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(subscription.start_date)} - {
                            subscription.end_date ? formatDate(subscription.end_date) : 'Текущий'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {subscription.auto_renew ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Change Modal */}
        {showChangePlanModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Изменить тарифный план
              </h3>
              <p className="text-muted-foreground mb-6">
                Вы действительно хотите изменить план на <strong className="text-foreground">{selectedPlan.name}</strong>?
                {selectedPlan.priceRub > 0 && (
                  <span> Стоимость: <strong className="text-foreground">{selectedPlan.priceRub.toLocaleString()} ₽</strong> {selectedPlan.durationMonths === 12 ? 'в год' : 'в месяц'}.</span>
                )}
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={() => setShowChangePlanModal(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleConfirmPlanChange}
                  className={`flex-1 ${getPlanButtonStyle(selectedPlan.planType)}`}
                  loading={actionLoading === 'change-plan'}
                >
                  Изменить план
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/credits">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full bg-card border border-border">
              <CardContent className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Управление кредитами</h3>
                <p className="text-muted-foreground mb-4">Пополните баланс и отследите использование</p>
                <Button variant="secondary" className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl border-0">
                  Перейти к кредитам
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full bg-card border border-border">
              <CardContent className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Аналитика использования</h3>
                <p className="text-muted-foreground mb-4">Отчеты по использованию тарифа</p>
                <Button variant="secondary" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl border-0">
                  Открыть аналитику
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-card-hover transition-shadow cursor-pointer bg-card border border-border">
            <CardContent className="text-center py-8">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Поддержка</h3>
              <p className="text-muted-foreground mb-4">Помощь по вопросам тарифа</p>
              <Button variant="secondary" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl border-0">
                Связаться с поддержкой
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
