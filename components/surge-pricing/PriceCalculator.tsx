/**
 * Компонент калькулятора цен с surge pricing
 * Задача 5.2: Интегрировать surge pricing в кредитную систему
 */

'use client';

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface PriceCalculatorProps {
  className?: string;
  defaultOperationType?: 'ocr' | 'report_generation' | 'api_call';
  defaultEmissionVolume?: number;
}

interface PricingInfo {
  baseCost: number;
  multiplier: number;
  finalCost: number;
  priceInRubles: number;
  surgeAddition: number;
  surgeAdditionRubles: number;
  surgePricingInfo: {
    isActive: boolean;
    multiplier: number;
    reason: string;
  };
  operationType: string;
}

const operationTypeLabels = {
  ocr: 'OCR обработка документов',
  report_generation: 'Генерация отчета',
  api_call: 'API вызов'
};

const operationTypeDescriptions = {
  ocr: 'Обработка одного документа через OCR',
  report_generation: 'Генерация отчета ESG/CBAM',
  api_call: 'Вызов API для получения данных'
};

export default function PriceCalculator({ 
  className = '',
  defaultOperationType = 'ocr',
  defaultEmissionVolume = 1
}: PriceCalculatorProps) {
  const [operationType, setOperationType] = useState<'ocr' | 'report_generation' | 'api_call'>(defaultOperationType);
  const [emissionVolume, setEmissionVolume] = useState(defaultEmissionVolume);
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculatePrice();
  }, [operationType, emissionVolume]);

  const calculatePrice = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        operationType,
        emissionVolumeTons: emissionVolume.toString()
      });

      const response = await fetch(`/api/credits/pricing?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка расчета цены');
      }
      
      const data = await response.json();
      setPricingInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmissionVolumeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setEmissionVolume(numValue);
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">
          Калькулятор стоимости операций
        </h3>
      </div>

      {/* Форма ввода */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип операции
          </label>
          <select
            value={operationType}
            onChange={(e) => setOperationType(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(operationTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {operationTypeDescriptions[operationType]}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Объем выбросов (т CO₂)
          </label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={emissionVolume}
            onChange={(e) => handleEmissionVolumeChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите объем выбросов"
          />
          <p className="text-xs text-gray-500 mt-1">
            Для большинства операций используется базовое значение
          </p>
        </div>
      </div>

      {/* Результат расчета */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Расчет стоимости...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {pricingInfo && !isLoading && !error && (
        <div className="space-y-4">
          {/* Surge Pricing уведомление */}
          {pricingInfo.surgePricingInfo.isActive && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">
                  Surge Pricing активен
                </p>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                {pricingInfo.surgePricingInfo.reason}
              </p>
            </div>
          )}

          {/* Детали расчета */}
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Детали расчета
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Базовая стоимость:</span>
                  <span className="font-medium">{pricingInfo.baseCost.toFixed(3)} т CO₂</span>
                </div>
                
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Множитель:</span>
                  <span className={`font-medium ${pricingInfo.multiplier > 1 ? 'text-amber-600' : 'text-green-600'}`}>
                    ×{pricingInfo.multiplier}
                  </span>
                </div>
                
                {pricingInfo.surgeAddition > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Доплата surge:</span>
                    <span className="font-medium text-amber-600">
                      +{pricingInfo.surgeAddition.toFixed(3)} т CO₂
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Итого в кредитах:</span>
                  <span className="font-bold text-lg">{pricingInfo.finalCost.toFixed(3)} т CO₂</span>
                </div>
                
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Стоимость в рублях:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {pricingInfo.priceInRubles.toFixed(2)} ₽
                  </span>
                </div>
                
                {pricingInfo.surgeAdditionRubles > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Доплата в рублях:</span>
                    <span className="font-medium text-amber-600">
                      +{pricingInfo.surgeAdditionRubles.toFixed(2)} ₽
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Полезная информация:</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Первые 1000 т CO₂ в год предоставляются бесплатно</li>
                  <li>• Базовая стоимость: 5 ₽ за 1 т CO₂</li>
                  <li>• Surge pricing действует с 15 по 30 июня</li>
                  {pricingInfo.surgePricingInfo.isActive && (
                    <li>• Сейчас действует повышенный тариф ×{pricingInfo.multiplier}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
