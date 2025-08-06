import { NextRequest, NextResponse } from 'next/server';
import { loadMonetizationConfig } from '@/lib/monetization-config';

export async function GET() {
  try {
    const config = loadMonetizationConfig();
    
    return NextResponse.json({
      cbam: config.cbam,
      env_values: {
        CBAM_ANNUAL_FEE: process.env.CBAM_ANNUAL_FEE,
        CBAM_RATE_PER_TON: process.env.CBAM_RATE_PER_TON,
      }
    });
  } catch (error) {
    console.error('Error loading config:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки конфигурации' },
      { status: 500 }
    );
  }
}
