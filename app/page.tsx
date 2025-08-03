'use client'

import { useEffect } from 'react'
import { HeroSection } from '@/components/sections/hero'
import Features from '@/components/sections/features'
import HowItWorks from '@/components/sections/how-it-works'
import Pricing from '@/components/sections/pricing'

export default function HomePage() {
  useEffect(() => {
    // Принудительно устанавливаем светлую тему для всего документа
    const html = document.documentElement
    const originalClass = html.className
    
    // Добавляем класс light и убираем dark если есть
    html.classList.add('light')
    html.classList.remove('dark')
    
    // Cleanup - возвращаем оригинальные классы при размонтировании
    return () => {
      html.className = originalClass
    }
  }, [])

  return (
    <main className="min-h-screen">
      <HeroSection />
      <Features />
      <HowItWorks />
      <Pricing />
    </main>
  );
} 