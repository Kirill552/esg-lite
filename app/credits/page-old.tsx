'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Coins,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Zap,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: 'CREDIT' | 'DEBIT' | 'PURCHASE' | 'SUBSCRIPTION_BONUS';
  description: string;
  created_at: string;
}

interface CreditBalance {
  balance_t_co2: number;
  updated_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CreditsPage() {
  const { user } = useUser();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Получение organizationId из Clerk
  const organizationId = user?.organizationMemberships?.[0]?.organization?.id;

  // Загрузка баланса кредитов
  const fetchBalance = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const response = await fetch(`/api/credits/balance?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.balance);
      } else {
        console.error('Ошибка получения баланса:', data.message);
      }
    } catch (error) {
      console.error('Ошибка запроса баланса:', error);
    }
  }, [organizationId]);

  // Загрузка истории транзакций
  const fetchTransactions = useCallback(async (page: number = 1) => {
    if (!organizationId) return;
    
    setTransactionsLoading(true);
    try {
      const filterParam = filter !== 'all' ? `&type=${filter}` : '';
      const response = await fetch(
        `/api/credits/history?organizationId=${organizationId}&page=${page}&limit=10${filterParam}`
      );
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } else {
        console.error('Ошибка получения транзакций:', data.message);
      }
    } catch (error) {
      console.error('Ошибка запроса транзакций:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, [organizationId, filter]);

  // Загрузка данных при монтировании и изменении organizationId
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!organizationId || !mounted) return;
      
      setLoading(true);
      try {
        await Promise.all([
          fetchBalance(),
          fetchTransactions()
        ]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Перезагрузка транзакций при изменении фильтра
  useEffect(() => {
    let mounted = true;
    
    const reloadTransactions = async () => {
      if (!organizationId || loading || !mounted) return;
      await fetchTransactions(1);
    };
    
    reloadTransactions();
    
    return () => {
      mounted = false;
    };
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Обновление всех данных
  const handleRefresh = useCallback(async () => {
    await fetchBalance();
    await fetchTransactions(pagination.page);
  }, [fetchBalance, fetchTransactions, pagination.page]);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Форматирование типа транзакции
  const getTransactionTypeLabel = (type: string) => {
    const types = {
      CREDIT: 'Пополнение',
      DEBIT: 'Списание',
      PURCHASE: 'Покупка',
      SUBSCRIPTION_BONUS: 'Бонус подписки'
    };
    return types[type as keyof typeof types] || type;
  };

  // Получение иконки для типа транзакции
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'PURCHASE':
      case 'SUBSCRIPTION_BONUS':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'DEBIT':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Coins className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="h-40 bg-gray-200 rounded-xl"></div>
              <div className="h-40 bg-gray-200 rounded-xl"></div>
              <div className="h-40 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="credits-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Управление кредитами
              </h1>
              <p className="text-gray-600">
                Отслеживайте баланс кредитов и историю транзакций
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="md"
                onClick={handleRefresh}
                className="flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
              <Button 
                variant="primary" 
                size="md"
                onClick={() => setShowTopUpModal(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Пополнить баланс
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Balance */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Текущий баланс
                </CardTitle>
                <Coins className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {balance ? `${balance.balance_t_co2.toLocaleString('ru-RU')} т` : '0 т'}
              </div>
              <p className="text-sm text-gray-600">
                CO₂ эквивалент
              </p>
              {balance && (
                <p className="text-xs text-gray-500 mt-2">
                  Обновлено: {formatDate(balance.updated_at)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Credit Value */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Стоимость кредитов
                </CardTitle>
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                5 ₽
              </div>
              <p className="text-sm text-gray-600">
                за тонну CO₂
              </p>
              <div className="flex items-center mt-2">
                <Zap className="h-3 w-3 text-amber-500 mr-1" />
                <p className="text-xs text-amber-600">
                  Резкое повышение цены активно
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Stats */}
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  За этот месяц
                </CardTitle>
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {transactions.filter(t => 
                  new Date(t.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
              <p className="text-sm text-gray-600">
                транзакций
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card variant="default" className="overflow-hidden">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                История транзакций
              </CardTitle>
              <div className="flex items-center space-x-3">
                {/* Filter Buttons */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setFilter('credit')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                      filter === 'credit' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Пополнения
                  </button>
                  <button
                    onClick={() => setFilter('debit')}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                      filter === 'debit' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Списания
                  </button>
                </div>
                
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {transactionsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Загрузка транзакций...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Нет транзакций</p>
                <p className="text-sm text-gray-500">
                  Транзакции появятся после пополнения баланса или использования кредитов
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Тип
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTransactionIcon(transaction.transaction_type)}
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-semibold ${
                            transaction.transaction_type === 'DEBIT' 
                              ? 'text-red-600' 
                              : 'text-emerald-600'
                          }`}>
                            {transaction.transaction_type === 'DEBIT' ? '-' : '+'}
                            {Math.abs(transaction.amount).toLocaleString('ru-RU')} т
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Показано {transactions.length} из {pagination.total} транзакций
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => fetchTransactions(pagination.page - 1)}
                    >
                      Назад
                    </Button>
                    <span className="text-sm text-gray-600">
                      Страница {pagination.page} из {pagination.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => fetchTransactions(pagination.page + 1)}
                    >
                      Далее
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="outlined" className="p-4 hover:shadow-card transition-shadow cursor-pointer">
            <div className="flex items-center">
              <Plus className="h-8 w-8 text-emerald-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Пополнить баланс</h3>
                <p className="text-sm text-gray-600">Купить кредиты для обработки отчетов</p>
              </div>
            </div>
          </Card>
          
          <Link href="/subscription">
            <Card variant="outlined" className="p-4 hover:shadow-card transition-shadow cursor-pointer">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Тариф</h3>
                  <p className="text-sm text-gray-600">Управление тарифным планом</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link href="/dashboard">
            <Card variant="outlined" className="p-4 hover:shadow-card transition-shadow cursor-pointer">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Аналитика</h3>
                  <p className="text-sm text-gray-600">Статистика использования кредитов</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Top-up Modal - будет реализован в следующих итерациях */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Пополнение баланса</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Функция пополнения баланса будет реализована в следующих версиях
              </p>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowTopUpModal(false)}
                >
                  Закрыть
                </Button>
                <Button 
                  variant="primary"
                  disabled
                >
                  Пополнить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
