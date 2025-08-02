'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccessibleIconProps {
  icon: LucideIcon
  label?: string // Описание иконки для screen readers
  decorative?: boolean // Является ли иконка декоративной (aria-hidden="true")
  className?: string
  size?: number
}

export function AccessibleIcon({ 
  icon: Icon, 
  label, 
  decorative = false, 
  className,
  size = 20
}: AccessibleIconProps) {
  const iconProps = decorative 
    ? { 'aria-hidden': 'true' as const }
    : { 'aria-label': label || 'Иконка', role: 'img' as const }

  return (
    <Icon
      className={cn('flex-shrink-0', className)}
      size={size}
      {...iconProps}
    />
  )
}

// Компонент для интерактивных иконок (кнопки)
interface IconButtonProps {
  icon: LucideIcon
  label: string // Обязательный для кнопок
  onClick?: () => void
  className?: string
  size?: number
  variant?: 'default' | 'ghost' | 'destructive'
  disabled?: boolean
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  className,
  size = 20,
  variant = 'default',
  disabled = false
}: IconButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    default: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
    ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:ring-gray-500 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800',
    destructive: 'text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-red-500 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
  }

  const padding = size <= 16 ? 'p-1' : size <= 20 ? 'p-1.5' : 'p-2'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        padding,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={label}
      title={label}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  )
}

export { AccessibleIcon as Icon, IconButton }
