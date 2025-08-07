/**
 * API endpoint для расчёта стоимости подписки
 * Новая модель монетизации 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculatePricing, determinePlanByEmissions, loadMonetizationConfig, isSurgePeriodActive } from '@/lib/monetization-config';

export interface PricingRequest {
  annualEmissions: number;
  hasCbamAddon?: boolean;
  calculationDate?: string;
}

export interface PricingResponse {
  planType: 'TRIAL' | 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE';
  basePrice: number;
  variablePrice: number;
  surgeMultiplier: number;
  finalPrice: number;
  emissions: number;
  currency: string;
  period: 'YEAR' | 'TRIAL';
  hasCbamAddon?: boolean;
  cbamPrice?: number;
  breakdown: {
    basePayment: number;
    perTonRate: number;
    tonnageAboveMin: number;
    variableCost: number;
    cbamAnnualFee?: number;
    cbamPerTonCost?: number;
    surgeApplied: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PricingRequest = await request.json();
    
    // Валидация входных данных
    if (!body.annualEmissions || body.annualEmissions <= 0) {
      return NextResponse.json(
        { error: 'Годовые выбросы должны быть положительным числом' },
        { status: 400 }
      );
    }

    if (body.annualEmissions > 10000000) {
      return NextResponse.json(
        { error: 'Максимальный объём выбросов - 10 млн тонн CO₂' },
        { status: 400 }
      );
    }

    // Определяем дату расчёта
    const calculationDate = body.calculationDate 
      ? new Date(body.calculationDate)
      : new Date();

    // Рассчитываем стоимость
    const pricing = calculatePricing(
      body.annualEmissions,
      body.hasCbamAddon || false,
      calculationDate
    );

    // Получаем детали плана для breakdown
    const planType = determinePlanByEmissions(body.annualEmissions);
    const config = loadMonetizationConfig();
    
    let planConfig;
    switch (planType) {
      case 'LITE':
        planConfig = config.lite;
        break;
      case 'STANDARD':
        planConfig = config.standard;
        break;
      case 'LARGE':
        planConfig = config.large;
        break;
      case 'ENTERPRISE':
        planConfig = { basePayment: config.enterprise.priceCap, ratePerTon: 0, minEmissions: config.enterprise.minEmissions };
        break;
      default:
        planConfig = { basePayment: 0, ratePerTon: 0, minEmissions: 0 };
    }

    // Расчёт breakdown
    const variableCost = body.annualEmissions * planConfig.ratePerTon;
    
    const response: PricingResponse = {
      planType: pricing.planType as any,
      basePrice: pricing.basePrice,
      variablePrice: variableCost,
      surgeMultiplier: pricing.surgeMultiplier,
      finalPrice: pricing.finalPrice,
      emissions: body.annualEmissions,
      currency: pricing.currency,
      period: pricing.period,
      hasCbamAddon: pricing.hasCbamAddon,
      cbamPrice: pricing.cbamPrice,
      breakdown: {
        basePayment: planConfig.basePayment,
        perTonRate: planConfig.ratePerTon,
        tonnageAboveMin: body.annualEmissions,
        variableCost: variableCost,
        cbamAnnualFee: pricing.hasCbamAddon ? config.cbam.annualFee : undefined,
        cbamPerTonCost: pricing.hasCbamAddon ? config.cbam.ratePerTon : undefined,
        surgeApplied: pricing.surgeMultiplier > 1,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: 'Ошибка при расчёте стоимости' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emissions = parseInt(searchParams.get('emissions') || '0');
  const cbam = searchParams.get('cbam') === 'true';
  const date = searchParams.get('date');
  const plan = searchParams.get('plan'); // Добавим параметр плана

  if (emissions < 0) {
    return NextResponse.json(
      { error: 'Параметр emissions должен быть неотрицательным числом' },
      { status: 400 }
    );
  }

  try {
    const calculationDate = date ? new Date(date) : new Date();
    const config = loadMonetizationConfig();
    const isSurge = isSurgePeriodActive(calculationDate);
    
    // Специальная обработка для TRIAL плана
    if (plan === 'TRIAL' || emissions === 0) {
      return NextResponse.json({
        planType: 'TRIAL',
        basePrice: 0,
        variablePrice: 0,
        surgeMultiplier: 1,
        finalPrice: 0,
        emissions: emissions,
        currency: config.currency,
        period: 'TRIAL',
        breakdown: {
          basePayment: 0,
          perTonRate: 0,
          tonnageAboveMin: 0,
          variableCost: 0,
          surgeApplied: false,
        }
      });
    }
    
    // Специальная обработка для CBAM плана
    if (cbam || plan === 'CBAM') {
      const surgeMultiplier = isSurge ? config.surge.multiplier : 1.0;
      const cbamPrice = (config.cbam.annualFee + (emissions * config.cbam.ratePerTon)) * surgeMultiplier;
      
      return NextResponse.json({
        planType: 'CBAM',
        basePrice: cbamPrice,
        variablePrice: emissions * config.cbam.ratePerTon,
        surgeMultiplier,
        finalPrice: cbamPrice,
        emissions: emissions,
        currency: config.currency,
        period: 'YEAR',
        hasCbamAddon: true,
        cbamPrice: cbamPrice,
        breakdown: {
          basePayment: config.cbam.annualFee,
          perTonRate: config.cbam.ratePerTon,
          tonnageAboveMin: emissions,
          variableCost: emissions * config.cbam.ratePerTon,
          cbamAnnualFee: config.cbam.annualFee,
          cbamPerTonCost: config.cbam.ratePerTon,
          surgeApplied: isSurge,
        }
      });
    }
    
    // Определяем план: либо из параметра, либо автоматически по выбросам
    let planType: 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE';
    if (plan && ['LITE', 'STANDARD', 'LARGE', 'ENTERPRISE'].includes(plan)) {
      planType = plan as 'LITE' | 'STANDARD' | 'LARGE' | 'ENTERPRISE';
    } else {
      planType = determinePlanByEmissions(emissions);
    }
    
    // Получаем конфигурацию для выбранного плана
    let planConfig;
    let basePrice = 0;
    let variableCost = 0;
    
    switch (planType) {
      case 'LITE':
        planConfig = config.lite;
        basePrice = planConfig.basePayment;
        variableCost = emissions * planConfig.ratePerTon;
        break;
      case 'STANDARD':
        planConfig = config.standard;
        basePrice = planConfig.basePayment;
        variableCost = emissions * planConfig.ratePerTon;
        break;
      case 'LARGE':
        planConfig = config.large;
        basePrice = planConfig.basePayment;
        variableCost = emissions * planConfig.ratePerTon;
        break;
      case 'ENTERPRISE':
        planConfig = config.enterprise;
        basePrice = planConfig.priceCap;
        variableCost = 0; // Для Enterprise плана фиксированная стоимость
        break;
      default:
        return NextResponse.json(
          { error: `Неизвестный план: ${planType}` },
          { status: 400 }
        );
    }
    
    // Применяем surge multiplier
    const surgeMultiplier = isSurge ? config.surge.multiplier : 1.0;
    const finalPrice = (basePrice + variableCost) * surgeMultiplier;
    
    const response: PricingResponse = {
      planType,
      basePrice: basePrice,
      variablePrice: variableCost,
      surgeMultiplier,
      finalPrice,
      emissions,
      currency: config.currency,
      period: 'YEAR',
      breakdown: {
        basePayment: basePrice,
        perTonRate: planType === 'ENTERPRISE' ? 0 : (planConfig as any).ratePerTon || 0,
        tonnageAboveMin: emissions,
        variableCost,
        surgeApplied: surgeMultiplier > 1,
      }
    };

    console.log(`[GET API] Расчет для плана ${planType}:`, {
      emissions,
      planType,
      basePrice,
      variableCost,
      surgeMultiplier,
      finalPrice
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: 'Ошибка при расчёте стоимости' },
      { status: 500 }
    );
  }
}
