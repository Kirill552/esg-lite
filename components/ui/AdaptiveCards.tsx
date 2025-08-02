import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color?: 'emerald' | 'blue' | 'purple' | 'green' | 'amber' | 'red';
  loading?: boolean;
  className?: string;
}

/**
 * Адаптивная карточка статистики
 */
export function StatsCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'emerald',
  loading = false,
  className
}: StatsCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-pink-600',
  };

  const changeTypeClasses = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  if (loading) {
    return (
      <div className={cn(
        "p-4 sm:p-6 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-sm animate-pulse",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-xl ml-3 sm:ml-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 sm:p-6 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium truncate">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">
            {value}
          </p>
          {change && (
            <div className={cn(
              "flex items-center text-xs sm:text-sm font-medium",
              changeTypeClasses[changeType]
            )}>
              <svg 
                className={cn(
                  "w-3 h-3 sm:w-4 sm:h-4 mr-1",
                  changeType === 'positive' ? 'rotate-0' : 
                  changeType === 'negative' ? 'rotate-180' : 'rotate-0'
                )} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                />
              </svg>
              <span className="truncate">{change}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ml-3 sm:ml-4 flex-shrink-0",
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
  onClick: () => void;
  className?: string;
}

/**
 * Адаптивная карточка быстрого действия
 */
export function QuickActionCard({
  title,
  description,
  icon: Icon,
  color = 'emerald',
  onClick,
  className
}: QuickActionCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-50 to-green-50/50 dark:from-emerald-900/20 dark:to-green-900/10 border-emerald-100 dark:border-emerald-800',
    blue: 'from-blue-50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/10 border-blue-100 dark:border-blue-800',
    purple: 'from-purple-50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/10 border-purple-100 dark:border-purple-800',
    amber: 'from-amber-50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-100 dark:border-amber-800',
  };

  const iconColorClasses = {
    emerald: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <div 
      className={cn(
        "p-4 sm:p-6 cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br",
        colorClasses[color],
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0",
          iconColorClasses[color]
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
