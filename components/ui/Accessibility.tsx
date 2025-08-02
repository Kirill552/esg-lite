'use client'

import { useEffect } from 'react'

/**
 * Хук для улучшения видимости фокуса на интерактивных элементах
 * Добавляет визуальные индикаторы для навигации с клавиатуры
 */
export function useFocusVisible() {
  useEffect(() => {
    let hadKeyboardEvent = false
    
    // Отслеживаем использование клавиатуры
    const keyboardThrottleTimeout = 100
    let keyboardThrottleTimer: NodeJS.Timeout
    
    function detectKeyboard(e: KeyboardEvent) {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return
      }
      
      switch (e.key) {
        case 'Tab':
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          hadKeyboardEvent = true
          break
      }
    }
    
    function onKeyDown(e: KeyboardEvent) {
      detectKeyboard(e)
      
      clearTimeout(keyboardThrottleTimer)
      keyboardThrottleTimer = setTimeout(() => {
        hadKeyboardEvent = false
      }, keyboardThrottleTimeout)
    }
    
    function onMouseDown() {
      hadKeyboardEvent = false
    }
    
    function onFocus(e: FocusEvent) {
      const target = e.target as HTMLElement
      
      if (hadKeyboardEvent) {
        target.classList.add('focus-visible')
      } else {
        target.classList.remove('focus-visible')
      }
    }
    
    function onBlur(e: FocusEvent) {
      const target = e.target as HTMLElement
      target.classList.remove('focus-visible')
    }
    
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('focus', onFocus, true)
    document.addEventListener('blur', onBlur, true)
    
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('mousedown', onMouseDown, true)
      document.removeEventListener('focus', onFocus, true)
      document.removeEventListener('blur', onBlur, true)
      clearTimeout(keyboardThrottleTimer)
    }
  }, [])
}

/**
 * Компонент-обертка для добавления skip links
 */
interface SkipLinkProps {
  targetId: string
  children: string
  className?: string
}

export function SkipLink({ targetId, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-emerald-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all ${className}`}
    >
      {children}
    </a>
  )
}

/**
 * Хук для объявления областей для screen readers
 */
export function useAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
  
  return announce
}

/**
 * Компонент для доступного текста (screen reader only)
 */
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export function ScreenReaderOnly({ children, className = '' }: ScreenReaderOnlyProps) {
  return (
    <span className={`sr-only ${className}`}>
      {children}
    </span>
  )
}

/**
 * Улучшенный лейбл для форм
 */
interface AccessibleLabelProps {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function AccessibleLabel({ 
  htmlFor, 
  children, 
  required = false, 
  className = '' 
}: AccessibleLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="обязательное поле">
          *
        </span>
      )}
    </label>
  )
}

/**
 * Хук для ловушки фокуса внутри элемента
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return

    const element = ref.current
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey as any)
    return () => element.removeEventListener('keydown', handleTabKey as any)
  }, [ref, isActive])
}

/**
 * Хук для предотвращения прокрутки страницы
 */
export function usePreventScroll(shouldPrevent: boolean) {
  useEffect(() => {
    if (!shouldPrevent) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [shouldPrevent])
}