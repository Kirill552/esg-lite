'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  FileText,
  Calculator,
  Download,
  Eye,
  ArrowLeft,
  Calendar,
  Building,
  Zap,
  BarChart3,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';

interface Report {
  id: string;
  reportType: 'REPORT_296FZ' | 'CBAM_XML' | 'CARBON_FOOTPRINT';
  fileName: string;
  createdAt: string;
  fileSize: number;
  format: string;
  downloadCount: number;
  emissionData: any;
  filePath?: string;
  companyName?: string;
  period: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const { userId } = useAuth();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/${reportId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки отчета');
      }

      setReport(data.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!report?.filePath) {
      toast.error('Файл отчета недоступен');
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (!response.ok) {
        throw new Error('Ошибка скачивания файла');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Файл загружен');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка скачивания');
    }
  };

  const handleSign = async () => {
    if (!report) return;
    try {
      setSigning(true);
      const res = await fetch(`/api/reports/${reportId}/sign`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка подписания');
      toast.success('Отчет подписан и заморожен');
      await fetchReport();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка подписания');
    } finally {
      setSigning(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'REPORT_296FZ':
        return '296-ФЗ Отчет';
      case 'CBAM_XML':
        return 'CBAM XML';
      case 'CARBON_FOOTPRINT':
        return 'Углеродный след';
      default:
        return type;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 border-red-200 dark:border-red-800">
          <div className="text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
              Отчет не найден
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || 'Запрашиваемый отчет не существует или недоступен'}
            </p>
            <Link href="/reports">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к отчетам
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Отчеты', href: '/reports' },
    { label: report.fileName, href: `/reports/${reportId}` }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Навигация */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Breadcrumb items={breadcrumbItems} />
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {report.fileName}
                </h1>
                <p className="text-muted-foreground">
                  {getReportTypeLabel(report.reportType)}
                </p>
              </div>
            </div>
          </div>

          <Link href="/reports">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Детали отчета */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Информация об отчете
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Компания</p>
                    <p className="text-base text-foreground">{report.companyName || 'Не указано'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Отчетный период</p>
                    <p className="text-base text-foreground">{report.period}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Тип отчета</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      {getReportTypeLabel(report.reportType)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Дата создания</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base text-foreground">{formatDate(report.createdAt)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Размер файла</p>
                    <p className="text-base text-foreground">{formatFileSize(report.fileSize)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Формат</p>
                    <p className="text-base text-foreground">{report.format}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Данные выбросов */}
            {report.emissionData && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                  Данные выбросов
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        Общие выбросы
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
                      {report.emissionData.totalEmissions?.toLocaleString('ru-RU') || 'Н/Д'} tCO₂eq
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        Источников
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                      {report.emissionData.sourceCount || 0}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        Качество данных
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                      {report.emissionData.dataQuality || 'Не оценено'}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Боковая панель с действиями */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Действия</h3>
              
              <div className="space-y-3">
                <Button onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать отчет
                </Button>

                <Link href={`/reports/${reportId}/audit-trail`} className="block">
                  <Button variant="secondary" className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Расчетная ведомость
                  </Button>
                </Link>

                <Button variant="secondary" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Предпросмотр
                </Button>

                <Button onClick={handleSign} disabled={signing} className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Подписать и заморозить
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Статистика</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Количество скачиваний:</span>
                  <span className="font-semibold">{report.downloadCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Размер:</span>
                  <span className="font-semibold">{formatFileSize(report.fileSize)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Формат:</span>
                  <span className="font-semibold">{report.format}</span>
                </div>
              </div>
            </Card>

            {/* Информация о расчетной ведомости */}
            <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
              <h3 className="text-lg font-semibold mb-2 text-emerald-900 dark:text-emerald-100">
                Расчетная ведомость
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                Получите детальную информацию о формулах, входных данных и промежуточных результатах расчета выбросов.
              </p>
              <Link href={`/reports/${reportId}/audit-trail`}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Calculator className="h-4 w-4 mr-2" />
                  Открыть ведомость
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
