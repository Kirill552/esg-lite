'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Coins, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface CreditBalance {
  balance_t_co2: number;
  updated_at: string;
}

export function CreditsWidget() {
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
        // API возвращает данные в data.data.balance
        const balanceData = {
          balance_t_co2: parseFloat(data.data.balance) || 0,
          updated_at: data.data.lastUpdated || new Date().toISOString()
        };
        setBalance(balanceData);
        setError(null);
      } else {
        setError(data.message || 'Ошибка получения баланса');
      }
    } catch (err) {
      console.error('Ошибка загрузки кредитов:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-600">Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <span className="text-sm text-slate-600">Ошибка загрузки</span>
      </div>
    );
  }

  const balanceValue = balance?.balance_t_co2 || 0;
  const isLowBalance = balanceValue < 100; // Критически низкий баланс

  return (
    <div className="flex items-center gap-4">
      {/* Компактный индикатор баланса */}
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${isLowBalance ? 'bg-orange-100' : 'bg-emerald-100'}`}>
          <Coins className={`w-4 h-4 ${isLowBalance ? 'text-orange-600' : 'text-emerald-600'}`} />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold text-slate-900">
              {balanceValue.toLocaleString()} т
            </span>
            {isLowBalance && (
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            )}
          </div>
          <p className="text-xs text-slate-500">
            CO₂ кредиты • 5 ₽/т
          </p>
        </div>
      </div>

      {/* Кнопка подробнее */}
      <Link href="/credits">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs px-3 py-1 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          Подробнее
        </Button>
      </Link>
    </div>
  );
}
