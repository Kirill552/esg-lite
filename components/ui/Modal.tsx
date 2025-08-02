'use client'

import { 
  ReactNode, 
  HTMLAttributes, 
  forwardRef, 
  useEffect, 
  useRef,
  KeyboardEvent,
  MouseEvent
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AccessibleIcon } from '@/components/ui/AccessibleIcon'
import { useFocusTrap, usePreventScroll } from '@/components/ui/Accessibility'

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  centered?: boolean
  closable?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  initialFocus?: string // Селектор элемента для первоначального фокуса
  restoreFocus?: boolean
  preventScroll?: boolean
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    centered = true,
    closable = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    initialFocus,
    restoreFocus = true,
    preventScroll = true,
    className,
    ...props
  }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<HTMLElement | null>(null)

    // Управление фокусом
    useFocusTrap(modalRef as React.RefObject<HTMLElement>, isOpen)
    
    // Предотвращение прокрутки
    usePreventScroll(isOpen && preventScroll)

    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4',
    }

    // Обработка закрытия по Escape
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape as any)
      return () => document.removeEventListener('keydown', handleEscape as any)
    }, [isOpen, closeOnEscape, onClose])

    // Сохранение и восстановление фокуса
    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement
        
        // Устанавливаем фокус на указанный элемент или модальное окно
        const focusElement = initialFocus 
          ? modalRef.current?.querySelector(initialFocus) as HTMLElement
          : modalRef.current

        if (focusElement) {
          setTimeout(() => focusElement.focus(), 100)
        }
      } else if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }, [isOpen, initialFocus, restoreFocus])

    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose()
      }
    }

    if (!isOpen) return null

    const modalContent = (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity duration-300"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Modal container */}
        <div
          className={cn(
            'relative min-h-full flex',
            centered ? 'items-center justify-center p-4' : 'items-start justify-center pt-16 p-4'
          )}
        >
          <div
            ref={modalRef}
            className={cn(
              'relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full transform transition-all duration-300',
              sizes[size],
              className
            )}
            tabIndex={-1}
            {...props}
          >
            {/* Header */}
            {(title || closable) && (
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex-1">
                  {title && (
                    <h2 
                      id="modal-title"
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p 
                      id="modal-description"
                      className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {description}
                    </p>
                  )}
                </div>
                
                {closable && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-4 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
                    aria-label="Закрыть модальное окно"
                  >
                    <AccessibleIcon
                      icon={X}
                      className="w-6 h-6"
                      label="Закрыть"
                    />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn(
              'px-6',
              title || closable ? 'pb-6' : 'py-6'
            )}>
              {children}
            </div>
          </div>
        </div>
      </div>
    )

    // Рендерим в портал для правильного наложения
    return createPortal(modalContent, document.body)
  }
)

Modal.displayName = 'Modal'

// Компоненты для структурирования модального окна
interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalHeader.displayName = 'ModalHeader'

interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalBody.displayName = 'ModalBody'

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalFooter.displayName = 'ModalFooter'

export { Modal, ModalHeader, ModalBody, ModalFooter }
