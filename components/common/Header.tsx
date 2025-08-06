'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, SignInButton, SignUpButton, SignedIn, SignedOut, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import BillingDrawer from '@/components/ui/billing-drawer'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { 
  Menu, 
  X, 
  AlertTriangle, 
  FileText, 
  FolderOpen, 
  BarChart3, 
  Users,
  Plus,
  HelpCircle,
  Settings,
  Zap
} from 'lucide-react'

interface SubscriptionData {
  currentPlan: string;
  monthlyUsage: number;
  totalEmissions: number;
  planName?: string;
}

interface QueueData {
  count: number;
}

export function Header() {
  const pathname = usePathname()
  const { user } = useUser()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [isBillingOpen, setIsBillingOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Главные навигационные пункты (согласно аудиту - только 3, поставщики временно отключены)
  const mainNavItems = [
    { href: '/dashboard', label: 'Главная', icon: BarChart3 },
    { href: '/reports', label: 'Отчёты', icon: FileText },
    { href: '/documents', label: 'Документы', icon: FolderOpen },
  ]

  // Загрузка данных подписки и очереди
  useEffect(() => {
    if (user) {
      fetchSubscription()
      fetchQueueData()
      
      // Обновляем данные очереди каждые 30 секунд
      const interval = setInterval(fetchQueueData, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`/api/subscription/current?organizationId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        
        // Определяем русское название плана
        const planNames: Record<string, string> = {
          'LITE': 'Лайт',
          'STANDARD': 'Стандарт',
          'LARGE': 'Крупное предприятие'
        }
        
        setSubscriptionData({
          currentPlan: data.currentPlan,
          monthlyUsage: data.monthlyUsage || 0,
          totalEmissions: data.totalEmissions || 0,
          planName: planNames[data.currentPlan] || data.currentPlan
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки данных подписки:', error)
    }
  }

  const fetchQueueData = async () => {
    try {
      const response = await fetch(`/api/queue/status`)
      if (response.ok) {
        const data = await response.json()
        setQueueData({ count: data.pendingJobs || 0 })
      }
    } catch (error) {
      console.error('Ошибка загрузки данных очереди:', error)
      // Устанавливаем значение по умолчанию
      setQueueData({ count: 0 })
    }
  }

  const isActiveLink = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  const formatEmissions = (emissions: number) => {
    if (emissions >= 1000000) {
      return `${(emissions / 1000000).toFixed(1)}М`
    } else if (emissions >= 1000) {
      return `${(emissions / 1000).toFixed(0)}k`
    }
    return emissions.toLocaleString('ru-RU')
  }

  const isHighUsage = (usage: number, total: number) => {
    return total > 0 && (usage / total) > 0.8 // Более 80% от годового объема за месяц
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Логотип */}
          <Link href="/" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            ESG-Lite
          </Link>

          {/* Основная навигация (только для desktop) */}
          <SignedIn>
            <nav className="ml-6 lg:ml-8 hidden lg:flex space-x-3 lg:space-x-5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {mainNavItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveLink(href)
                      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
                      : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </SignedIn>

          <div className="flex-1" />

          <SignedIn>
            {/* План-чип (скрыт на очень маленьких экранах) */}
            {subscriptionData && (
              <button
                onClick={() => setIsBillingOpen(true)}
                className="hidden sm:inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 sm:px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <span className="font-mono text-xs sm:text-sm">{subscriptionData.planName} • {formatEmissions(subscriptionData.monthlyUsage)} т CO₂</span>
                {isHighUsage(subscriptionData.monthlyUsage, subscriptionData.totalEmissions / 12) && (
                  <AlertTriangle className="ml-1 h-3 w-3 text-orange-500" />
                )}
              </button>
            )}

            {/* Индикатор очереди */}
            {queueData && queueData.count > 0 && (
              <button
                title={`${queueData.count} документов в обработке`}
                className="hidden sm:inline-flex items-center ml-2 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors animate-pulse"
              >
                <Zap className="w-3 h-3 mr-1" />
                <span className="text-xs">{queueData.count}</span>
              </button>
            )}

            {/* Переключатель темы */}
            <div className="ml-2 sm:ml-3">
              <ThemeToggle />
            </div>

            {/* Кнопка создать отчет - адаптивная */}
            <Link
              href="/create-report"
              className="ml-2 sm:ml-3 hidden md:inline-flex"
              title="Создать новый отчёт"
            >
              <button className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-sm hover:shadow-md">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </Link>

            {/* Аватар с улучшенным меню */}
            <div className="ml-2 sm:ml-3">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-7 h-7 sm:w-8 sm:h-8',
                  }
                }}
                afterSignOutUrl="/"
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Настройки"
                    labelIcon={<Settings className="h-4 w-4" />}
                    href="/settings"
                  />
                  <UserButton.Link
                    label="Справка"
                    labelIcon={<HelpCircle className="h-4 w-4" />}
                    href="/help"
                  />
                  <UserButton.Action
                    label="Управление счётом"
                    labelIcon={<BarChart3 className="h-4 w-4" />}
                    onClick={() => setIsBillingOpen(true)}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>

            {/* Мобильное бургер-меню */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Открыть меню"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
              className="ml-2 lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
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
        </div>

        {/* Мобильное меню (улучшенное согласно аудиту) */}
        <SignedIn>
          {isMobileMenuOpen && (
            <div id="mobile-nav" className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <div className="px-4 py-3 space-y-2">
                
                {/* План и очередь в мобильном меню */}
                <div className="flex items-center justify-between pb-2">
                  {subscriptionData && (
                    <button
                      onClick={() => {
                        setIsBillingOpen(true)
                        setIsMobileMenuOpen(false)
                      }}
                      className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      <span className="font-mono">{subscriptionData.planName} • {formatEmissions(subscriptionData.monthlyUsage)} т CO₂</span>
                      {isHighUsage(subscriptionData.monthlyUsage, subscriptionData.totalEmissions / 12) && (
                        <AlertTriangle className="ml-1 h-3 w-3 text-orange-500" />
                      )}
                    </button>
                  )}
                  
                  {queueData && queueData.count > 0 && (
                    <div className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 animate-pulse">
                      <Zap className="w-3 h-3 mr-1" />
                      <span>{queueData.count}</span>
                    </div>
                  )}
                </div>

                {/* Основные пункты меню */}
                {mainNavItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveLink(href)
                        ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
                
                {/* Разделитель и заголовок Settings */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Settings
                  </h3>
                </div>
                
                {/* Настройки */}
                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Настройки</span>
                </Link>

                {/* Создать отчёт для мобильных */}
                <Link
                  href="/create-report"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Новый отчёт</span>
                </Link>
              </div>
            </div>
          )}
        </SignedIn>
      </header>

      {/* Billing Drawer */}
      <BillingDrawer 
        isOpen={isBillingOpen} 
        onClose={() => setIsBillingOpen(false)} 
      />
    </>
  )
} 