"use client"

import React from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Play, 
  Zap, 
  Shield, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';

export function HeroSection() {
  const stats = [
    { icon: Zap, value: "< 2 мин", label: "Время обработки", color: "text-emerald-400" },
    { icon: Shield, value: "99.9%", label: "Точность распознавания", color: "text-blue-400" },
    { icon: TrendingUp, value: "296-ФЗ", label: "Полное соответствие", color: "text-amber-400" }
  ];

  const companies = ["Ростех", "Газпром", "Роснефть", "ЛУКОЙЛ"];

  return (
    <section className="relative min-h-[50dvh] md:min-h-[60dvh] bg-gradient-to-br from-emerald-100/70 via-green-50/50 to-cyan-100/40 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-300/60 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-green-300/60 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-300/60 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative container mx-auto px-6 pt-8 pb-4">
        {/* Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100/80 backdrop-blur-sm rounded-full text-emerald-700 text-sm font-medium border border-emerald-200/50">
            <Sparkles className="w-4 h-4 mr-2" />
            Соответствие 296-ФЗ об ограничении выбросов парниковых газов
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
            ESG-отчёты{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              за минуты
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Загрузите счёт за электроэнергию или транспортную накладную — получите 
            готовый отчёт по 296-ФЗ. Автоматическое распознавание данных и точный 
            расчёт углеродного следа.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
          >
            Создать отчёт бесплатно
            <Zap className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="secondary" 
            size="lg"
            className="border-2 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-600 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:bg-emerald-50/50"
          >
            <Play className="mr-2 h-5 w-5" />
            Посмотреть демо
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center group cursor-pointer"
            >
              <div className="mb-3 flex justify-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  index === 0 ? 'from-emerald-500 to-green-600' :
                  index === 1 ? 'from-blue-500 to-cyan-600' :
                  'from-amber-500 to-orange-600'
                } p-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className={`text-2xl font-bold ${stat.color} mb-1 group-hover:scale-105 transition-transform`}>
                {stat.value}
              </div>
              <div className="text-slate-600 font-medium text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="text-center mb-4">
          <p className="text-slate-500 text-sm font-medium mb-4">Нам доверяют</p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-slate-400 font-semibold text-base">
            {companies.map((company, index) => (
              <span 
                key={index} 
                className="hover:text-emerald-600 transition-colors duration-300 cursor-default"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
} 