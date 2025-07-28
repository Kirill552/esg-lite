/**
 * Yandex Cloud Monitoring Integration
 * Отправка метрик PostgreSQL очередей и производительности системы
 */

import fs from 'fs';
import jwt from 'jsonwebtoken';

interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

interface YandexCloudConfig {
  folderId: string;
  serviceAccountKeyFile?: string;
  serviceAccountJson?: string;
  endpoint?: string;
  enabled?: boolean;
}

export class YandexCloudMonitoring {
  private config: YandexCloudConfig;
  private iamToken: string | null = null;
  private tokenExpirationTime: Date | null = null;

  constructor(config: YandexCloudConfig) {
    this.config = {
      endpoint: 'https://monitoring.api.cloud.yandex.net/monitoring/v2/data/write',
      enabled: true,
      ...config
    };
  }

  /**
   * Проверка готовности к работе
   */
  isEnabled(): boolean {
    return Boolean(
      this.config.enabled && 
      this.config.folderId && 
      (this.config.serviceAccountKeyFile || this.config.serviceAccountJson)
    );
  }

  /**
   * Получение IAM токена через Service Account ключ
   */
  private async getIamToken(): Promise<string> {
    // Проверяем, не истек ли токен (с запасом 5 минут)
    if (this.iamToken && this.tokenExpirationTime && 
        new Date() < new Date(this.tokenExpirationTime.getTime() - 5 * 60 * 1000)) {
      return this.iamToken;
    }

    let serviceAccountKey: any;
    
    try {
      if (this.config.serviceAccountKeyFile) {
        const keyFileContent = fs.readFileSync(this.config.serviceAccountKeyFile, 'utf8');
        serviceAccountKey = JSON.parse(keyFileContent);
      } else if (this.config.serviceAccountJson) {
        serviceAccountKey = JSON.parse(this.config.serviceAccountJson);
      } else {
        throw new Error('Service Account key not provided');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load service account key: ${errorMessage}`);
    }

    // Создаем JWT для получения IAM токена
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
      iss: serviceAccountKey.service_account_id,
      iat: now,
      exp: now + 3600 // 1 час
    };

    let jwtToken: string;
    try {
      jwtToken = jwt.sign(payload, serviceAccountKey.private_key, {
        algorithm: 'PS256',
        keyid: serviceAccountKey.id
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create JWT: ${errorMessage}`);
    }

    // Обмениваем JWT на IAM токен
    const response = await fetch('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jwt: jwtToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get IAM token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    this.iamToken = data.iamToken;
    this.tokenExpirationTime = new Date(data.expiresAt);

    console.log('🔑 IAM токен обновлен, действителен до:', this.tokenExpirationTime);
    return this.iamToken!; // Мы знаем, что токен не null после присвоения
  }

  /**
   * Отправка метрик в Yandex Cloud Monitoring
   */
  async writeMetrics(metrics: MetricData[]): Promise<void> {
    if (!this.isEnabled()) {
      console.log('⚠️ Yandex Cloud Monitoring отключен');
      return;
    }

    if (metrics.length === 0) {
      return;
    }

    try {
      const iamToken = await this.getIamToken();

      const requestBody = {
        metrics: metrics.map(metric => ({
          name: metric.name,
          labels: {
            service: 'esg-lite',
            environment: process.env.NODE_ENV || 'development',
            ...metric.labels
          },
          type: 'DGAUGE', // Double gauge - подходит для большинства метрик
          ts: metric.timestamp 
            ? Math.floor(metric.timestamp.getTime() / 1000) 
            : Math.floor(Date.now() / 1000),
          value: metric.value
        }))
      };

      const response = await fetch(
        `${this.config.endpoint}?folderId=${this.config.folderId}&service=custom`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${iamToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log(`✅ Отправлено ${metrics.length} метрик в Yandex Cloud Monitoring`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Ошибка отправки метрик в Yandex Cloud:', errorMessage);
      // Не бросаем ошибку наружу, чтобы не ломать основную логику приложения
    }
  }

  /**
   * Отправка одной метрики
   */
  async writeMetric(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    return this.writeMetrics([{ name, value, labels }]);
  }

  /**
   * Массовая отправка метрик с повторными попытками
   */
  async writeMetricsWithRetry(metrics: MetricData[], maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.writeMetrics(metrics);
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Не удалось отправить метрики после ${maxRetries} попыток:`, errorMessage);
          return;
        }
        
        const delay = attempt * 2000; // 2s, 4s, 6s
        console.warn(`⚠️ Попытка ${attempt} не удалась, повтор через ${delay}мс...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

/**
 * Синглтон экземпляр для использования в приложении
 */
export const yandexMonitoring = new YandexCloudMonitoring({
  folderId: process.env.YANDEX_CLOUD_FOLDER_ID!,
  serviceAccountKeyFile: process.env.YANDEX_CLOUD_SA_KEY_FILE,
  serviceAccountJson: process.env.YANDEX_CLOUD_SA_JSON,
  endpoint: process.env.YANDEX_MONITORING_ENDPOINT,
  enabled: process.env.YANDEX_MONITORING_ENABLED === 'true'
});
