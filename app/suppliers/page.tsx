'use client';

import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  type: 'Tier-1' | 'Tier-2' | 'Tier-3';
  location: string;
  contact: {
    email: string;
    phone: string;
  };
  status: 'active' | 'pending' | 'inactive';
  lastReport: string;
  carbonFootprint: number; // тонн CO₂
}

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Демо данные поставщиков
  const suppliers: Supplier[] = [
    {
      id: '1',
      name: 'ООО "Металлургический завод"',
      type: 'Tier-1',
      location: 'Магнитогорск, Челябинская область',
      contact: {
        email: 'sustainability@metallurg.ru',
        phone: '+7 (351) 123-45-67'
      },
      status: 'active',
      lastReport: '2025-01-15',
      carbonFootprint: 45000
    },
    {
      id: '2',
      name: 'АО "Химпром"',
      type: 'Tier-2',
      location: 'Нижний Новгород',
      contact: {
        email: 'esg@chimprom.ru',
        phone: '+7 (831) 987-65-43'
      },
      status: 'pending',
      lastReport: '2024-12-20',
      carbonFootprint: 12000
    },
    {
      id: '3',
      name: 'ИП Логистика Плюс',
      type: 'Tier-3',
      location: 'Москва',
      contact: {
        email: 'info@logplus.ru',
        phone: '+7 (495) 555-12-34'
      },
      status: 'active',
      lastReport: '2025-01-10',
      carbonFootprint: 800
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'pending':
        return 'Ожидает';
      case 'inactive':
        return 'Неактивный';
      default:
        return status;
    }
  };

  const getTierColor = (type: string) => {
    switch (type) {
      case 'Tier-1':
        return 'bg-blue-100 text-blue-800';
      case 'Tier-2':
        return 'bg-emerald-100 text-emerald-800';
      case 'Tier-3':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || supplier.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
              Поставщики
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Управление поставщиками и их углеродным следом
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Добавить поставщика
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Всего поставщиков
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {suppliers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Активные
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {suppliers.filter(s => s.status === 'active').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Общий след (т CO₂)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 font-mono">
                      {suppliers.reduce((sum, s) => sum + s.carbonFootprint, 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                    placeholder="Поиск по названию или местоположению..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Все уровни</option>
                  <option value="Tier-1">Tier-1</option>
                  <option value="Tier-2">Tier-2</option>
                  <option value="Tier-3">Tier-3</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Список поставщиков */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Список поставщиков ({filteredSuppliers.length})
            </h3>
          </div>
          
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Поставщики не найдены</h3>
              <p className="mt-1 text-sm text-gray-500">
                Попробуйте изменить параметры поиска или добавьте нового поставщика.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <li key={supplier.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {supplier.name}
                            </p>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTierColor(supplier.type)}`}>
                              {supplier.type}
                            </span>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(supplier.status)}
                              <span className="text-xs text-gray-500">
                                {getStatusText(supplier.status)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{supplier.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{supplier.contact.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 font-mono">
                          {supplier.carbonFootprint.toLocaleString()} т CO₂
                        </p>
                        <p className="text-xs text-gray-500">
                          Последний отчёт: {new Date(supplier.lastReport).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Информационный блок */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                О модуле "Поставщики"
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Модуль позволяет управлять поставщиками разных уровней и отслеживать их углеродный след.
                  Тарификация: 3000₽ за каждого активного поставщика.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Tier-1: Крупные заводы (≥50k т CO₂)</li>
                  <li>Tier-2: Средние предприятия (&lt;50k т CO₂)</li>
                  <li>Tier-3: Малый бизнес и логистика</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
