'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils';

export function FloatingActionButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Показываем кнопку после небольшой задержки с анимацией
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Link 
      href="/create-report"
      className={cn(
        "fixed bottom-8 right-6 z-40 lg:hidden flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 group",
        "dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-700 dark:hover:to-green-800",
        "hover:scale-110 active:scale-95",
        // Анимация появления
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-2"
      )}
      aria-label="Создать новый отчёт"
    >
      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
      
      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 bg-slate-900 dark:bg-slate-700 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        New report
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
      </div>
    </Link>
  )
}
