import { HTMLAttributes, forwardRef, createElement } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
  as?: 'div' | 'article' | 'section' // Семантические HTML элементы
  role?: string
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, as: Component = 'div', ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-shadow duration-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2'
    
    const variants = {
      default: 'bg-white shadow-card',
      elevated: 'bg-white shadow-card-hover',
      outlined: 'bg-white border border-gray-200',
    }
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <Component
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

// Дополнительные компоненты для структурирования карточки
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4 pb-2 border-b border-gray-100', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6 // Уровень заголовка для правильной семантики
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, level = 3, ...props }, ref) => {
    return createElement(
      `h${level}`,
      {
        ref,
        className: cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className),
        ...props
      },
      children
    )
  }
)

CardTitle.displayName = 'CardTitle'

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-gray-600', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mt-4 pt-4 border-t border-gray-100', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardContent, CardFooter } 