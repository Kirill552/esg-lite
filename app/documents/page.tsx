'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MiniSparkline, generateSampleEmissionsData } from '@/components/ui/MiniSparkline';
import { SearchInput, FilterSelect } from '@/components/ui/SearchAndFilter';
import { 
  Upload,
  FileText,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Upload as UploadIcon,
  RefreshCw,
  Edit,
  Share2,
  Copy,
  SortAsc,
  SortDesc
} from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  ocrProcessed: boolean;
  ocrData?: any;
  createdAt: string;
  updatedAt: string;
}

type SortField = 'name' | 'date' | 'size' | 'status';
type SortDirection = 'asc' | 'desc';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Ошибка загрузки документов');
      
      const result = await response.json();
      if (result.success) {
        setDocuments(result.documents || []);
      } else {
        throw new Error(result.error || 'Ошибка загрузки');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Удалить документ?')) return;
    
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const viewDocument = async (document: Document) => {
    try {
      // Переходим к просмотру результата OCR обработки
      if (document.status === 'COMPLETED') {
        window.open(`/reports/${document.id}`, '_blank');
      } else {
        alert('Документ еще не обработан');
      }
    } catch (error) {
      console.error('Ошибка просмотра документа:', error);
      setError('Ошибка открытия документа');
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.fileName;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      } else {
        throw new Error('Ошибка скачивания файла');
      }
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      setError('Ошибка скачивания файла');
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PROCESSING': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'FAILED': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'COMPLETED': return 'Готов';
      case 'PROCESSING': return 'Обработка';
      case 'FAILED': return 'Ошибка';
      default: return 'Загружен';
    }
  };

  // Обработчики поиска и фильтрации
  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setFilterStatus(status);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Сортировка документов
  const sortDocuments = useCallback((docs: Document[]) => {
    return [...docs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.fileName.toLowerCase();
          bValue = b.fileName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'size':
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortField, sortDirection]);

  const filteredDocuments = (documents || []).filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         doc.originalName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesStatus = !filterStatus || filterStatus === 'all' || filterStatus === '' || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedAndFilteredDocuments = sortDocuments(filteredDocuments);

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' МБ';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Загрузка документов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              { label: 'Документы', current: true }
            ]} 
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                📄 Управление документами
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Просматривайте и управляйте загруженными документами
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Загрузить документ
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky Sub-Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-slate-200 dark:border-gray-700 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1">
                <SearchInput
                  placeholder="Поиск по имени файла..."
                  value={searchTerm}
                  onSearch={handleSearch}
                  debounceMs={300}
                  size="md"
                  className="w-full bg-white/70 dark:bg-gray-800/70"
                />
              </div>

              {/* Status Filter */}
              <div className="lg:w-48">
                <FilterSelect
                  value={filterStatus}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  options={[
                    { value: 'UPLOADED', label: 'Загружен' },
                    { value: 'PROCESSING', label: 'Обработка' },
                    { value: 'COMPLETED', label: 'Готов' },
                    { value: 'FAILED', label: 'Ошибка' },
                  ]}
                  placeholder="Все статусы"
                  size="md"
                  className="bg-white/70 dark:bg-gray-800/70"
                />
              </div>

              {/* Sort Controls */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 bg-white/70 dark:bg-gray-800/70"
                >
                  Имя
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 bg-white/70 dark:bg-gray-800/70"
                >
                  Дата
                  {sortField === 'date' && (
                    sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSort('size')}
                  className="flex items-center gap-1 bg-white/70 dark:bg-gray-800/70"
                >
                  Размер
                  {sortField === 'size' && (
                    sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Upload Button */}
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 px-6">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="p-4 mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </Card>
        )}

        {/* Documents Grid */}
        {sortedAndFilteredDocuments.length === 0 ? (
          <Card className="p-12 text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <FileText className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
              {debouncedSearchTerm || (filterStatus && filterStatus !== '') ? 'Документы не найдены' : 'Нет загруженных документов'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {debouncedSearchTerm || (filterStatus && filterStatus !== '') 
                ? 'Попробуйте изменить условия поиска'
                : 'Загрузите первый документ для начала работы'
              }
            </p>
            {!debouncedSearchTerm && (!filterStatus || filterStatus === '') && (
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                  <Upload className="w-5 h-5 mr-2" />
                  Загрузить документ
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedAndFilteredDocuments.map((doc) => (
              <Card key={doc.id} className="group p-6 border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:shadow-lg relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getStatusIcon(doc.status)}
                    <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                  
                  {/* Hover Actions - появляются при наведении */}
                  <div className="flex items-center gap-2">
                    {/* Always visible actions */}
                    <div className="opacity-100">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setOpenDropdown(openDropdown === doc.id ? null : doc.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Hover actions */}
                    {doc.status === 'COMPLETED' && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                          title="Просмотр"
                          onClick={() => viewDocument(doc)}
                        >
                          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                          title="Скачать"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                    
                    {openDropdown === doc.id && (
                      <div className="absolute right-6 top-16 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-2 z-10">
                        <button 
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center"
                          onClick={() => {
                            navigator.clipboard.writeText(doc.fileName);
                            setOpenDropdown(null);
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Копировать название
                        </button>
                        
                        {doc.status === 'COMPLETED' && (
                          <Link href={`/reports/${doc.id}`}>
                            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center">
                              <Eye className="w-4 h-4 mr-2" />
                              Просмотр результата
                            </button>
                          </Link>
                        )}
                        
                        <button 
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center"
                          onClick={() => {
                            // TODO: Implement share functionality
                            setOpenDropdown(null);
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Поделиться
                        </button>
                        
                        <hr className="my-1 border-slate-200 dark:border-gray-600" />
                        
                        <button 
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                          onClick={() => {
                            deleteDocument(doc.id);
                            setOpenDropdown(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </button>
                      </div>
                    )}
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {doc.fileName}
                  </h3>
                  <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <p>Размер: {formatFileSize(doc.fileSize)}</p>
                    <p>Загружен: {formatDate(doc.createdAt)}</p>
                    {doc.ocrProcessed && (
                      <p className="text-green-600 dark:text-green-400">✅ OCR обработан</p>
                    )}
                  </div>
                </div>

                {/* Bottom actions - always visible */}
                <div className="flex gap-2">
                  {doc.status === 'COMPLETED' && (
                    <>
                      <Button variant="secondary" size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        Скачать
                      </Button>
                      <Link href={`/reports/${doc.id}`}>
                        <Button variant="secondary" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* KPI Cards with Mini-Sparklines */}
        <div className="mt-12">
          <Card className="p-6 border-0 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">📊 Статистика документов</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{documents.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">Всего документов</div>
                <MiniSparkline 
                  data={generateSampleEmissionsData(30)} 
                  width={60} 
                  height={20} 
                  color="#10b981"
                  className="mx-auto"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">30-дневный тренд</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {documents.filter(d => d.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">Обработано</div>
                <MiniSparkline 
                  data={generateSampleEmissionsData(30).map(v => v * 0.8)} 
                  width={60} 
                  height={20} 
                  color="#16a34a"
                  className="mx-auto"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Успешная обработка</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {documents.filter(d => d.status === 'PROCESSING').length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">В обработке</div>
                <MiniSparkline 
                  data={generateSampleEmissionsData(30).map(v => v * 0.3)} 
                  width={60} 
                  height={20} 
                  color="#eab308"
                  className="mx-auto"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Очередь обработки</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {documents.filter(d => d.ocrProcessed).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">OCR готов</div>
                <MiniSparkline 
                  data={generateSampleEmissionsData(30).map(v => v * 0.6)} 
                  width={60} 
                  height={20} 
                  color="#2563eb"
                  className="mx-auto"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Качество распознавания</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 