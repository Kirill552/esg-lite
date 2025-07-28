'use client'

import React, { useState, useEffect, useMemo } from 'react';
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

export default function CreditsPageOptimized() {
  // State
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

  // Мемоизированное получение organizationId
  const organizationId = useMemo(() => {
    return user?.organizationMemberships?.[0]?.organization?.id;
  }, [user]);

  // Простые функции без useCallback
  const fetchBalance = async () => {
    const idToUse = organizationId || user?.id;
    if (!idToUse) return;
    
    try {
      const response = await fetch(`/api/credits/balance?organizationId=${idToUse}`);
      const data = await response.json();
      
      console.log('🔍 Credits API response:', data);
      
      if (data.success) {
        // API возвращает данные в data.data
        const balanceData = {
          balance_t_co2: parseFloat(data.data.balance) || 0,
          updated_at: data.data.lastUpdated || new Date().toISOString()
        };
        setBalance(balanceData);
      } else {
        console.error('Ошибка получения баланса:', data.message);
      }
    } catch (error) {
      console.error('Ошибка запроса баланса:', error);
    }
  };

  const fetchTransactions = async (page: number = 1) => {
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
  };

  // Первоначальная загрузка
  useEffect(() => {
    console.log('🔍 Credits Page - organizationId:', organizationId);
    console.log('🔍 Credits Page - user:', user?.id);
    
    if (organizationId) {
      setLoading(true);
      Promise.all([
        fetchBalance(),
        fetchTransactions()
      ]).finally(() => {
        setLoading(false);
      });
    } else if (user?.id) {
      // Если нет organizationId, используем userId
      console.log('🔍 Using userId as fallback');
      setLoading(true);
      Promise.all([
        fetchBalance(),
        fetchTransactions()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [organizationId, user?.id]);

  // Загрузка при изменении фильтра
  useEffect(() => {
    if (organizationId && !loading) {
      fetchTransactions(1);
    }
  }, [filter]);

  // Обработчики событий
  const handleRefresh = async () => {
    await fetchBalance();
    await fetchTransactions(pagination.page);
  };

  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage);
  };

  const handleFilterChange = (newFilter: 'all' | 'credit' | 'debit') => {
    setFilter(newFilter);
  };

  const handleTopUpClick = () => {
    setShowTopUpModal(true);
  };

  // Утилиты форматирования
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const types = {
      CREDIT: 'Пополнение',
      DEBIT: 'Списание',
      PURCHASE: 'Покупка',
      SUBSCRIPTION_BONUS: 'Бонус подписки'
    };
    return types[type as keyof typeof types] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors = {
      CREDIT: 'text-emerald-600',
      DEBIT: 'text-red-600',
      PURCHASE: 'text-blue-600',
      SUBSCRIPTION_BONUS: 'text-purple-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getBalanceStatus = (balance: number) => {
    if (balance < 10) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Критически низкий' };
    if (balance < 50) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Низкий' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Достаточно' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
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
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Обновить</span>
              </Button>
              <Button
                onClick={handleTopUpClick}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                <span>Пополнить</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Balance */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-full transform translate-x-16 -translate-y-8"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <span>Текущий баланс</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balance ? (
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {balance.balance_t_co2.toFixed(2)} т CO₂
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getBalanceStatus(balance.balance_t_co2).bg
                  } ${getBalanceStatus(balance.balance_t_co2).color}`}>
                    {getBalanceStatus(balance.balance_t_co2).label}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Обновлено: {formatDate(balance.updated_at)}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Value */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full transform translate-x-16 -translate-y-8"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Стоимость кредитов</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">5 ₽/т CO₂</div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                <Zap className="w-3 h-3 mr-1" />
                Surge x2 (15-30 июня)
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Актуальная цена с учетом сезонности
              </div>
            </CardContent>
          </Card>

          {/* Monthly Stats */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-10 rounded-full transform translate-x-16 -translate-y-8"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>За этот месяц</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{transactions.length}</div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{transactions.filter(t => t.transaction_type === 'CREDIT').length}</span>
                </div>
                <div className="flex items-center space-x-1 text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  <span>-{transactions.filter(t => t.transaction_type === 'DEBIT').length}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Транзакций в текущем месяце
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <span>История транзакций</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                {/* Filter Buttons */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => handleFilterChange('credit')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === 'credit'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Пополнения
                  </button>
                  <button
                    onClick={() => handleFilterChange('debit')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === 'debit'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Списания
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тип
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Описание
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.transaction_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' :
                              transaction.transaction_type === 'DEBIT' ? 'bg-red-100 text-red-800' :
                              transaction.transaction_type === 'PURCHASE' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            getTransactionTypeColor(transaction.transaction_type)
                          }`}>
                            {transaction.transaction_type === 'CREDIT' ? '+' : '-'}
                            {Math.abs(transaction.amount).toFixed(2)} т CO₂
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Показано {(pagination.page - 1) * 10 + 1} - {Math.min(pagination.page * 10, pagination.total)} из {pagination.total} записей
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        variant="secondary"
                        size="sm"
                      >
                        Назад
                      </Button>
                      <span className="px-3 py-1 text-sm font-medium">
                        {pagination.page} из {pagination.totalPages}
                      </span>
                      <Button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        variant="secondary"
                        size="sm"
                      >
                        Вперед
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет транзакций</h3>
                <p className="text-gray-600 mb-4">Пока что нет транзакций для отображения</p>
                <Button
                  onClick={handleTopUpClick}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Пополнить баланс
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
            <CardContent className="text-center py-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Пополнить баланс</h3>
              <p className="text-gray-600 mb-4">Добавьте кредиты для обработки отчетов</p>
              <Button 
                onClick={handleTopUpClick}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Пополнить
              </Button>
            </CardContent>
          </Card>

          <Link href="/subscription">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
              <CardContent className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Управление тарифами</h3>
                <p className="text-gray-600 mb-4">Просмотрите и измените тарифный план</p>
                <Button variant="secondary" className="w-full">
                  Тарифы
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
              <CardContent className="text-center py-8">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Аналитика</h3>
                <p className="text-gray-600 mb-4">Отчеты по использованию кредитов</p>
                <Button variant="secondary" className="w-full">
                  Аналитика
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Top-up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Пополнение баланса</h3>
              <p className="text-gray-600 mb-6">
                Интеграция с платежной системой будет доступна в следующей версии.
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={() => setShowTopUpModal(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Понятно
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
