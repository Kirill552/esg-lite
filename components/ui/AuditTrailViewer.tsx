'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Calculator,
  FileCheck,
  Download,
  Eye,
  Shield,
  Hash,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import type { CalculationWorksheet } from '@/lib/versioning';

interface AuditTrailViewerProps {
  worksheet: CalculationWorksheet;
  className?: string;
  showFullDetails?: boolean;
  onExport?: () => void;
  onVerify?: () => void;
}

export function AuditTrailViewer({ 
  worksheet, 
  className = '', 
  showFullDetails = true,
  onExport,
  onVerify 
}: AuditTrailViewerProps) {
  const [activeTab, setActiveTab] = useState<'formula' | 'inputs' | 'factors' | 'results' | 'verification'>('formula');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Здесь должен быть toast, но пока просто console.log
      console.log('Скопировано в буфер обмена');
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const formatValue = (value: any, unit?: string): string => {
    if (typeof value === 'number') {
      return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}${unit ? ` ${unit}` : ''}`;
    }
    return String(value);
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок расчетной ведомости */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Calculator className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Расчетная ведомость
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ID расчета: {worksheet.calculation_id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {worksheet.verified ? (
                <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Верифицирован
                </div>
              ) : (
                <div className="flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Требует верификации
                </div>
              )}
            </div>
          </div>

          {/* Метаинформация */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Дата расчета:</span>
              <span className="text-muted-foreground">
                {formatTimestamp(worksheet.calculated_at)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Оператор:</span>
              <span className="text-muted-foreground">
                {worksheet.calculated_by}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Версия методики:</span>
              <span className="text-muted-foreground">
                {worksheet.method_version}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Точность:</span>
              <span className="text-muted-foreground">
                {worksheet.verification_delta ? 
                  `±${(worksheet.verification_delta * 100).toFixed(3)}%` : 
                  'Не проверена'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Навигационные табы */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Разделы расчетной ведомости">
          {[
            { id: 'formula', label: 'Формула', icon: Calculator },
            { id: 'inputs', label: 'Входные данные', icon: FileCheck },
            { id: 'factors', label: 'Факторы', icon: Hash },
            { id: 'results', label: 'Результаты', icon: Eye },
            { id: 'verification', label: 'Верификация', icon: Shield }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Содержимое табов */}
      <div className="space-y-6">
        {/* Формула */}
        {activeTab === 'formula' && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                Расчетная формула
              </h3>
              
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono text-foreground">
                    {worksheet.formula}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(worksheet.formula)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>где:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>E</strong> — выбросы загрязняющих веществ (tCO₂eq)</li>
                  <li><strong>A</strong> — уровень активности (единицы продукции/процесса)</li>
                  <li><strong>EF</strong> — фактор выбросов (tCO₂eq/единица)</li>
                  <li><strong>C</strong> — эффективность системы очистки (%)</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Входные данные */}
        {activeTab === 'inputs' && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FileCheck className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Входные данные
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(worksheet.input_values).map(([key, value]) => (
                  <div key={key} className="bg-muted/30 p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(String(value))}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xl font-semibold mt-2">
                      {formatValue(value, worksheet.units_conversion[key])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Факторы выбросов */}
        {activeTab === 'factors' && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Hash className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Факторы выбросов
              </h3>

              <div className="space-y-3">
                {Object.entries(worksheet.factor_values).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                    <div>
                      <p className="font-medium">{key}</p>
                      <p className="text-sm text-muted-foreground">
                        Версия: {worksheet.factor_versions.find(v => v.includes(key)) || 'Не указана'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatValue(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Результаты */}
        {activeTab === 'results' && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Eye className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                Результаты расчета
              </h3>

              {/* Промежуточные результаты */}
              {Object.keys(worksheet.intermediate_results).length > 0 && (
                <div>
                  <h4 className="font-medium text-muted-foreground mb-3">Промежуточные результаты</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(worksheet.intermediate_results).map(([key, value]) => (
                      <div key={key} className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 mt-1">
                          {formatValue(value, 'tCO₂eq')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Итоговый результат */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                      Итоговые выбросы
                    </p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {formatValue(worksheet.final_result, worksheet.units_conversion.final_result || 'tCO₂eq')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(String(worksheet.final_result))}
                    className="text-green-600 dark:text-green-400"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Верификация */}
        {activeTab === 'verification' && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Shield className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                Верификация расчета
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${
                  worksheet.verified 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {worksheet.verified ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="font-medium">Статус</span>
                  </div>
                  <p className={`mt-2 font-semibold ${
                    worksheet.verified 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {worksheet.verified ? 'Верифицирован' : 'Требует проверки'}
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Погрешность</span>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">
                    {worksheet.verification_delta 
                      ? `±${(worksheet.verification_delta * 100).toFixed(3)}%`
                      : 'Не рассчитана'
                    }
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Метод верификации</span>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">
                    Двойной расчет
                  </p>
                </div>
              </div>

              {!worksheet.verified && onVerify && (
                <div className="pt-4 border-t border-border">
                  <Button onClick={onVerify} className="w-full md:w-auto">
                    <Shield className="h-4 w-4 mr-2" />
                    Выполнить верификацию
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Действия */}
      {showFullDetails && (
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
          <Button 
            onClick={onExport}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт для верификатора
          </Button>
          
          <Button 
            variant="secondary"
            onClick={() => copyToClipboard(JSON.stringify(worksheet, null, 2))}
            className="flex-1 sm:flex-none"
          >
            <Copy className="h-4 w-4 mr-2" />
            Копировать JSON
          </Button>

          <Button 
            variant="secondary"
            onClick={() => window.open(`/reports/${worksheet.report_id}`, '_blank')}
            className="flex-1 sm:flex-none"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Открыть отчет
          </Button>
        </div>
      )}
    </div>
  );
}
