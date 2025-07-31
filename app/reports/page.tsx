'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { 
  FileText,
  Plus,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  Calendar,
  User,
  Search,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';

// Типы для отчетов
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
}

export default function ReportsPage() {
  const { userId } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка отчетов
  useEffect(() => {
    if (userId) {
      fetchReports();
    }
  }, [userId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        console.error('Ошибка загрузки отчетов');
        toast.error('Ошибка загрузки отчетов');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация отчетов
  useEffect(() => {
    let filtered = reports;
    
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(report => report.reportType === filterType);
    }
    
    setFilteredReports(filtered);
  }, [reports, searchTerm, filterType]);

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    if (bytes === 0) return '0 Б';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

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

  // Получение названия типа отчета
  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'REPORT_296FZ':
        return '296-ФЗ Отчет';
      case 'CBAM_XML':
        return 'CBAM Отчет';
      case 'CARBON_FOOTPRINT':
        return 'Углеродный след';
      default:
        return 'Неизвестный тип';
    }
  };

  // Получение цвета иконки
  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'REPORT_296FZ':
        return 'text-green-600 bg-green-100';
      case 'CBAM_XML':
        return 'text-purple-600 bg-purple-100';
      case 'CARBON_FOOTPRINT':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Действия с отчетом
  const handleView = async (report: Report) => {
    try {
      // Открываем отчет для просмотра через API
      const response = await fetch(`/api/reports/${report.id}/view`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        toast.error('Ошибка открытия отчета');
      }
    } catch (error) {
      console.error('Ошибка просмотра:', error);
      toast.error('Ошибка открытия файла');
    }
    setOpenMenuId(null);
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await fetch(`/api/reports/${report.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Обновляем счетчик скачиваний
        setReports(prev => prev.map(r => 
          r.id === report.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
        ));
        
        toast.success('Файл скачан успешно');
      } else {
        toast.error('Ошибка скачивания файла');
      }
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      toast.error('Ошибка скачивания файла');
    }
    setOpenMenuId(null);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отчет?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        toast.success('Отчет удален успешно');
      } else {
        toast.error('Ошибка удаления отчета');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast.error('Ошибка удаления отчета');
    }
    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-slate-600">Загрузка отчетов...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="px-8 pt-8 pb-4">
          <Breadcrumb 
            items={[
              { label: 'Отчёты', current: true }
            ]} 
          />
        </div>

        {/* Заголовок и кнопка создания */}
        <div className="flex items-center justify-between mb-8 px-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Мои отчеты
            </h1>
            <p className="text-xl text-slate-600">
              Управление всеми созданными отчетами ESG
            </p>
          </div>
          <Link href="/create-report">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Создать отчет
            </Button>
          </Link>
        </div>

        {/* Sticky Sub-Header с KPI */}
        <div className="sticky top-14 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* KPI чип */}
                <button className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors">
                  <span className="mr-1">⚠️</span>
                  0 т CO₂
                </button>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Всего отчетов: {reports.length}</span>
                  <span>•</span>
                  <span>Скачиваний: {reports.reduce((sum, r) => sum + r.downloadCount, 0)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Показаны: {filteredReports.length} из {reports.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="p-8 pt-4">
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Поиск */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Поиск по названию файла..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Фильтр по типу */}
                <div className="md:w-64">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Все типы отчетов</option>
                    <option value="REPORT_296FZ">296-ФЗ Отчеты</option>
                    <option value="CARBON_FOOTPRINT">Углеродный след</option>
                    <option value="CBAM_XML">CBAM Отчеты</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Всего отчетов</p>
                <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Скачиваний</p>
                <p className="text-2xl font-bold text-slate-900">
                  {reports.reduce((sum, r) => sum + r.downloadCount, 0)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">За этот месяц</p>
                <p className="text-2xl font-bold text-slate-900">
                  {reports.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Размер файлов</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatFileSize(reports.reduce((sum, r) => sum + r.fileSize, 0))}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Список отчетов */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Отчеты ({filteredReports.length})
            </h2>
            
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  Отчеты не найдены
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Попробуйте изменить параметры поиска' 
                    : 'Создайте свой первый отчет'
                  }
                </p>
                <Link href="/create-report">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Создать отчет
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div 
                    key={report.id}
                    className="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getReportTypeColor(report.reportType)}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-slate-900">{report.fileName}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                          <span className="font-medium">{getReportTypeName(report.reportType)}</span>
                          <span>•</span>
                          <span>{formatFileSize(report.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(report.createdAt)}</span>
                          <span>•</span>
                          <span>{report.downloadCount} скачиваний</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Кнопки появляются только при hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(report)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Просмотр
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report)}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Скачать
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                          className="text-slate-600 hover:text-slate-700"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        
                        {openMenuId === report.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => handleDelete(report.id)}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Удалить отчет
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
        </div>
      </div>
      
      {/* Закрытие меню при клике вне его */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
} 