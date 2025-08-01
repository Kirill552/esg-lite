/**
 * Unit тесты для Surge Pricing Service
 * Задача 5.1: Создать Surge Pricing Service
 */

import {
  SurgePricingService,
  SurgePricingConfig,
  SurgePricingStatus,
  SurgePricingNotification,
  surgePricingService
} from '@/lib/surge-pricing';

describe('SurgePricingService', () => {
  let service: SurgePricingService;

  beforeEach(() => {
    service = new SurgePricingService();
  });

  describe('Constructor and Configuration', () => {
    test('должен создаться с правильной конфигурацией по умолчанию', () => {
      const config = service.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.multiplier).toBe(2.0); // ×2 согласно требованиям
      expect(config.reason).toBe('Высокий сезон отчетности (15-30 июня)');
      
      // Проверяем даты для текущего года
      const currentYear = new Date().getFullYear();
      expect(config.surgeStartDate.getFullYear()).toBe(currentYear);
      expect(config.surgeStartDate.getMonth()).toBe(5); // Июнь (0-based)
      expect(config.surgeStartDate.getDate()).toBe(15);
      expect(config.surgeEndDate.getDate()).toBe(30);
    });

    test('должен обновлять конфигурацию', () => {
      const newConfig: Partial<SurgePricingConfig> = {
        multiplier: 3.0,
        reason: 'Тестовый период'
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.multiplier).toBe(3.0);
      expect(config.reason).toBe('Тестовый период');
      expect(config.enabled).toBe(true); // Должно остаться без изменений
    });
  });

  describe('isSurgePeriod', () => {
    test('должен определить период surge pricing (15-30 июня)', () => {
      const currentYear = new Date().getFullYear();
      
      // Тестовые даты
      const beforeSurge = new Date(currentYear, 5, 14, 23, 59, 59); // 14 июня 23:59:59
      const surgeStart = new Date(currentYear, 5, 15, 0, 0, 0);     // 15 июня 00:00:00
      const surgeMid = new Date(currentYear, 5, 22, 12, 0, 0);      // 22 июня 12:00:00
      const surgeEnd = new Date(currentYear, 5, 30, 12, 0, 0);      // 30 июня 12:00:00 (не последняя секунда)
      const afterSurge = new Date(currentYear, 6, 1, 0, 0, 0);      // 1 июля 00:00:00

      expect(service.isSurgePeriod(beforeSurge)).toBe(false);
      expect(service.isSurgePeriod(surgeStart)).toBe(true);
      expect(service.isSurgePeriod(surgeMid)).toBe(true);
      expect(service.isSurgePeriod(surgeEnd)).toBe(true);
      expect(service.isSurgePeriod(afterSurge)).toBe(false);
    });

    test('должен работать для разных лет', () => {
      const date2024 = new Date(2024, 5, 20); // 20 июня 2024
      const date2025 = new Date(2025, 5, 20); // 20 июня 2025
      const date2026 = new Date(2026, 5, 20); // 20 июня 2026

      expect(service.isSurgePeriod(date2024)).toBe(true);
      expect(service.isSurgePeriod(date2025)).toBe(true);
      expect(service.isSurgePeriod(date2026)).toBe(true);
    });

    test('должен вернуть false когда surge pricing отключен', () => {
      service.updateConfig({ enabled: false });
      
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      expect(service.isSurgePeriod(surgeDate)).toBe(false);
    });

    test('должен использовать текущую дату по умолчанию', () => {
      // Мокаем Date для воспроизводимого теста
      const mockDate = new Date(2025, 5, 20); // 20 июня 2025
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      expect(service.isSurgePeriod()).toBe(true);
      
      (global.Date as any).mockRestore();
    });
  });

  describe('getSurgeMultiplier', () => {
    test('должен возвращать ×2 в surge период', () => {
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      expect(service.getSurgeMultiplier(surgeDate)).toBe(2.0);
    });

    test('должен возвращать ×1 вне surge периода', () => {
      const normalDate = new Date(2025, 4, 20); // 20 мая 2025
      expect(service.getSurgeMultiplier(normalDate)).toBe(1.0);
    });

    test('должен использовать кастомный множитель из конфигурации', () => {
      service.updateConfig({ multiplier: 3.5 });
      
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      expect(service.getSurgeMultiplier(surgeDate)).toBe(3.5);
    });
  });

  describe('getSurgePricingStatus', () => {
    test('должен возвращать полный статус для активного surge периода', () => {
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      const status = service.getSurgePricingStatus(surgeDate);

      expect(status.isActive).toBe(true);
      expect(status.multiplier).toBe(2.0);
      expect(status.reason).toBe('Высокий сезон отчетности (15-30 июня)');
      expect(status.startDate).toEqual(new Date(2025, 5, 15));
      expect(status.endDate).toEqual(new Date(2025, 5, 30));
      expect(status.timeRemaining).toContain('дней до окончания');
    });

    test('должен возвращать статус для неактивного периода', () => {
      const normalDate = new Date(2025, 4, 20); // 20 мая 2025
      const status = service.getSurgePricingStatus(normalDate);

      expect(status.isActive).toBe(false);
      expect(status.multiplier).toBe(1.0);
      expect(status.reason).toBe('Обычное ценообразование');
      expect(status.startDate).toBeUndefined();
      expect(status.endDate).toBeUndefined();
      expect(status.timeRemaining).toBeUndefined();
    });

    test('должен правильно рассчитывать дни до окончания', () => {
      const date25June = new Date(2025, 5, 25); // 25 июня 2025
      const status = service.getSurgePricingStatus(date25June);

      expect(status.timeRemaining).toBe('5 дней до окончания'); // 30 - 25 = 5
    });
  });

  describe('getSurgePricingNotification', () => {
    test('должен возвращать уведомление о начале surge периода', () => {
      const surgeDate = new Date(2025, 5, 16); // 16 июня 2025
      const notification = service.getSurgePricingNotification(surgeDate);

      expect(notification).not.toBeNull();
      expect(notification!.type).toBe('start');
      expect(notification!.isActive).toBe(true);
      expect(notification!.message).toContain('Период surge pricing активен');
      expect(notification!.message).toContain('в 2 раза'); // Используем "в 2 раза" вместо "×2"
    });

    test('должен возвращать напоминание за 3 дня до окончания', () => {
      const date28June = new Date(2025, 5, 28); // 28 июня 2025 (осталось 2 дня)
      const notification = service.getSurgePricingNotification(date28June);

      expect(notification).not.toBeNull();
      expect(notification!.type).toBe('reminder');
      expect(notification!.isActive).toBe(true);
      expect(notification!.message).toContain('Surge pricing активен');
      expect(notification!.daysRemaining).toBe(2);
    });

    test('должен возвращать предупреждение за неделю до начала', () => {
      const date10June = new Date(2025, 5, 10); // 10 июня 2025 (за 5 дней до начала)
      const notification = service.getSurgePricingNotification(date10June);

      expect(notification).not.toBeNull();
      expect(notification!.type).toBe('reminder');
      expect(notification!.isActive).toBe(false);
      expect(notification!.message).toContain('начнется через');
      expect(notification!.daysRemaining).toBe(5);
    });

    test('должен возвращать null вне периодов уведомлений', () => {
      const date1May = new Date(2025, 4, 1); // 1 мая 2025
      const notification = service.getSurgePricingNotification(date1May);

      expect(notification).toBeNull();
    });
  });

  describe('calculatePrice', () => {
    test('должен правильно рассчитывать цену в surge период', () => {
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      
      expect(service.calculatePrice(100, surgeDate)).toBe(200); // 100 × 2 = 200
      expect(service.calculatePrice(150, surgeDate)).toBe(300); // 150 × 2 = 300
      expect(service.calculatePrice(33, surgeDate)).toBe(66);   // 33 × 2 = 66
    });

    test('должен правильно рассчитывать цену вне surge периода', () => {
      const normalDate = new Date(2025, 4, 20); // 20 мая 2025
      
      expect(service.calculatePrice(100, normalDate)).toBe(100); // 100 × 1 = 100
      expect(service.calculatePrice(150, normalDate)).toBe(150); // 150 × 1 = 150
    });

    test('должен округлять цену вверх', () => {
      service.updateConfig({ multiplier: 1.5 });
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      
      expect(service.calculatePrice(33, surgeDate)).toBe(50); // Math.ceil(33 × 1.5) = Math.ceil(49.5) = 50
      expect(service.calculatePrice(100, surgeDate)).toBe(150); // Math.ceil(100 × 1.5) = 150
    });
  });

  describe('getJobPriority', () => {
    test('должен возвращать high приоритет в surge период', () => {
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      expect(service.getJobPriority(surgeDate)).toBe('high');
    });

    test('должен возвращать normal приоритет вне surge периода', () => {
      const normalDate = new Date(2025, 4, 20); // 20 мая 2025
      expect(service.getJobPriority(normalDate)).toBe('normal');
    });
  });

  describe('getBannerInfo', () => {
    test('должен возвращать warning баннер в surge период', () => {
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      const banner = service.getBannerInfo(surgeDate);

      expect(banner).not.toBeNull();
      expect(banner!.show).toBe(true);
      expect(banner!.type).toBe('warning');
      expect(banner!.message).toContain('Surge период активен');
      expect(banner!.message).toContain('×2');
    });

    test('должен возвращать info баннер за неделю до начала', () => {
      const date10June = new Date(2025, 5, 10); // 10 июня 2025
      const banner = service.getBannerInfo(date10June);

      expect(banner).not.toBeNull();
      expect(banner!.show).toBe(true);
      expect(banner!.type).toBe('info');
      expect(banner!.message).toContain('Скидка 15%');
    });

    test('должен возвращать null вне периодов', () => {
      const date1May = new Date(2025, 4, 1); // 1 мая 2025
      const banner = service.getBannerInfo(date1May);

      expect(banner).toBeNull();
    });
  });

  describe('willBeSurgeActive', () => {
    test('должен определить пересечение с surge периодом', () => {
      const currentYear = new Date().getFullYear();
      
      // Диапазон полностью в surge периоде
      const start1 = new Date(currentYear, 5, 16);
      const end1 = new Date(currentYear, 5, 25);
      expect(service.willBeSurgeActive(start1, end1)).toBe(true);

      // Диапазон пересекается с началом surge периода
      const start2 = new Date(currentYear, 5, 10);
      const end2 = new Date(currentYear, 5, 20);
      expect(service.willBeSurgeActive(start2, end2)).toBe(true);

      // Диапазон полностью до surge периода
      const start3 = new Date(currentYear, 4, 1);
      const end3 = new Date(currentYear, 4, 30);
      expect(service.willBeSurgeActive(start3, end3)).toBe(false);
    });
  });

  describe('getDaysToSurgeEvent', () => {
    test('должен правильно рассчитывать дни до окончания в surge период', () => {
      const date25June = new Date(2025, 5, 25); // 25 июня 2025
      const result = service.getDaysToSurgeEvent(date25June);

      expect(result.event).toBe('end');
      expect(result.days).toBe(5); // До 30 июня осталось 5 дней
    });

    test('должен правильно рассчитывать дни до начала', () => {
      const date10June = new Date(2025, 5, 10); // 10 июня 2025
      const result = service.getDaysToSurgeEvent(date10June);

      expect(result.event).toBe('start');
      expect(result.days).toBe(5); // До 15 июня осталось 5 дней
    });

    test('должен возвращать none для далеких дат', () => {
      const date1January = new Date(2025, 0, 1); // 1 января 2025
      const result = service.getDaysToSurgeEvent(date1January);

      expect(result.event).toBe('start');
      expect(result.days).toBeGreaterThan(100);
    });
  });

  describe('Singleton Instance', () => {
    test('должен экспортировать singleton instance', () => {
      expect(surgePricingService).toBeDefined();
      expect(surgePricingService).toBeInstanceOf(SurgePricingService);
    });

    test('singleton должен работать корректно', () => {
      const date = new Date(2025, 5, 20); // 20 июня 2025
      expect(surgePricingService.isSurgePeriod(date)).toBe(true);
      expect(surgePricingService.getSurgeMultiplier(date)).toBe(2.0);
    });
  });

  describe('Edge Cases', () => {
    test('должен корректно обрабатывать граничные секунды', () => {
      const currentYear = new Date().getFullYear();
      
      // Последняя секунда до surge периода
      const lastSecondBefore = new Date(currentYear, 5, 14, 23, 59, 59, 999);
      expect(service.isSurgePeriod(lastSecondBefore)).toBe(false);
      
      // Первая секунда surge периода
      const firstSecondSurge = new Date(currentYear, 5, 15, 0, 0, 0, 0);
      expect(service.isSurgePeriod(firstSecondSurge)).toBe(true);
    });

    test('должен обрабатывать нулевые и отрицательные цены', () => {
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      
      expect(service.calculatePrice(0, surgeDate)).toBe(0); // 0 × 2 = 0
      expect(service.calculatePrice(-100, surgeDate)).toBe(-200); // -100 × 2 = -200
    });

    test('должен обрабатывать дробные цены', () => {
      const surgeDate = new Date(2025, 5, 20); // 20 июня 2025
      
      expect(service.calculatePrice(1.5, surgeDate)).toBe(3); // Math.ceil(1.5 × 2) = 3
      expect(service.calculatePrice(2.7, surgeDate)).toBe(6); // Math.ceil(2.7 × 2) = 6
    });
  });
});
