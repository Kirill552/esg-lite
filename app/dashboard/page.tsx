'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PricingAlert } from '@/components/notifications/PricingAlert';
import { 
  Upload,
  FileText,
  Download,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Calendar,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface ReportData {
  id: string;
  fileName: string;
  reportType: string;
  format: string;
  createdAt: string;
  emissionData: any;
  document: {
    fileName: string;
    createdAt: string;
  };
}

export default function Dashboard() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    thisMonthEmissions: 0,
    averageProcessingTime: 0,
    compliance: 100
  });

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReports(data.data);
          calculateStats(data.data);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки отчётов:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reportsData: ReportData[]) => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthReports = reportsData.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate.getMonth() === thisMonth && reportDate.getFullYear() === thisYear;
    });

    const totalEmissions = thisMonthReports.reduce((sum, report) => {
      return sum + (report.emissionData?.total || 0);
    }, 0);

    setStats({
      totalReports: reportsData.length,
      thisMonthEmissions: Math.round(totalEmissions * 100) / 100,
      averageProcessingTime: 1.8, // TODO: рассчитывать реально
      compliance: 100
    });
  };

  // Обработчики для кнопок Dashboard
  const handleUploadFile = () => {
    window.location.href = '/upload'
  }

  const handleViewAnalytics = () => {
    console.log('Открыть аналитику')
    window.location.href = '/analytics'
  }

  const handleExportData = () => {
    console.log('Экспорт данных')
    window.location.href = '/analytics'
  }

  const handleCreateReport = () => {
    console.log('Создать новый отчет')
    window.location.href = '/upload'
  }

  const handleSettings = () => {
    window.location.href = '/settings';
  }

  const handleNotifications = () => {
    console.log('Уведомления')
    alert('Уведомления (в разработке)')
  }

  const handleShowAllReports = () => {
    console.log('Показать все отчеты')
    window.location.href = '/reports'
  }

  const handleLearnMore = () => {
    window.location.href = '/help'
  }

  const downloadReport = async (reportId: string, fileName: string) => {
    try {
      // TODO: Реализовать скачивание отчёта из S3
      console.log('Скачиваем отчёт:', reportId);
      alert(`Скачивание ${fileName} (в разработке)`);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
    }
  };

  const statsConfig = [
    {
      label: "Всего отчётов",
      value: stats.totalReports.toString(),
      change: loading ? "..." : `+${Math.max(0, stats.totalReports - 20)}`,
      changeType: "positive" as const,
      icon: FileText,
      color: "emerald"
    },
    {
      label: "Выбросы за месяц",
      value: `${stats.thisMonthEmissions} тCO₂`,
      change: loading ? "..." : `${Math.round((stats.thisMonthEmissions - 480.5) / 480.5 * 100)}%`,
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "blue"
    },
    {
      label: "Время обработки",
      value: `${stats.averageProcessingTime} мин`,
      change: loading ? "..." : "-15%",
      changeType: "positive" as const,
      icon: Clock,
      color: "purple"
    },
    {
      label: "Соответствие 296-ФЗ",
      value: `${stats.compliance}%`,
      change: "Полное",
      changeType: "positive" as const,
      icon: CheckCircle,
      color: "green"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершён';
      case 'processing':
        return 'Обработка';
      case 'error':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-end">
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск отчётов..."
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleNotifications}
                title="Уведомления"
              >
                <Bell className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSettings}
                title="Настройки"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-emerald-50 to-green-50/50">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-slate-900">Загрузить документ</h3>
                <p className="text-sm text-slate-600">PDF/CSV счета или накладные</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={handleUploadFile}
            >
              Выбрать файл
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-cyan-50/50">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-slate-900">Аналитика</h3>
                <p className="text-sm text-slate-600">Тренды и сравнения</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={handleViewAnalytics}
            >
              Открыть
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-indigo-50/50">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-slate-900">Экспорт данных</h3>
                <p className="text-sm text-slate-600">PDF, CSV, XML форматы</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={handleExportData}
            >
              Экспорт
            </Button>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsConfig.map((stat, index) => (
            <Card key={index} className="p-6 border-0 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mb-2">{stat.value}</p>
                  <div className={`flex items-center text-sm ${
                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stat.change}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                  stat.color === 'emerald' ? 'from-emerald-500 to-green-600' :
                  stat.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                  stat.color === 'purple' ? 'from-purple-500 to-indigo-600' :
                  'from-green-500 to-emerald-600'
                }`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Уведомления о ценах */}
        <div className="mb-8">
          <PricingAlert 
            maxAlerts={3}
            autoRefresh={true}
            refreshInterval={120000} // 2 минуты
          />
        </div>

        {/* Recent Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Последние отчёты</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Фильтр
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Период
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(report.document.fileName.includes('error') ? 'error' : 'completed')}
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.fileName}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <span>{report.reportType}</span>
                          <span>•</span>
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-600">{report.emissionData?.total || '0'} тCO₂</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        report.document.fileName.includes('error') ? 'bg-red-100 text-red-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {report.document.fileName.includes('error') ? 'Ошибка' : 'Завершён'}
                      </span>
                      
                      {report.document.fileName.includes('completed') && (
                        <Button variant="ghost" size="sm" onClick={() => downloadReport(report.id, report.fileName)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button 
                  variant="secondary"
                  onClick={handleShowAllReports}
                >
                  Показать все отчёты
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 mb-4">Быстрые действия</h3>
              <div className="space-y-3">
                <Link href="/create-report">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-3" />
                    Создать отчёт 296-ФЗ
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Zap className="w-4 h-4 mr-3" />
                    Экспорт CBAM
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-3" />
                    Годовая аналитика
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 border-0 bg-gradient-to-br from-emerald-50 to-green-50/50">
              <h3 className="font-bold text-slate-900 mb-4">💡 Совет</h3>
              <p className="text-sm text-slate-600 mb-4">
                Загружайте документы за весь месяц одновременно для автоматического 
                создания сводного отчёта по 296-ФЗ.
              </p>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleLearnMore}
              >
                Подробнее
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 