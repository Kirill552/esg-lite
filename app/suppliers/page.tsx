'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ArrowLeft,
  Construction
} from 'lucide-react';

export default function SuppliersPage() {
  const router = useRouter();

  useEffect(() => {
    // Автоматически перенаправляем на главную страницу
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Construction className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Модуль в разработке
          </h1>
          
          <p className="text-gray-600 mb-6">
            Функциональность "Поставщики" временно недоступна. 
            Мы работаем над улучшением этого модуля.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </button>
            
            <button
              onClick={() => router.push('/reports')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Перейти к отчётам
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Планируемые возможности:</strong><br />
              • Управление поставщиками Tier-1/2/3<br />
              • Отслеживание углеродного следа<br />
              • Интеграция с отчётами Scope 3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
