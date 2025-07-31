'use client'

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  ArrowLeft,
  BookOpen,
  FileText,
  Globe,
  TrendingUp,
  Shield,
  Calendar,
  Users,
  Building,
  Lightbulb,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Хлебные крошки */}
        <Breadcrumbs 
          items={[
            { label: 'База знаний' }
          ]}
          className="mb-6"
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="text-center knowledge-content">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              📚 База знаний ESG-Lite
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Полная база знаний по углеродной отчетности, 296-ФЗ и CBAM для российского бизнеса
            </p>
          </div>
        </div>

        {/* Knowledge Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* 296-ФЗ Guide */}
          <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">296-ФЗ Гид</h3>
              <p className="text-slate-600 mb-6">
                Полное руководство по Федеральному закону "Об ограничении выбросов парниковых газов"
              </p>
              <div className="space-y-2 text-sm text-slate-500 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Обновлено: июль 2025</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Для всех субъектов РФ</span>
                </div>
              </div>
              <Link href="/knowledge/296-fz" className="block">
                <Button className="w-full">
                  Изучить 296-ФЗ
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* CBAM Guide */}
          <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">CBAM Руководство</h3>
              <p className="text-slate-600 mb-6">
                Европейский механизм пограничной углеродной корректировки для российских экспортеров
              </p>
              <div className="space-y-2 text-sm text-slate-500 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Действует с 1 января 2026 года</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Для экспортеров в ЕС</span>
                </div>
              </div>
              <Link href="/knowledge/cbam" className="block">
                <Button className="w-full">
                  Изучить CBAM
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* General Knowledge */}
          <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">ESG Основы</h3>
              <p className="text-slate-600 mb-6">
                Основные принципы устойчивого развития и углеродной отчетности
              </p>
              <div className="space-y-2 text-sm text-slate-500 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Лучшие практики</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Проверенная информация</span>
                </div>
              </div>
              <Link href="/knowledge/esg-basics" className="block">
                <Button className="w-full" variant="ghost">
                  Скоро доступно
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Access Section */}
        <div className="mt-12">
          <Card className="p-8 border-0 bg-gradient-to-r from-emerald-50 to-blue-50">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">🚀 Быстрый доступ к документам</h2>
              <p className="text-slate-600">Актуальные нормативные документы и шаблоны для работы</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <FileText className="w-8 h-8 text-emerald-600 mb-3" />
                <h4 className="font-semibold text-slate-900 mb-2">Текст 296-ФЗ</h4>
                <p className="text-sm text-slate-600 mb-4">Полный текст закона в актуальной редакции</p>
                <a href="https://www.consultant.ru/document/cons_doc_LAW_388992/" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Перейти
                  </Button>
                </a>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Globe className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-slate-900 mb-2">CBAM Regulation</h4>
                <p className="text-sm text-slate-600 mb-4">Официальное постановление ЕС</p>
                <a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Перейти
                  </Button>
                </a>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
                <h4 className="font-semibold text-slate-900 mb-2">Методики расчета</h4>
                <p className="text-sm text-slate-600 mb-4">Утвержденные методики расчета выбросов</p>
                <a href="https://www.consultant.ru/law/podborki/metodika_rascheta_vybrosov_parnikovyh_gazov/" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Перейти
                  </Button>
                </a>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-slate-900 mb-2">Шаблоны отчетов</h4>
                <p className="text-sm text-slate-600 mb-4">Готовые шаблоны для заполнения</p>
                <a href="https://www.trudohrana.ru/article/104387-23-m6-kak-oformit-otchet-po-parnikovym-gazam-v-2023-godu" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Перейти
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
