'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Coins,
  Plus,
  TrendingUp,
  AlertCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface CreditBalance {
  balance_t_co2: number;
  updated_at: string;
}

interface CreditsDisplayProps {
  className?: string;
}

export function CreditsDisplay({ className = '' }: CreditsDisplayProps) {
  const { user } = useUser();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Получение organizationId из Clerk
  const organizationId = user?.organizationMemberships?.[0]?.organization?.id;

  // Загрузка баланса кредитов
  const fetchBalance = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/credits/balance?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.balance);
        setError(null);
      } else {
        setError(data.message || 'Ошибка получения баланса');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
      console.error('Ошибка запроса баланса:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchBalance();
  }, [organizationId]);

  // Определение цвета баланса на основе количества кредитов
  const getBalanceColor = (balance: number) => {
    if (balance <= 10) return 'text-red-600';
    if (balance <= 50) return 'text-amber-600';
    return 'text-emerald-600';
  };

  // Определение статуса баланса
  const getBalanceStatus = (balance: number) => {
    if (balance <= 10) return { text: 'Критически низкий', color: 'text-red-600', icon: AlertCircle };
    if (balance <= 50) return { text: 'Низкий', color: 'text-amber-600', icon: AlertCircle };
    return { text: 'Достаточно', color: 'text-emerald-600', icon: TrendingUp };
  };

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent>
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balanceAmount = balance?.balance_t_co2 || 0;
  const status = getBalanceStatus(balanceAmount);
  const StatusIcon = status.icon;

  return (
    <Card className={`relative overflow-hidden hover:shadow-card-hover transition-shadow ${className}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            Баланс кредитов
          </CardTitle>
          <Coins className="h-5 w-5 text-emerald-600" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between mb-3">
          <div className={`text-2xl font-bold ${getBalanceColor(balanceAmount)}`}>
            {balanceAmount.toLocaleString('ru-RU')} т
          </div>
          <div className="flex items-center">
            <StatusIcon className={`h-4 w-4 mr-1 ${status.color}`} />
            <span className={`text-xs ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mb-4">
          CO₂ эквивалент • 5 ₽/т
        </p>

        {/* Surge pricing indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Zap className="h-3 w-3 text-amber-500 mr-1" />
            <span className="text-xs text-amber-600">Surge pricing</span>
          </div>
          <span className="text-xs text-gray-500">×2</span>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Link href="/credits" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Подробнее
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="flex-1 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Пополнить
          </Button>
        </div>

        {/* Low balance warning */}
        {balanceAmount <= 50 && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
              <p className="text-xs text-amber-700">
                {balanceAmount <= 10 
                  ? 'Баланс критически низкий. Пополните для продолжения работы.'
                  : 'Рекомендуем пополнить баланс кредитов.'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
