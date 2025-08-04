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
      CREDIT: 'text-emerald-600 dark:text-emerald-400',
      DEBIT: 'text-red-600 dark:text-red-400',
      PURCHASE: 'text-blue-600 dark:text-blue-400',
      SUBSCRIPTION_BONUS: 'text-purple-600 dark:text-purple-400'
    };
    return colors[type as keyof typeof colors] || 'text-muted-foreground';
  };

  const getBalanceStatus = (balance: number) => {
    if (balance < 10) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Критически низкий' };
    if (balance < 50) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Низкий' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Достаточно' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen surface-base py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-accent rounded w-64 mb-4"></div>
            <div className="h-4 bg-accent rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-accent rounded-xl"></div>
              <div className="h-32 bg-accent rounded-xl"></div>
              <div className="h-32 bg-accent rounded-xl"></div>
            </div>
            <div className="h-96 bg-accent rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-base py-8" data-testid="credits-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Управление кредитами
              </h1>
              <p className="text-muted-foreground">
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
                variant="primary"
                className="flex items-center space-x-2"
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
          <Card className="card-accent">
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
                  <div className="text-3xl font-bold text-card-foreground mb-2">
                    {balance.balance_t_co2.toFixed(2)} т CO₂
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getBalanceStatus(balance.balance_t_co2).bg
                  } ${getBalanceStatus(balance.balance_t_co2).color}`}>
                    {getBalanceStatus(balance.balance_t_co2).label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Обновлено: {formatDate(balance.updated_at)}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-8 bg-accent rounded mb-2"></div>
                  <div className="h-4 bg-accent rounded w-24"></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Value */}
          <Card className="card-interactive">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full transform translate-x-16 -translate-y-8"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Стоимость кредитов</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground mb-2">5 ₽/т CO₂</div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                <Zap className="w-3 h-3 mr-1" />
                Повышение x2 (15-30 июня)
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Актуальная цена с учетом сезонности
              </div>
            </CardContent>
          </Card>

          {/* Monthly Stats */}
          <Card className="card-secondary relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-10 rounded-full transform translate-x-16 -translate-y-8"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>За этот месяц</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground mb-2">{transactions.length}</div>
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
              <div className="text-xs text-muted-foreground mt-2">
                Транзакций в текущем месяце
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="surface-elevated rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <span>История транзакций</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                {/* Filter Buttons */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => handleFilterChange('credit')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === 'credit'
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Пополнения
                  </button>
                  <button
                    onClick={() => handleFilterChange('debit')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === 'debit'
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        : 'text-muted-foreground hover:text-foreground'
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
                  <table className="min-w-full divide-y divide-border/50">
                    <thead className="surface-neutral rounded-t-lg">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Тип
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Описание
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody className="surface-base divide-y divide-border/30">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:surface-elevated hover:shadow-md transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatDate(transaction.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              transaction.transaction_type === 'CREDIT' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' :
                              transaction.transaction_type === 'DEBIT' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                              transaction.transaction_type === 'PURCHASE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                              'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
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
                          <td className="px-6 py-4 text-sm text-foreground">
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
                  <div className="flex items-center justify-between mt-6 p-4 surface-glass rounded-lg">
                    <div className="text-sm text-muted-foreground">
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
                      <span className="px-3 py-1 text-sm font-medium text-foreground surface-accent rounded-md">
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
              <div className="text-center py-12 surface-glass rounded-lg">
                <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Нет транзакций</h3>
                <p className="text-muted-foreground mb-6">Пока что нет транзакций для отображения</p>
                <Button
                  onClick={handleTopUpClick}
                  variant="primary"
                  className="px-6"
                >
                  Пополнить баланс
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-accent hover:shadow-xl cursor-pointer">
            <CardContent className="text-center py-8">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Пополнить баланс</h3>
              <p className="text-muted-foreground mb-4">Добавьте кредиты для обработки отчетов</p>
              <Button 
                onClick={handleTopUpClick}
                variant="primary"
                className="w-full"
              >
                Пополнить
              </Button>
            </CardContent>
          </Card>

          <Link href="/subscription">
            <Card className="card-interactive h-full cursor-pointer">
              <CardContent className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Управление тарифами</h3>
                <p className="text-muted-foreground mb-4">Просмотрите и измените тарифный план</p>
                <Button variant="secondary" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl border-0">
                  Тарифы
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="card-secondary h-full cursor-pointer">
              <CardContent className="text-center py-8">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Аналитика</h3>
                <p className="text-muted-foreground mb-4">Отчеты по использованию кредитов</p>
                <Button variant="secondary" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl border-0">
                  Аналитика
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Top-up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="surface-elevated rounded-xl p-6 max-w-md w-full shadow-2xl border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Пополнение баланса</h3>
              <p className="text-muted-foreground mb-6">
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
                  variant="primary"
                  className="flex-1"
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
