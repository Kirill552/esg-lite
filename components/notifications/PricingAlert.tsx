/**
 * Компонент алертов о ценах
 * Задача 5.3: Создать систему уведомлений о ценах
 * 
 * Отображает уведомления о ценах в виде алертов в современном стиле
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { PricingNotification } from '@/lib/pricing-notifications';

interface PricingAlertProps {
  className?: string;
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // в миллисекундах
}

interface AlertItemProps {
  notification: PricingNotification;
  onDismiss: (id: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ notification, onDismiss }) => {
  const getIcon = () => {
    switch (notification.severity) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (notification.severity) {
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-300 text-amber-800',
          icon: 'text-amber-600',
          button: 'text-amber-700 hover:text-amber-900 hover:bg-amber-100'
        };
      case 'success':
        return {
          container: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          icon: 'text-emerald-600',
          button: 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-300 text-red-800',
          icon: 'text-red-600',
          button: 'text-red-700 hover:text-red-900 hover:bg-red-100'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-300 text-blue-800',
          icon: 'text-blue-600',
          button: 'text-blue-700 hover:text-blue-900 hover:bg-blue-100'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`rounded-lg border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${styles.container}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold">
            {notification.title}
          </h3>
          <p className="mt-1 text-sm opacity-90">
            {notification.message}
          </p>
          
          {/* Кнопка действия */}
          {notification.actionText && notification.actionUrl && (
            <div className="mt-3">
              <Link 
                href={notification.actionUrl}
                className={`inline-flex items-center space-x-1 text-sm font-medium ${styles.button} transition-colors duration-200`}
              >
                <span>{notification.actionText}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
          
          {/* Даты действия */}
          {notification.validUntil && (
            <div className="mt-2 text-xs opacity-75">
              Действует до: {notification.validUntil.toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>
        
        {/* Кнопка закрытия */}
        {notification.dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className={`inline-flex rounded-md p-1.5 ${styles.button} transition-colors duration-200`}
            >
              <span className="sr-only">Закрыть уведомление</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const PricingAlert: React.FC<PricingAlertProps> = ({
  className = '',
  maxAlerts = 5,
  autoRefresh = true,
  refreshInterval = 60000 // 1 минута
}) => {
  const [notifications, setNotifications] = useState<PricingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications();

    if (autoRefresh) {
      const interval = setInterval(fetchNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/pricing');
      
      if (response.ok) {
        const data = await response.json();
        const allNotifications = data.data.pricing.notifications || [];
        
        // Фильтруем скрытые уведомления
        const visibleNotifications = allNotifications
          .filter((notification: PricingNotification) => !dismissedIds.has(notification.id))
          .slice(0, maxAlerts);
        
        setNotifications(visibleNotifications);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений о ценах:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (notificationId: string) => {
    setDismissedIds(prev => new Set(prev).add(notificationId));
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Skeleton loader */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 rounded bg-gray-300"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-300"></div>
                <div className="h-3 w-full rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Уведомления о ценах
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNotifications}
          className="text-gray-500 hover:text-gray-700"
        >
          Обновить
        </Button>
      </div>
      
      <div className="space-y-3">
        {notifications.map((notification) => (
          <AlertItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
};

export default PricingAlert;
