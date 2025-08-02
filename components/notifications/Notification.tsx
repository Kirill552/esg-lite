import { HTMLAttributes, forwardRef } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AccessibleIcon } from '@/components/ui/AccessibleIcon'

interface NotificationProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description?: string
  onClose?: () => void
  closable?: boolean
  persistent?: boolean // Уведомление не исчезает автоматически
  action?: {
    label: string
    onClick: () => void
  }
}

const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  ({ 
    className, 
    variant = 'info', 
    title, 
    description, 
    onClose, 
    closable = true,
    persistent = false,
    action,
    children,
    ...props 
  }, ref) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
    }
    
    const variants = {
      success: {
        container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        title: 'text-green-800 dark:text-green-200',
        description: 'text-green-700 dark:text-green-300',
        button: 'text-green-600 hover:bg-green-100 dark:hover:bg-green-800/30',
        close: 'text-green-500 hover:bg-green-100 dark:hover:bg-green-800/30',
        action: 'bg-green-600 hover:bg-green-700 text-white',
      },
      error: {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-800 dark:text-red-200',
        description: 'text-red-700 dark:text-red-300',
        button: 'text-red-600 hover:bg-red-100 dark:hover:bg-red-800/30',
        close: 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800/30',
        action: 'bg-red-600 hover:bg-red-700 text-white',
      },
      warning: {
        container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        title: 'text-yellow-800 dark:text-yellow-200',
        description: 'text-yellow-700 dark:text-yellow-300',
        button: 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800/30',
        close: 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800/30',
        action: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      },
      info: {
        container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-800 dark:text-blue-200',
        description: 'text-blue-700 dark:text-blue-300',
        button: 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/30',
        close: 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800/30',
        action: 'bg-blue-600 hover:bg-blue-700 text-white',
      },
    }
    
    const Icon = icons[variant]
    const styles = variants[variant]

    return (
      <div
        ref={ref}
        className={cn(
          'border rounded-lg p-4 shadow-sm',
          styles.container,
          className
        )}
        role="alert"
        aria-live={variant === 'error' ? 'assertive' : 'polite'}
        {...props}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <AccessibleIcon
              icon={Icon}
              className={cn('w-5 h-5', styles.icon)}
              decorative
            />
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={cn('text-sm font-medium mb-1', styles.title)}>
                {title}
              </h3>
            )}
            
            {description && (
              <div className={cn('text-sm', styles.description)}>
                {description}
              </div>
            )}
            
            {children && (
              <div className={cn('text-sm mt-2', styles.description)}>
                {children}
              </div>
            )}
            
            {action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current',
                    styles.action
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          
          {closable && onClose && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'inline-flex rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current',
                    styles.close
                  )}
                  aria-label="Закрыть уведомление"
                >
                  <AccessibleIcon
                    icon={X}
                    className="w-5 h-5"
                    label="Закрыть"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

Notification.displayName = 'Notification'

// Toast уведомление для временного показа
interface ToastProps extends Omit<NotificationProps, 'persistent'> {
  duration?: number // Длительность показа в миллисекундах
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  onAutoClose?: () => void
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    className, 
    duration = 5000, 
    position = 'top-right',
    onAutoClose,
    onClose,
    ...props 
  }, ref) => {
    const positions = {
      'top-right': 'fixed top-4 right-4 z-50',
      'top-left': 'fixed top-4 left-4 z-50',
      'bottom-right': 'fixed bottom-4 right-4 z-50',
      'bottom-left': 'fixed bottom-4 left-4 z-50',
      'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
      'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
    }

    return (
      <div className={positions[position]}>
        <Notification
          ref={ref}
          className={cn(
            'min-w-[320px] max-w-md shadow-lg animate-in slide-in-from-top-2 duration-300',
            className
          )}
          onClose={onClose || onAutoClose}
          persistent={false}
          {...props}
        />
      </div>
    )
  }
)

Toast.displayName = 'Toast'

export { Notification, Toast }
