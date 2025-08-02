import { InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helperText?: string
  error?: string
  variant?: 'default' | 'outlined' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    helperText, 
    error, 
    variant = 'default', 
    size = 'md', 
    fullWidth = false,
    leftIcon,
    rightIcon,
    id,
    disabled,
    required,
    ...props 
  }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const helperTextId = helperText ? `${inputId}-helper` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    
    const baseStyles = 'border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
    
    const variants = {
      default: 'bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white',
      outlined: 'bg-transparent border-2',
      filled: 'bg-gray-50 dark:bg-gray-700 border-transparent',
    }
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg',
    }
    
    const errorStyles = error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : ''
    
    const wrapperStyles = cn(
      'relative',
      fullWidth ? 'w-full' : 'w-auto'
    )
    
    const inputStyles = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      errorStyles,
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      fullWidth && 'w-full',
      className
    )

    return (
      <div className={wrapperStyles}>
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
              required && "after:content-['*'] after:text-red-500 after:ml-1"
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className={cn(
                'w-5 h-5',
                error ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
              )}>
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputStyles}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              helperTextId && !error && helperTextId,
              errorId && errorId
            ) || undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className={cn(
                'w-5 h-5',
                error ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
              )}>
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={errorId}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={helperTextId}
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
