import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  FileText, 
  BarChart3, 
  Upload, 
  Search, 
  AlertCircle,
  RefreshCw,
  Plus,
  Database,
  TrendingUp,
  FileBarChart
} from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = ''
}) => {
  return (
    <Card className={`p-12 text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm ${className}`}>
      {icon && (
        <div className="mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={action.onClick}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
            >
              {action.label}
            </Button>
          )
        )}
        
        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href}>
              <Button variant="secondary">
                {secondaryAction.label}
              </Button>
            </Link>
          ) : (
            <Button 
              variant="secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )
        )}
      </div>
    </Card>
  );
};

// Пустое состояние для документов
export const EmptyDocumentsState: React.FC<{ 
  isFiltered?: boolean;
  onClearFilters?: () => void;
}> = ({ isFiltered = false, onClearFilters }) => {
  if (isFiltered) {
    return (
      <EmptyState
        icon={<Search className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto" />}
        title="Документы не найдены"
        description="По вашему запросу не найдено ни одного документа. Попробуйте изменить условия поиска или очистить фильтры."
        action={{
          label: "Очистить фильтры",
          onClick: onClearFilters
        }}
        secondaryAction={{
          label: "Загрузить документ",
          href: "/upload"
        }}
      />
    );
  }

  return (
    <EmptyState
      icon={<FileText className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto" />}
      title="Нет загруженных документов"
      description="Загрузите первый документ для начала работы с системой анализа углеродного следа"
      action={{
        label: "Загрузить документ",
        href: "/upload"
      }}
    />
  );
};

// Пустое состояние для отчетов
export const EmptyReportsState: React.FC<{ 
  isFiltered?: boolean;
  onClearFilters?: () => void;
}> = ({ isFiltered = false, onClearFilters }) => {
  if (isFiltered) {
    return (
      <EmptyState
        icon={<Search className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto" />}
        title="Отчеты не найдены"
        description="По вашему запросу не найдено ни одного отчета. Попробуйте изменить условия поиска."
        action={{
          label: "Очистить фильтры",
          onClick: onClearFilters
        }}
        secondaryAction={{
          label: "Создать отчет",
          href: "/upload"
        }}
      />
    );
  }

  return (
    <EmptyState
      icon={<FileBarChart className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto" />}
      title="Нет созданных отчетов"
      description="Отчеты создаются автоматически после обработки загруженных документов. Загрузите документы для генерации первого отчета."
      action={{
        label: "Загрузить документы",
        href: "/upload"
      }}
    />
  );
};

// Пустое состояние для аналитики
export const EmptyAnalyticsState: React.FC = () => {
  return (
    <EmptyState
      icon={<TrendingUp className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto" />}
      title="Недостаточно данных для аналитики"
      description="Загрузите и обработайте документы, чтобы увидеть аналитику по выбросам углерода и другие метрики."
      action={{
        label: "Загрузить документы",
        href: "/upload"
      }}
    />
  );
};

// Ошибка загрузки данных
export const ErrorState: React.FC<{ 
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({ 
  title = "Ошибка загрузки данных",
  description = "Произошла ошибка при загрузке данных. Попробуйте обновить страницу.",
  onRetry
}) => {
  return (
    <EmptyState
      icon={<AlertCircle className="w-16 h-16 text-red-400 mx-auto" />}
      title={title}
      description={description}
      action={onRetry ? {
        label: "Повторить",
        onClick: onRetry
      } : {
        label: "Обновить страницу",
        onClick: () => window.location.reload()
      }}
    />
  );
};

// Состояние загрузки (альтернатива скелетонам)
export const LoadingState: React.FC<{ 
  title?: string;
  description?: string;
}> = ({ 
  title = "Загрузка данных...",
  description = "Пожалуйста, подождите, данные загружаются."
}) => {
  return (
    <Card className="p-12 text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
      <div className="animate-spin w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full mx-auto mb-4"></div>
      
      <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </Card>
  );
};
