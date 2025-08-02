import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height
}) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  
  const variantClasses = {
    text: 'rounded',
    rect: 'rounded-lg',
    circle: 'rounded-full'
  };

  const defaultSizes = {
    text: { width: '100%', height: '1rem' },
    rect: { width: '100%', height: '8rem' },
    circle: { width: '2.5rem', height: '2.5rem' }
  };

  const style = {
    width: width || defaultSizes[variant].width,
    height: height || defaultSizes[variant].height
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Скелетон карточки документа
export const DocumentCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Skeleton variant="circle" width="1.25rem" height="1.25rem" />
          <Skeleton className="ml-2 w-16 h-4" />
        </div>
        <Skeleton variant="circle" width="1.5rem" height="1.5rem" />
      </div>
      
      <div className="mb-4">
        <Skeleton className="h-5 mb-2" width="80%" />
        <Skeleton className="h-4" width="60%" />
      </div>
      
      <div className="flex items-center justify-between text-sm mb-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      <div className="mb-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-16" />
      </div>
      
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
};

// Скелетон списка документов
export const DocumentsListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <DocumentCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Скелетон карточки отчета
export const ReportCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Skeleton variant="circle" width="2rem" height="2rem" />
          <div className="ml-3">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton variant="circle" width="1.5rem" height="1.5rem" />
      </div>
      
      <div className="mb-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
};

// Скелетон списка отчетов
export const ReportsListSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <ReportCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Скелетон графика аналитики
export const AnalyticsChartSkeleton: React.FC = () => {
  return (
    <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800">
      <div className="mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      <div className="h-64 relative">
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between space-x-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rect"
              width="100%"
              height={`${Math.floor(Math.random() * 150) + 50}px`}
              className="flex-1"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Скелетон карточки статистики
export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circle" width="2.5rem" height="2.5rem" />
        <Skeleton className="h-4 w-12" />
      </div>
      
      <div className="mb-2">
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
};

// Скелетон дашборда аналитики
export const AnalyticsDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>
      
      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChartSkeleton />
        <AnalyticsChartSkeleton />
      </div>
      
      {/* Большой график */}
      <AnalyticsChartSkeleton />
    </div>
  );
};
