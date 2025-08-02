import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Скелетон загрузки
interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', width, height, animation = 'pulse', ...props }, ref) => {
    const baseStyles = 'bg-gray-200 dark:bg-gray-700'
    
    const variants = {
      text: 'rounded-sm',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-lg',
    }
    
    const animations = {
      pulse: 'animate-pulse',
      wave: 'animate-pulse', // В Tailwind нет встроенной wave анимации
      none: '',
    }
    
    const style = {
      width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          animations[animation],
          className
        )}
        style={style}
        role="status"
        aria-label="Загрузка контента"
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// Спиннер загрузки
interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  label?: string
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', label = 'Загрузка...', ...props }, ref) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    }
    
    const colors = {
      primary: 'text-emerald-600 dark:text-emerald-400',
      secondary: 'text-gray-600 dark:text-gray-400',
      white: 'text-white',
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        role="status"
        aria-label={label}
        {...props}
      >
        <svg
          className={cn(sizes[size], colors[color], 'animate-spin')}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

// Индикатор прогресса
interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'linear' | 'circular'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  label?: string
  showValue?: boolean
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    size = 'md', 
    variant = 'linear',
    color = 'primary',
    label,
    showValue = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizes = {
      sm: variant === 'linear' ? 'h-2' : 'w-8 h-8',
      md: variant === 'linear' ? 'h-3' : 'w-12 h-12',
      lg: variant === 'linear' ? 'h-4' : 'w-16 h-16',
    }
    
    const colors = {
      primary: 'bg-emerald-600 dark:bg-emerald-500',
      secondary: 'bg-gray-600 dark:bg-gray-500',
      success: 'bg-green-600 dark:bg-green-500',
      warning: 'bg-yellow-600 dark:bg-yellow-500',
      error: 'bg-red-600 dark:bg-red-500',
    }

    if (variant === 'circular') {
      const radius = 45
      const circumference = 2 * Math.PI * radius
      const strokeDashoffset = circumference - (percentage / 100) * circumference

      return (
        <div
          ref={ref}
          className={cn('relative inline-flex items-center justify-center', sizes[size], className)}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Прогресс: ${Math.round(percentage)}%`}
          {...props}
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={colors[color]}
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>
          {showValue && (
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Прогресс: ${Math.round(percentage)}%`}
        {...props}
      >
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
            {showValue && <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(percentage)}%</span>}
          </div>
        )}
        <div className={cn('bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizes[size])}>
          <div
            className={cn('h-full rounded-full transition-all duration-500 ease-out', colors[color])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Skeleton, Spinner, Progress }
