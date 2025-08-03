'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText,
  Zap,
  Globe,
  ArrowLeft,
  CheckCircle,
  Leaf,
  Building2,
  Calculator,
  Activity,
  Save,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ReportFormData {
  inn?: string;
  companyName?: string;
  fullCompanyName?: string;
  ogrn?: string;
  kpp?: string;
  address?: string;
  okved?: string;
  okvedName?: string;
  reportingYear?: string;
  [key: string]: any;
}

interface CompanyInfo {
  inn: string;
  name: string;
  fullName: string;
  ogrn: string;
  kpp?: string;
  legalForm: string;
  address: string;
  okved: string;
  okvedName: string;
  status: string;
  source: string;
}

export default function CreateReportPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({});
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const router = useRouter();

  const reportTypes = [
    {
      id: '296fz',
      title: 'Отчет 296-ФЗ',
      description: 'Российская отчетность по выбросам парниковых газов с автозаполнением данных организации',
      icon: Zap,
      color: 'from-emerald-500 to-green-500',
      buttonGradient: 'from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
      borderColor: 'hover:border-green-300',
      features: [
        'Автозаполнение по ИНН',
        'Валидация полей',
        'PDF на русском',
        'Соответствие 296-ФЗ'
      ],
      isEnabled: true,
      reportType: 'REPORT_296FZ'
    },
    {
      id: 'carbon-footprint',
      title: 'Углеродный след',
      description: 'Расчет углеродного следа продукции или деятельности компании за отчетный период',
      icon: Leaf,
      color: 'from-blue-500 to-cyan-500',
      buttonGradient: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
      borderColor: 'hover:border-blue-300',
      features: [
        'LCA анализ',
        'Scope 1,2,3 выбросы',
        'Международные стандарты',
        'Детальная разбивка'
      ],
      isEnabled: true,
      reportType: 'CARBON_FOOTPRINT'
    },
    {
      id: 'cbam',
      title: 'CBAM Отчет',
      description: 'Квартальная отчетность EU Carbon Border Adjustment Mechanism для экспорта в Европу',
      icon: Globe,
      color: 'from-purple-500 to-indigo-500',
      buttonGradient: 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
      borderColor: 'hover:border-purple-300',
      features: [
        'EU 2023/1773',
        'EORI номера',
        'XML экспорт',
        'Товарные коды CN'
      ],
      isEnabled: true,
      reportType: 'CBAM_XML'
    },
    {
      id: 'energy-audit',
      title: 'Энергоаудит',
      description: 'Анализ энергопотребления и энергоэффективности предприятия',
      icon: Building2,
      color: 'from-amber-500 to-orange-500',
      buttonGradient: 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
      borderColor: 'hover:border-amber-300',
      features: [
        'Энергобаланс',
        'Рекомендации по экономии',
        'ROI проектов',
        'Паспорт энергоэффективности'
      ],
      isEnabled: false,
      reportType: 'REPORT_296FZ'
    },
    {
      id: 'esg-rating',
      title: 'ESG Рейтинг',
      description: 'Комплексная оценка экологических, социальных и управленческих показателей',
      icon: Activity,
      color: 'from-indigo-500 to-purple-500',
      buttonGradient: 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
      borderColor: 'hover:border-indigo-300',
      features: [
        'Environmental факторы',
        'Social показатели',
        'Governance оценка',
        'Бенчмарк анализ'
      ],
      isEnabled: false,
      reportType: 'REPORT_296FZ'
    },
    {
      id: 'sustainability',
      title: 'Отчет устойчивости',
      description: 'Отчет о корпоративной устойчивости по стандартам GRI, SASB, TCFD',
      icon: Calculator,
      color: 'from-teal-500 to-cyan-500',
      buttonGradient: 'from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700',
      borderColor: 'hover:border-teal-300',
      features: [
        'GRI Standards',
        'SASB метрики',
        'TCFD требования',
        'SDG цели'
      ],
      isEnabled: false,
      reportType: 'REPORT_296FZ'
    }
  ];

  const handleCreateReport = (reportId: string) => {
    const report = reportTypes.find(r => r.id === reportId);
    if (report?.isEnabled) {
      setSelectedReport(reportId);
      setFormData({});
      setCompanyInfo(null);
    }
  };

  // Автозаполнение по ИНН
  const handleINNChange = async (inn: string) => {
    const cleanInn = inn.replace(/\D/g, '');
    setFormData((prev: ReportFormData) => ({ ...prev, inn: cleanInn }));

    if (cleanInn.length === 10 || cleanInn.length === 12) {
      setIsLoadingCompany(true);
      try {
        const response = await fetch(`/api/company-info?inn=${cleanInn}`);
        if (response.ok) {
          const companyData = await response.json();
          setCompanyInfo(companyData);
          
          // Автозаполнение полей формы
          setFormData((prev: ReportFormData) => ({
            ...prev,
            companyName: companyData.name,
            fullCompanyName: companyData.fullName,
            ogrn: companyData.ogrn,
            kpp: companyData.kpp || '',
            legalForm: companyData.legalForm,
            address: companyData.address,
            okved: companyData.okved,
            okvedName: companyData.okvedName
          }));
          
          toast.success(`Данные компании загружены (${companyData.source})`);
        } else {
          toast.error('Компания с таким ИНН не найдена');
          setCompanyInfo(null);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных компании:', error);
        toast.error('Ошибка загрузки данных компании');
        setCompanyInfo(null);
      } finally {
        setIsLoadingCompany(false);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: ReportFormData) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.companyName) {
      toast.error('Укажите название организации');
      return false;
    }
    if (!formData.reportingPeriod) {
      toast.error('Укажите отчетный период');
      return false;
    }
    if (selectedReport === '296fz' && !formData.inn) {
      toast.error('Укажите ИНН организации');
      return false;
    }
    if (selectedReport === 'cbam' && !formData.eori) {
      toast.error('Укажите EORI номер');
      return false;
    }
    return true;
  };

  const handleSubmitReport = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);
      
      const report = reportTypes.find(r => r.id === selectedReport);
      if (!report) return;

      const reportData = {
        reportType: report.reportType,
        fileName: `${report.title}_${formData.companyName}_${formData.reportingPeriod || new Date().getFullYear()}.pdf`,
        format: 'PDF',
        emissionData: formData,
        methodology: selectedReport === '296fz' ? '296-FZ-2025' : 'Standard',
        fileSize: Math.floor(Math.random() * 500000) + 100000,
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        const createdReport = await response.json();
        toast.success('Отчет создан успешно!');
        router.push('/reports');
      } else {
        throw new Error('Ошибка создания отчета');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Ошибка создания отчета');
    } finally {
      setIsCreating(false);
    }
  };

  if (selectedReport) {
    const report = reportTypes.find(r => r.id === selectedReport);
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setSelectedReport(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к выбору отчета
            </Button>
          </div>

          <Card className="p-8 bg-card border border-border">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 bg-gradient-to-r ${report?.color} rounded-lg flex items-center justify-center`}>
                {report?.icon && <report.icon className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">{report?.title}</h1>
                <p className="text-muted-foreground">{report?.description}</p>
              </div>
            </div>

            {/* Форма создания отчета */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Название организации *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="ООО 'Название компании'"
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Отчетный период *
                  </label>
                  <input
                    type="number"
                    value={formData.reportingPeriod || ''}
                    onChange={(e) => handleInputChange('reportingPeriod', e.target.value)}
                    placeholder="2024"
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
              </div>

              {selectedReport === '296fz' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ИНН организации *
                        {isLoadingCompany && <span className="ml-2 text-primary">(загрузка...)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.inn || ''}
                        onChange={(e) => handleINNChange(e.target.value)}
                        placeholder="7707083893"
                        maxLength={12}
                        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                      {companyInfo && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Данные загружены из {companyInfo.source === 'mock' ? 'тестовой базы' : 'Checko API'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        КПП
                      </label>
                      <input
                        type="text"
                        value={formData.kpp || ''}
                        onChange={(e) => handleInputChange('kpp', e.target.value)}
                        placeholder="770701001"
                        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                    </div>
                  </div>

                  {companyInfo && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">Информация о компании</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Полное название:</strong> {companyInfo.fullName}</p>
                          <p><strong>ОГРН:</strong> {companyInfo.ogrn}</p>
                          <p><strong>Статус:</strong> {companyInfo.status}</p>
                        </div>
                        <div>
                          <p><strong>Правовая форма:</strong> {companyInfo.legalForm}</p>
                          <p><strong>ОКВЭД:</strong> {companyInfo.okved} - {companyInfo.okvedName}</p>
                          <p><strong>Адрес:</strong> {companyInfo.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedReport === 'cbam' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      EORI номер *
                    </label>
                    <input
                      type="text"
                      value={formData.eori || ''}
                      onChange={(e) => handleInputChange('eori', e.target.value)}
                      placeholder="RU123456789012345"
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Отчетный квартал *
                    </label>
                    <select 
                      value={formData.quarter || ''}
                      onChange={(e) => handleInputChange('quarter', e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                      <option value="">Выберите квартал</option>
                      <option value="Q1 2025">Q1 2025</option>
                      <option value="Q2 2025">Q2 2025</option>
                      <option value="Q3 2025">Q3 2025</option>
                      <option value="Q4 2025">Q4 2025</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedReport === 'carbon-footprint' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Тип анализа *
                    </label>
                    <select 
                      value={formData.analysisType || ''}
                      onChange={(e) => handleInputChange('analysisType', e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                      <option value="">Выберите тип</option>
                      <option value="scope1-2">Scope 1 + 2</option>
                      <option value="scope1-2-3">Scope 1 + 2 + 3</option>
                      <option value="product">Продукционный след</option>
                      <option value="corporate">Корпоративный след</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Методология
                    </label>
                    <select 
                      value={formData.methodology || 'ghg-protocol'}
                      onChange={(e) => handleInputChange('methodology', e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                      <option value="ghg-protocol">GHG Protocol</option>
                      <option value="iso-14067">ISO 14067</option>
                      <option value="pas-2050">PAS 2050</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Дополнительные комментарии
                </label>
                <textarea
                  rows={3}
                  value={formData.comments || ''}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  placeholder="Укажите дополнительную информацию для отчета..."
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleSubmitReport}
                  disabled={isCreating}
                  variant="primary"
                  className={`flex-1 bg-gradient-to-r ${report?.buttonGradient} text-white shadow-lg hover:shadow-xl`}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Создание отчета...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Создать отчет
                    </>
                  )}
                </Button>
                <Link href="/reports">
                  <Button variant="secondary" className="px-6">
                    Отмена
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Навигация */}
        <div className="mb-6">
          <Link href="/reports">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к отчетам
            </Button>
          </Link>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Создать новый отчет
          </h1>
          <p className="text-xl text-muted-foreground">
            Выберите тип отчета для создания
          </p>
        </div>

        {/* Сетка отчетов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <Card 
              key={report.id}
              className={`p-6 hover:shadow-xl transition-all cursor-pointer border-2 bg-card border-border ${
                !report.isEnabled ? 'opacity-75' : ''
              }`}
              onClick={() => handleCreateReport(report.id)}
            >
              <div className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${report.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <report.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-card-foreground mb-3">
                  {report.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 text-sm">
                  {report.description}
                </p>
                
                <div className="space-y-2 mb-6">
                  {report.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className={`w-full bg-gradient-to-r ${report.buttonGradient} text-white shadow-lg hover:shadow-xl ${
                    !report.isEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!report.isEnabled}
                >
                  {report.isEnabled ? 'Создать отчет' : 'Скоро доступно'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Информационная секция */}
        <Card className="mt-12 bg-card border border-border">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-card-foreground mb-6 text-center">
              💡 Доступные отчеты для создания
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">296-ФЗ Отчет</h3>
                <p className="text-muted-foreground text-sm">
                  Российская отчетность по парниковым газам с автозаполнением данных
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">Углеродный след</h3>
                <p className="text-muted-foreground text-sm">
                  Расчет углеродного следа по международным стандартам
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">CBAM Отчет</h3>
                <p className="text-muted-foreground text-sm">
                  Европейская отчетность по углеродному налогу
                </p>
              </div>
            </div>
          </div>
        </Card>


      </div>
    </div>
  );
} 