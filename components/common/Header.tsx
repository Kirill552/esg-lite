'use client'

import Link from 'next/link'
import { UserButton, SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'

export function Header() {

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
              ESG-Lite MVP
            </Link>
          </div>
          
          <nav className="flex items-center space-x-8">
            <SignedIn>
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Главная
              </Link>
              <Link 
                href="/credits" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Кредиты
              </Link>
              <Link 
                href="/subscription" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Тарифы
              </Link>
              <Link 
                href="/upload" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Загрузить файл
              </Link>
              <Link 
                href="/documents" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Документы
              </Link>
              <Link 
                href="/create-report" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Создать отчет
              </Link>
              <Link 
                href="/reports" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Отчёты
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  }
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
            
            <SignedOut>
              <div className="flex items-center space-x-4">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Войти
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="primary" size="sm">
                    Регистрация
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </nav>
        </div>
      </div>
    </header>
  )
} 