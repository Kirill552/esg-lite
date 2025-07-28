'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileText,
  Users,
  Zap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Activity,
  Plus
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface AnalyticsData {
  monthlyEmissions: Array<{ month: string; emissions: number; cost: number }>;
  reportTypes: Array<{ type: string; count: number; percentage: number }>;
  complianceScore: number;
  totalSavings: number;
  trends: {
    emissionsChange: number;
    costChange: number;
    reportsChange: number;
  };
  topSources: Array<{ source: string; emissions: number; percentage: number }>;
  monthlyCredits: Array<{ month: string; used: number; purchased: number }>;
}

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12months');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [userId, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        toast.error('Ошибка загрузки аналитики');
      }
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      setExportLoading(true);
      const response = await fetch(`/api/analytics/export?format=${format}&range=${timeRange}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${timeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Аналитика экспортирована в ${format.toUpperCase()}`);
      } else {
        toast.error('Ошибка экспорта данных');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка экспорта');
    } finally {
      setExportLoading(false);
    }
  };

  // Заглушка данных для демонстрации
  const mockData: AnalyticsData = {
    monthlyEmissions: [
      { month: 'Янв 2024', emissions: 1200, cost: 6000 },
      { month: 'Фев 2024', emissions: 1150, cost: 5750 },
      { month: 'Мар 2024', emissions: 1300, cost: 6500 },
      { month: 'Апр 2024', emissions: 1100, cost: 5500 },
      { month: 'Май 2024', emissions: 1250, cost: 6250 },
      { month: 'Июн 2024', emissions: 1400, cost: 14000 }, // Surge pricing
      { month: 'Июл 2024', emissions: 1180, cost: 5900 },
      { month: 'Авг 2024', emissions: 1220, cost: 6100 },
      { month: 'Сен 2024', emissions: 1050, cost: 5250 },
      { month: 'Окт 2024', emissions: 1350, cost: 6750 },
      { month: 'Ноя 2024', emissions: 1280, cost: 6400 },
      { month: 'Дек 2024', emissions: 1150, cost: 5750 }
    ],
    reportTypes: [
      { type: '296-ФЗ', count: 24, percentage: 60 },
      { type: 'CBAM', count: 12, percentage: 30 },
      { type: 'Carbon Footprint', count: 4, percentage: 10 }
    ],
    complianceScore: 98,
    totalSavings: 45000,
    trends: {
      emissionsChange: -8.5,
      costChange: -12.3,
      reportsChange: 23.4
    },
    topSources: [
      { source: 'Электроэнергия', emissions: 4500, percentage: 35 },
      { source: 'Природный газ', emissions: 3200, percentage: 25 },
      { source: 'Транспорт', emissions: 2800, percentage: 22 },
      { source: 'Производство', emissions: 1500, percentage: 12 },
      { source: 'Прочее', emissions: 800, percentage: 6 }
    ],
    monthlyCredits: [
      { month: 'Янв', used: 1200, purchased: 0 },
      { month: 'Фев', used: 1150, purchased: 0 },
      { month: 'Мар', used: 1300, purchased: 5000 },
      { month: 'Апр', used: 1100, purchased: 0 },
      { month: 'Май', used: 1250, purchased: 0 },
      { month: 'Июн', used: 1400, purchased: 0 }
    ]
  };

  const currentData = data || mockData;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
               Аналитика ESG
            </h1>
            <p className="text-slate-600">
              Анализ выбросов, затрат и эффективности за период {timeRange === '12months' ? '12 месяцев' : timeRange}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="3months">3 месяца</option>
              <option value="6months">6 месяцев</option>
              <option value="12months">12 месяцев</option>
              <option value="2years">2 года</option>
            </select>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={exportLoading}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exportLoading}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF Report
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Соответствие нормам</p>
                <p className="text-2xl font-bold text-emerald-600">{currentData.complianceScore}%</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-600">+2.1% за месяц</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Экономия средств</p>
                <p className="text-2xl font-bold text-blue-600">{currentData.totalSavings.toLocaleString()} ₽</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-600">Vs ручной отчётности</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Сокращение выбросов</p>
                <p className="text-2xl font-bold text-emerald-600">{Math.abs(currentData.trends.emissionsChange)}%</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowDownRight className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-600">За год</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Всего отчётов</p>
                <p className="text-2xl font-bold text-slate-900">
                  {currentData.reportTypes.reduce((sum, type) => sum + type.count, 0)}
                </p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-600">+{currentData.trends.reportsChange}% за месяц</span>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Emissions Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Динамика выбросов</h3>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {currentData.monthlyEmissions.slice(-6).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{item.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${(item.emissions / 1400) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-16 text-right">
                      {item.emissions} т
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Report Types Distribution */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Типы отчётов</h3>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              {currentData.reportTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-emerald-500' : 
                      index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-sm font-medium text-slate-900">{type.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">{type.count}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {type.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top Emission Sources */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Основные источники выбросов</h3>
            <Target className="w-5 h-5 text-slate-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {currentData.topSources.map((source, index) => (
              <div key={index} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <div className="absolute inset-0 bg-slate-200 rounded-full"></div>
                  <div
                    className={`absolute inset-0 rounded-full ${
                      index === 0 ? 'bg-emerald-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                    }`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + source.percentage * 5}% 0%, 50% 50%)`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-slate-700">
                      {source.percentage}%
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-900">{source.source}</p>
                <p className="text-xs text-slate-600">{source.emissions} т CO₂</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Быстрые действия</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/create-report">
              <Button variant="primary" className="w-full h-auto p-4 flex flex-col items-center">
                <Plus className="w-6 h-6 mb-2" />
                <span className="font-medium">Новый отчёт</span>
                <span className="text-xs opacity-80">Создать отчёт 296-ФЗ или CBAM</span>
              </Button>
            </Link>

            <Link href="/reports">
              <Button variant="secondary" className="w-full h-auto p-4 flex flex-col items-center">
                <FileText className="w-6 h-6 mb-2" />
                <span className="font-medium">Все отчёты</span>
                <span className="text-xs opacity-80">Просмотр и загрузка</span>
              </Button>
            </Link>

            <Link href="/credits">
              <Button variant="secondary" className="w-full h-auto p-4 flex flex-col items-center">
                <Zap className="w-6 h-6 mb-2" />
                <span className="font-medium">Кредиты</span>
                <span className="text-xs opacity-80">Управление балансом</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
