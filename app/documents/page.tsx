'use client'

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  Copy
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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('all');
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

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

  const filteredDocuments = (documents || []).filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                 Управление документами
              </h1>
              <p className="text-xl text-slate-600">
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

        {/* Filters */}
        <Card className="p-6 mb-8 border-0 bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по имени файла..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Все статусы</option>
                <option value="UPLOADED">Загружен</option>
                <option value="PROCESSING">Обработка</option>
                <option value="COMPLETED">Готов</option>
                <option value="FAILED">Ошибка</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="p-4 mb-8 border-red-200 bg-red-50">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center border-0 bg-white/60 backdrop-blur-sm">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Документы не найдены' : 'Нет загруженных документов'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Попробуйте изменить условия поиска'
                : 'Загрузите первый документ для начала работы'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
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
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-6 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/80 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getStatusIcon(doc.status)}
                    <span className="ml-2 text-sm font-medium text-slate-600">
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setOpenDropdown(openDropdown === doc.id ? null : doc.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    
                    {openDropdown === doc.id && (
                      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-10">
                        <button 
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center"
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
                            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <Eye className="w-4 h-4 mr-2" />
                              Просмотр результата
                            </button>
                          </Link>
                        )}
                        
                        <button 
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                          onClick={() => {
                            // TODO: Implement share functionality
                            setOpenDropdown(null);
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Поделиться
                        </button>
                        
                        <hr className="my-1" />
                        
                        <button 
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
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
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                    {doc.fileName}
                  </h3>
                  <div className="space-y-1 text-sm text-slate-500">
                    <p>Размер: {formatFileSize(doc.fileSize)}</p>
                    <p>Загружен: {formatDate(doc.createdAt)}</p>
                    {doc.ocrProcessed && (
                      <p className="text-green-600">✅ OCR обработан</p>
                    )}
                  </div>
                </div>

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

        {/* Stats */}
        <div className="mt-12">
          <Card className="p-6 border-0 bg-gradient-to-r from-emerald-50 to-blue-50">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Статистика</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{documents.length}</div>
                <div className="text-sm text-slate-600">Всего документов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-slate-600">Обработано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.status === 'PROCESSING').length}
                </div>
                <div className="text-sm text-slate-600">В обработке</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {documents.filter(d => d.ocrProcessed).length}
                </div>
                <div className="text-sm text-slate-600">OCR готов</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 