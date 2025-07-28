/**
 * Компонент баннера уведомлений о ценах
 * Задача 5.3: Создать систему уведомлений о ценах
 * 
 * Отображает баннеры о текущих тарифах, surge pricing и скидках
 * в современном стиле сайта
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, AlertTriangle, Gift, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { PricingBannerInfo } from '@/lib/pricing-notifications';

interface PricingBannerProps {
  className?: string;
  showCountdown?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

interface CountdownProps {
  endDate: Date;
  message: string;
}

const Countdown: React.FC<CountdownProps> = ({ endDate, message }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 text-sm font-medium">
      <Clock className="h-4 w-4" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}д `}
        {timeLeft.hours > 0 && `${timeLeft.hours}ч `}
        {timeLeft.minutes > 0 && `${timeLeft.minutes}м `}
        {timeLeft.seconds}с
      </span>
      <span className="text-xs opacity-75">{message}</span>
    </div>
  );
};

export const PricingBanner: React.FC<PricingBannerProps> = ({
  className = '',
  showCountdown = true,
  dismissible = true,
  onDismiss
}) => {
  const [bannerInfo, setBannerInfo] = useState<PricingBannerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchBannerInfo();
  }, []);

  const fetchBannerInfo = async () => {
    try {
      const response = await fetch('/api/notifications/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_banner_info'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBannerInfo(data.data.banner);
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о баннере:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || dismissed || !bannerInfo || !bannerInfo.show) {
    return null;
  }

  // Определяем стили на основе типа и severity
  const getIcon = () => {
    switch (bannerInfo.type) {
      case 'surge_active':
        return <TrendingUp className="h-5 w-5" />;
      case 'surge_ending':
        return <AlertTriangle className="h-5 w-5" />;
      case 'discount':
        return <Gift className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (bannerInfo.severity) {
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: 'text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'success':
        return {
          container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: 'text-emerald-600',
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`relative border-l-4 p-4 shadow-sm ${styles.container} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold">
            {bannerInfo.title}
          </h3>
          <p className="mt-1 text-sm">
            {bannerInfo.message}
          </p>
          
          {/* Счетчик времени */}
          {showCountdown && bannerInfo.countdown && (
            <div className="mt-2">
              <Countdown 
                endDate={bannerInfo.countdown.endDate}
                message={bannerInfo.countdown.message}
              />
            </div>
          )}
          
          {/* Кнопка действия */}
          {bannerInfo.actionText && bannerInfo.actionUrl && (
            <div className="mt-3">
              <Link href={bannerInfo.actionUrl}>
                <Button
                  size="sm"
                  className={`${styles.button} border-0 shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  {bannerInfo.actionText}
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Кнопка закрытия */}
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.icon} hover:bg-black/5 focus:ring-current transition-colors duration-200`}
              >
                <span className="sr-only">Закрыть</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingBanner;
