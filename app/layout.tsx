import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
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
    <html lang="ru" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <ClerkProvider>
          <div className="min-h-full">
          <Header />

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          <Footer />
        </div>
        </ClerkProvider>
      </body>
    </html>
  )
} 