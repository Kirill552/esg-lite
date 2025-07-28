/**
 * Email Service для уведомлений о ценах
 * Задача 5.3: Создать систему уведомлений о ценах
 * 
 * Отправляет email уведомления о surge pricing и изменениях тарифов
 */

import type { PricingNotification } from '@/lib/pricing-notifications';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  userId: string;
}

class EmailService {
  /**
   * Создать email шаблон для уведомления о surge pricing
   */
  createSurgePricingTemplate(notification: PricingNotification): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://esg-lite.com';
    
    switch (notification.type) {
      case 'surge_start':
        return {
          subject: '📈 ESG-Lite: Начался период surge pricing',
          html: this.createSurgeStartEmailHtml(notification, baseUrl),
          text: this.createSurgeStartEmailText(notification, baseUrl)
        };
        
      case 'surge_end':
        return {
          subject: '📉 ESG-Lite: Завершился период surge pricing',
          html: this.createSurgeEndEmailHtml(notification, baseUrl),
          text: this.createSurgeEndEmailText(notification, baseUrl)
        };
        
      case 'discount':
        return {
          subject: '💰 ESG-Lite: Последние дни обычных тарифов!',
          html: this.createDiscountEmailHtml(notification, baseUrl),
          text: this.createDiscountEmailText(notification, baseUrl)
        };
        
      default:
        return {
          subject: '🔔 ESG-Lite: Уведомление о ценах',
          html: this.createGenericEmailHtml(notification, baseUrl),
          text: this.createGenericEmailText(notification, baseUrl)
        };
    }
  }

  /**
   * HTML шаблон для начала surge pricing
   */
  private createSurgeStartEmailHtml(notification: PricingNotification, baseUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 24px;
            text-align: center;
          }
          .content {
            padding: 24px;
          }
          .alert {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }
          .button {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          }
          .footer {
            background: #f3f4f6;
            padding: 16px 24px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 Активен Surge Pricing</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            
            <div class="alert">
              <strong>⚠️ Важно:</strong> В период с 15 по 30 июня действуют повышенные тарифы на обработку документов.
              Стоимость увеличена в 2 раза в связи с высоким сезоном отчетности.
            </div>
            
            <p>Рекомендуем:</p>
            <ul>
              <li>Планировать обработку документов заранее</li>
              <li>Использовать пакетную загрузку для экономии</li>
              <li>Проверить баланс кредитов перед обработкой</li>
            </ul>
            
            ${notification.actionUrl ? `
              <a href="${baseUrl}${notification.actionUrl}" class="button">
                ${notification.actionText || 'Узнать подробности'}
              </a>
            ` : ''}
          </div>
          <div class="footer">
            <p>ESG-Lite | Автоматизация углеродной отчетности</p>
            <p>Если вы не хотите получать такие уведомления, <a href="${baseUrl}/settings">измените настройки</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Текстовая версия для начала surge pricing
   */
  private createSurgeStartEmailText(notification: PricingNotification, baseUrl: string): string {
    return `
ESG-Lite: Активен Surge Pricing

${notification.title}

${notification.message}

ВАЖНО: В период с 15 по 30 июня действуют повышенные тарифы на обработку документов.
Стоимость увеличена в 2 раза в связи с высоким сезоном отчетности.

Рекомендуем:
- Планировать обработку документов заранее
- Использовать пакетную загрузку для экономии  
- Проверить баланс кредитов перед обработкой

${notification.actionUrl ? `${notification.actionText || 'Узнать подробности'}: ${baseUrl}${notification.actionUrl}` : ''}

---
ESG-Lite | Автоматизация углеродной отчетности
Настройки: ${baseUrl}/settings
    `.trim();
  }

  /**
   * HTML шаблон для скидки
   */
  private createDiscountEmailHtml(notification: PricingNotification, baseUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            padding: 24px;
            text-align: center;
          }
          .content {
            padding: 24px;
          }
          .success {
            background: #d1fae5;
            border: 1px solid #059669;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }
          .button {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          }
          .footer {
            background: #f3f4f6;
            padding: 16px 24px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Последние дни обычных тарифов!</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            
            <div class="success">
              <strong>💡 Совет:</strong> Обработайте документы сейчас по базовым тарифам. 
              Вскоре начнется surge pricing с повышенной стоимостью.
            </div>
            
            <p>Что можно сделать прямо сейчас:</p>
            <ul>
              <li>Загрузить накопившиеся документы</li>
              <li>Сгенерировать отчеты за текущий период</li>
              <li>Пополнить баланс кредитов</li>
            </ul>
            
            ${notification.actionUrl ? `
              <a href="${baseUrl}${notification.actionUrl}" class="button">
                ${notification.actionText || 'Загрузить документ'}
              </a>
            ` : ''}
          </div>
          <div class="footer">
            <p>ESG-Lite | Автоматизация углеродной отчетности</p>
            <p>Если вы не хотите получать такие уведомления, <a href="${baseUrl}/settings">измените настройки</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Текстовая версия для скидки
   */
  private createDiscountEmailText(notification: PricingNotification, baseUrl: string): string {
    return `
ESG-Lite: Последние дни обычных тарифов!

${notification.title}

${notification.message}

СОВЕТ: Обработайте документы сейчас по базовым тарифам. 
Вскоре начнется surge pricing с повышенной стоимостью.

Что можно сделать прямо сейчас:
- Загрузить накопившиеся документы
- Сгенерировать отчеты за текущий период
- Пополнить баланс кредитов

${notification.actionUrl ? `${notification.actionText || 'Загрузить документ'}: ${baseUrl}${notification.actionUrl}` : ''}

---
ESG-Lite | Автоматизация углеродной отчетности
Настройки: ${baseUrl}/settings
    `.trim();
  }

  /**
   * Базовые шаблоны для других типов уведомлений
   */
  private createSurgeEndEmailHtml(notification: PricingNotification, baseUrl: string): string {
    return this.createGenericEmailHtml(notification, baseUrl, '#059669', '📉 Surge pricing завершен');
  }

  private createSurgeEndEmailText(notification: PricingNotification, baseUrl: string): string {
    return this.createGenericEmailText(notification, baseUrl, 'ESG-Lite: Surge pricing завершен');
  }

  private createGenericEmailHtml(notification: PricingNotification, baseUrl: string, color = '#3b82f6', headerTitle?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: ${color};
            color: white;
            padding: 24px;
            text-align: center;
          }
          .content {
            padding: 24px;
          }
          .button {
            display: inline-block;
            background: ${color};
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          }
          .footer {
            background: #f3f4f6;
            padding: 16px 24px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerTitle || notification.title}</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            
            ${notification.actionUrl ? `
              <a href="${baseUrl}${notification.actionUrl}" class="button">
                ${notification.actionText || 'Подробнее'}
              </a>
            ` : ''}
          </div>
          <div class="footer">
            <p>ESG-Lite | Автоматизация углеродной отчетности</p>
            <p>Если вы не хотите получать такие уведомления, <a href="${baseUrl}/settings">измените настройки</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private createGenericEmailText(notification: PricingNotification, baseUrl: string, subject?: string): string {
    return `
${subject || 'ESG-Lite: Уведомление о ценах'}

${notification.title}

${notification.message}

${notification.actionUrl ? `${notification.actionText || 'Подробнее'}: ${baseUrl}${notification.actionUrl}` : ''}

---
ESG-Lite | Автоматизация углеродной отчетности
Настройки: ${baseUrl}/settings
    `.trim();
  }

  /**
   * Отправить email (заглушка для MVP)
   * В production здесь будет интеграция с Sendgrid, AWS SES или другим провайдером
   */
  async sendEmail(recipient: EmailRecipient, template: EmailTemplate): Promise<boolean> {
    // Для MVP просто логируем
    console.log('📧 Email отправлен:', {
      to: recipient.email,
      subject: template.subject,
      userId: recipient.userId
    });
    
    // В production здесь будет реальная отправка:
    // const response = await emailProvider.send({
    //   to: recipient.email,
    //   subject: template.subject,
    //   html: template.html,
    //   text: template.text
    // });
    
    return true;
  }

  /**
   * Отправить уведомление о surge pricing конкретному пользователю
   */
  async sendPricingNotification(
    recipient: EmailRecipient,
    notification: PricingNotification
  ): Promise<boolean> {
    try {
      const template = this.createSurgePricingTemplate(notification);
      return await this.sendEmail(recipient, template);
    } catch (error) {
      console.error('❌ Ошибка отправки email уведомления:', error);
      return false;
    }
  }
}

// Экспортируем singleton
export const emailService = new EmailService();
export default emailService;
