/**
 * Компонент баннера Surge Pricing для уведомления пользователей
 * Задача 5.2: Интегрировать surge pricing в кредитную систему
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Calendar, X } from 'lucide-react';

interface SurgePricingBannerProps {
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

interface BannerInfo {
  show: boolean;
  message: string;
  type: 'warning' | 'info';
}

interface SurgePricingInfo {
  isActive: boolean;
  multiplier: number;
  reason: string;
  bannerInfo: BannerInfo | null;
}

export default function SurgePricingBanner({ 
  className = '', 
  showCloseButton = true,
  onClose 
}: SurgePricingBannerProps) {
  const [surgePricingInfo, setSurgePricingInfo] = useState<SurgePricingInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSurgePricingInfo();
  }, []);

  const fetchSurgePricingInfo = async () => {
    try {
      const response = await fetch('/api/surge-pricing/status');
      if (response.ok) {
        const data = await response.json();
        setSurgePricingInfo({
          isActive: data.status?.isActive || false,
          multiplier: data.status?.multiplier || 1,
          reason: data.status?.reason || '',
          bannerInfo: data.bannerInfo
        });
        
        // Показываем баннер только если есть информация для отображения
        setIsVisible(data.bannerInfo?.show || false);
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о surge pricing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Не отображаем баннер если загружается или нет данных для показа
  if (isLoading || !isVisible || !surgePricingInfo?.bannerInfo?.show) {
    return null;
  }

  const { bannerInfo, isActive, multiplier } = surgePricingInfo;
  const isWarning = bannerInfo.type === 'warning';

  return (
    <div className={`relative rounded-lg border p-4 ${className} ${
      isWarning 
        ? 'border-amber-200 bg-amber-50 text-amber-800' 
        : 'border-blue-200 bg-blue-50 text-blue-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isWarning ? (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            ) : (
              <TrendingUp className="h-5 w-5 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-sm">
              {isActive ? 'Surge Pricing активен' : 'Предупреждение о ценах'}
            </div>
            <div className="mt-1 text-sm">
              {bannerInfo.message}
            </div>
            
            {isActive && (
              <div className="mt-2 flex items-center space-x-4 text-xs opacity-75">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Множитель: ×{multiplier}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>15-30 июня</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showCloseButton && (
          <button
            onClick={handleClose}
            className={`flex-shrink-0 p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-900 transition-colors ${
              isWarning ? 'text-amber-600' : 'text-blue-600'
            }`}
            aria-label="Закрыть уведомление"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
