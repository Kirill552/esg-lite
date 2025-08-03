'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

interface UserSettings {
  emailNotifications: boolean;
  pricingAlerts: boolean;
  weeklyReports: boolean;
  lowBalanceThreshold: number;
  autoBackup: boolean;
  dataRetention: number;
  twoFactorEnabled: boolean;
}

interface OrganizationSettings {
  name: string;
  taxId: string;
  address: string;
  contactEmail: string;
  defaultReportFormat: string;
  timezone: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('sk-proj-...');
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'billing' | 'data'>('profile');

  const [userSettings, setUserSettings] = useState<UserSettings>({
    emailNotifications: true,
    pricingAlerts: true,
    weeklyReports: false,
    lowBalanceThreshold: 100,
    autoBackup: true,
    dataRetention: 365,
    twoFactorEnabled: false
  });

  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: '',
    taxId: '',
    address: '',
    contactEmail: '',
    defaultReportFormat: 'PDF',
    timezone: 'Europe/Moscow'
  });

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'billing', label: 'Биллинг', icon: CreditCard },
    { id: 'data', label: 'Данные', icon: Download }
  ];

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      // Загрузка настроек пользователя и организации
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Сохранение настроек
      await new Promise(resolve => setTimeout(resolve, 1000)); // Симуляция сохранения
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateNewApiKey = async () => {
    try {
      setApiKey('sk-proj-' + Math.random().toString(36).substring(2, 15));
    } catch (error) {
      console.error('Ошибка генерации API ключа:', error);
    }
  };

  const exportData = async () => {
    try {
      // Экспорт данных пользователя
      console.log('Экспорт данных...');
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
    }
  };

  const deleteAccount = async () => {
    if (confirm('Вы действительно хотите удалить аккаунт? Это действие необратимо.')) {
      try {
        // Удаление аккаунта
        console.log('Удаление аккаунта...');
      } catch (error) {
        console.error('Ошибка удаления аккаунта:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/20">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Информация об организации</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Название организации
            </label>
            <input
              type="text"
              value={orgSettings.name}
              onChange={(e) => setOrgSettings(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ООО Экологические решения"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ИНН
            </label>
            <input
              type="text"
              value={orgSettings.taxId}
              onChange={(e) => setOrgSettings(prev => ({ ...prev, taxId: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="1234567890"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Адрес
            </label>
            <textarea
              value={orgSettings.address}
              onChange={(e) => setOrgSettings(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="г. Москва, ул. Примерная, д. 123"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email для связи
            </label>
            <input
              type="email"
              value={orgSettings.contactEmail}
              onChange={(e) => setOrgSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="contact@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Часовой пояс
            </label>
            <select
              value={orgSettings.timezone}
              onChange={(e) => setOrgSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Europe/Moscow">Москва (UTC+3)</option>
              <option value="Europe/Samara">Самара (UTC+4)</option>
              <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
              <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Настройки отчетов</h3>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Формат отчетов по умолчанию
          </label>
          <select
            value={orgSettings.defaultReportFormat}
            onChange={(e) => setOrgSettings(prev => ({ ...prev, defaultReportFormat: e.target.value }))}
            className="w-full md:w-1/3 px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="PDF">PDF</option>
            <option value="XLSX">Excel (XLSX)</option>
            <option value="CSV">CSV</option>
            <option value="XML">XML</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Email уведомления</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={userSettings.emailNotifications}
              onChange={(e) => setUserSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="ml-3 text-sm text-foreground">Общие уведомления</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={userSettings.pricingAlerts}
              onChange={(e) => setUserSettings(prev => ({ ...prev, pricingAlerts: e.target.checked }))}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="ml-3 text-sm text-foreground">Уведомления о сезонном повышении цен (15-30 июня)</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={userSettings.weeklyReports}
              onChange={(e) => setUserSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="ml-3 text-sm text-foreground">Еженедельные отчеты</span>
          </label>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Пороги уведомлений</h3>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Предупреждение о низком балансе (т CO₂)
          </label>
          <input
            type="number"
            value={userSettings.lowBalanceThreshold}
            onChange={(e) => setUserSettings(prev => ({ ...prev, lowBalanceThreshold: parseInt(e.target.value) || 0 }))}
            className="w-full md:w-1/3 px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            min="0"
            max="1000"
          />
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">API ключи</h3>
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Ваш API ключ</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <div className="font-mono text-sm bg-background rounded border border-border p-3 mb-3 text-foreground">
            {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={generateNewApiKey}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Перегенерировать
          </Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Двухфакторная аутентификация</h3>
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">2FA</p>
            <p className="text-xs text-muted-foreground">Дополнительная защита аккаунта</p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={userSettings.twoFactorEnabled}
              onChange={(e) => setUserSettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              className="rounded border-border text-primary focus:ring-primary"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Настройки биллинга</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-card border border-border">
            <h4 className="font-medium text-foreground mb-2">Текущий план</h4>
            <p className="text-sm text-muted-foreground mb-3">Lite Annual</p>
            <Button variant="secondary" size="sm">
              Изменить план
            </Button>
          </Card>
          
          <Card className="p-4 bg-card border border-border">
            <h4 className="font-medium text-foreground mb-2">Баланс кредитов</h4>
            <p className="text-sm text-muted-foreground mb-3">1,250 т CO₂</p>
            <Button variant="secondary" size="sm">
              Пополнить
            </Button>
          </Card>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">История платежей</h3>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">История платежей будет отображаться здесь</p>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Управление данными</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={userSettings.autoBackup}
              onChange={(e) => setUserSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="ml-3 text-sm text-foreground">Автоматическое резервное копирование</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Период хранения данных (дни)
            </label>
            <input
              type="number"
              value={userSettings.dataRetention}
              onChange={(e) => setUserSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) || 365 }))}
              className="w-full md:w-1/3 px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              min="30"
              max="3650"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Экспорт и удаление</h3>
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={exportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт всех данных
          </Button>
          
          <Button
            variant="error"
            onClick={deleteAccount}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить аккаунт
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/20">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Настройки</h1>
          <p className="text-muted-foreground">Управление вашим аккаунтом и настройками системы</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Боковая навигация */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Основной контент */}
          <div className="lg:col-span-3">
            <Card className="p-6 bg-card border border-border">
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'billing' && renderBillingTab()}
              {activeTab === 'data' && renderDataTab()}

              {/* Кнопки действий */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-border">
                <Button variant="secondary">
                  Отмена
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
