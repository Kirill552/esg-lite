import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { OptimizedScripts } from '@/components/common/OptimizedScripts'
// import { PricingBanner } from '@/components/notifications/PricingBanner'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'ESG-Lite MVP',
  description: 'Веб-приложение для обработки PDF счетов и генерации отчётов по 296-ФЗ',
  keywords: ['ESG', '296-ФЗ', 'экология', 'отчётность', 'углеродный след'],
  authors: [{ name: 'ESG-Lite Team' }],
  openGraph: {
    title: 'ESG-Lite MVP',
    description: 'Автоматизация ESG отчётности по 296-ФЗ',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900 antialiased`}>
        <ThemeProvider>
          <ClerkProvider>
            {/* Skip to content link для accessibility */}
            <a 
              href="#main-content" 
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-emerald-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Skip to content
            </a>
            
            <div className="min-h-full">
              <Header />
              
              {/* Баннер уведомлений о ценах - временно отключен для отладки */}
              {/* <PricingBanner className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2" /> */}

              {/* Main Content */}
              <main id="main-content" className="flex-1">
                {children}
              </main>

              {/* Плавающая кнопка создания отчёта для мобильных */}
              <FloatingActionButton />

              <Footer />
            </div>
          </ClerkProvider>
        </ThemeProvider>
        
        {/* Оптимизированные сторонние скрипты */}
        <OptimizedScripts />
      </body>
    </html>
  )
} 