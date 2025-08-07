/**
 * Утилиты для создания корректных моков подписок в тестах
 */

import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import type { SubscriptionInfo } from '../../lib/subscription-service';

export function createMockSubscriptionInfo(overrides: Partial<SubscriptionInfo> = {}): SubscriptionInfo {
  return {
    id: 'test-sub-123',
    organizationId: 'test-org-123',
    planType: 'LITE' as const,
    status: SubscriptionStatus.ACTIVE,
    annualEmissions: 75000,
    hasCbamAddon: false,
    pricing: {
      planType: 'LITE',
      basePrice: 50000,
      surgeMultiplier: 1.0,
      finalPrice: 75000,
      emissions: 75000,
      currency: 'RUB',
      period: 'YEAR',
      hasCbamAddon: false,
      cbamPrice: 0
    },
    startsAt: new Date('2025-01-01'),
    expiresAt: new Date('2026-01-01'),
    autoRenew: true,
    finalPrice: 75000,
    features: ['До 150k т CO₂/год', 'Базовая отчетность'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
  };
}

export function createMockPrismaSubscription(overrides: any = {}) {
  return {
    id: 'test-sub-123',
    organizationId: 'test-org-123',
    plan_type: SubscriptionPlan.LITE,
    status: SubscriptionStatus.ACTIVE,
    starts_at: new Date('2025-01-01'),
    expires_at: new Date('2026-01-01'),
    auto_renew: true,
    price_rub: 75000,
    features: ['До 150k т CO₂/год', 'Базовая отчетность'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides
  };
}
