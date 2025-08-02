import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  details?: string;
  fileName?: string;
  fileSize?: string;
  errorDetails?: {
    type: 'file-size' | 'file-type' | 'network' | 'server' | 'validation';
    allowedTypes?: string[];
    maxSize?: string;
    actualSize?: string;
    actualType?: string;
  };
  onRetry?: () => void;
}

const statusConfig = {
  uploading: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    progressColor: 'bg-blue-500'
  },
  processing: {
    icon: Info,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    progressColor: 'bg-yellow-500'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    progressColor: 'bg-green-500'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    progressColor: 'bg-red-500'
  }
};

export function ProgressModal({
  isOpen,
  onClose,
  title,
  progress,
  status,
  message,
  details,
  fileName,
  fileSize,
  errorDetails,
  onRetry
}: ProgressModalProps) {
  if (!isOpen) return null;

  const config = statusConfig[status];
  const IconComponent = config.icon;

  const getErrorMessage = () => {
    if (!errorDetails) return details;

    switch (errorDetails.type) {
      case 'file-size':
        return `Файл слишком большой: ${errorDetails.actualSize}. Максимальный размер: ${errorDetails.maxSize}`;
      case 'file-type':
        return `Неподдерживаемый тип файла: ${errorDetails.actualType}. Поддерживаемые форматы: ${errorDetails.allowedTypes?.join(', ')}`;
      case 'network':
        return 'Ошибка сети. Проверьте подключение к интернету и повторите попытку.';
      case 'server':
        return 'Ошибка сервера. Попробуйте повторить загрузку через несколько минут.';
      case 'validation':
        return 'Файл не прошел валидацию. Убедитесь, что файл не поврежден.';
      default:
        return details || 'Произошла неизвестная ошибка';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={status === 'completed' || status === 'error' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            config.bgColor,
            config.borderColor
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                config.bgColor
              )}>
                <IconComponent className={cn("w-5 h-5", config.color)} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {title || (status === 'uploading' ? 'Загрузка файла' : 
                          status === 'processing' ? 'Обработка' : 
                          status === 'completed' ? 'Готово' : 'Ошибка')}
              </h3>
            </div>
            
            {(status === 'completed' || status === 'error') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* File Info */}
            {fileName && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-slate-900 truncate" title={fileName}>
                  {fileName}
                </div>
                {fileSize && (
                  <div className="text-sm text-slate-600">{fileSize}</div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {message || 'Обработка...'}
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300 ease-out rounded-full",
                    config.progressColor
                  )}
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Status Message */}
            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-red-900 mb-1">
                      Ошибка загрузки
                    </div>
                    <div className="text-sm text-red-700">
                      {getErrorMessage()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === 'completed' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="text-sm text-green-700">
                    {message || 'Файл успешно загружен и обработан'}
                  </div>
                </div>
              </div>
            )}

            {(status === 'uploading' || status === 'processing') && details && (
              <div className="text-sm text-slate-600 text-center">
                {details}
              </div>
            )}
          </div>

          {/* Footer */}
          {(status === 'completed' || status === 'error') && (
            <div className="px-6 pb-6">
              {status === 'error' && onRetry ? (
                <div className="flex gap-3">
                  <Button
                    onClick={onRetry}
                    className="flex-1"
                    variant="primary"
                  >
                    Повторить
                  </Button>
                  <Button
                    onClick={onClose}
                    className="flex-1"
                    variant="secondary"
                  >
                    Отмена
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={onClose}
                  className="w-full"
                  variant={status === 'error' ? 'secondary' : 'primary'}
                >
                  {status === 'error' ? 'Закрыть' : 'Готово'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
