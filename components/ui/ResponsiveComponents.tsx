import React from 'react';
import { cn } from '@/lib/utils';
import { containerClasses, responsiveGridClasses } from '@/lib/responsive-utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  variant: 'stats' | 'actions' | 'sidebar' | 'table';
  className?: string;
}

/**
 * Адаптивная сетка для различных типов контента
 */
export function ResponsiveGrid({ children, variant, className }: ResponsiveGridProps) {
  const gridClass = {
    stats: responsiveGridClasses.statsGrid,
    actions: responsiveGridClasses.actionsGrid,
    sidebar: responsiveGridClasses.sidebarLayout,
    table: responsiveGridClasses.tableContainer,
  }[variant];

  return (
    <div className={cn(gridClass, className)}>
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  variant?: 'page' | 'main' | 'section' | 'card';
  className?: string;
}

/**
 * Адаптивный контейнер
 */
export function ResponsiveContainer({ 
  children, 
  variant = 'main', 
  className 
}: ResponsiveContainerProps) {
  const containerClass = {
    page: containerClasses.page,
    main: containerClasses.main,
    section: containerClasses.section,
    card: containerClasses.card,
  }[variant];

  return (
    <div className={cn(containerClass, className)}>
      {children}
    </div>
  );
}

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Адаптивная таблица с горизонтальной прокруткой на мобильных
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 sm:rounded-lg shadow">
      <div className="min-w-full inline-block align-middle">
        <table className={cn("min-w-full divide-y divide-gray-200 dark:divide-gray-700", className)}>
          {children}
        </table>
      </div>
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Карточка для мобильного отображения данных вместо таблицы
 */
export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn(
      "block sm:hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3",
      className
    )}>
      {children}
    </div>
  );
}

interface ResponsiveSearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Адаптивное поле поиска
 */
export function ResponsiveSearch({ 
  placeholder = "Поиск...", 
  value, 
  onChange, 
  className 
}: ResponsiveSearchProps) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg 
          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" 
          />
        </svg>
      </div>
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  className?: string;
  truncate?: boolean;
  maxLength?: number;
}

/**
 * Адаптивный текст с опциональной обрезкой
 */
export function ResponsiveText({ 
  children, 
  variant, 
  className, 
  truncate = false, 
  maxLength = 50 
}: ResponsiveTextProps) {
  const textSizeClass = {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-bold',
    h3: 'text-lg sm:text-xl font-semibold',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm',
  }[variant];

  let content = children;
  if (truncate && typeof children === 'string' && children.length > maxLength) {
    content = children.slice(0, maxLength) + '...';
  }

  if (variant === 'h1') {
    return <h1 className={cn(textSizeClass, className)}>{content}</h1>;
  }
  if (variant === 'h2') {
    return <h2 className={cn(textSizeClass, className)}>{content}</h2>;
  }
  if (variant === 'h3') {
    return <h3 className={cn(textSizeClass, className)}>{content}</h3>;
  }
  
  return <span className={cn(textSizeClass, className)}>{content}</span>;
}

interface ResponsiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

/**
 * Адаптивная кнопка
 */
export function ResponsiveButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled, 
  className,
  icon,
  iconOnly = false
}: ResponsiveButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
    secondary: "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500",
    ghost: "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500",
  };

  const sizeClasses = {
    sm: iconOnly ? "p-1.5 sm:p-2" : "px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm",
    md: iconOnly ? "p-2 sm:p-2.5" : "px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base",
    lg: iconOnly ? "p-2.5 sm:p-3" : "px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg",
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={cn("w-4 h-4 sm:w-5 sm:h-5", !iconOnly && "mr-2")}>{icon}</span>}
      {!iconOnly && children}
    </button>
  );
}
