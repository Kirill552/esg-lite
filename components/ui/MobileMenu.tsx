'use client'

import { 
  ReactNode, 
  HTMLAttributes, 
  forwardRef, 
  useState, 
  useEffect, 
  useRef,
  KeyboardEvent
} from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AccessibleIcon } from '@/components/ui/AccessibleIcon'
import { useFocusTrap, usePreventScroll } from '@/components/ui/Accessibility'

interface MobileMenuProps extends HTMLAttributes<HTMLDivElement> {
  trigger?: ReactNode
  children: ReactNode
  side?: 'left' | 'right'
  closeOnItemClick?: boolean
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  preventScroll?: boolean
  ariaLabel?: string
}

const MobileMenu = forwardRef<HTMLDivElement, MobileMenuProps>(
  ({
    trigger,
    children,
    side = 'right',
    closeOnItemClick = true,
    closeOnOutsideClick = true,
    closeOnEscape = true,
    preventScroll = true,
    ariaLabel = 'Мобильное меню',
    className,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    // Управление фокусом и прокруткой
    useFocusTrap(menuRef as React.RefObject<HTMLElement>, isOpen)
    usePreventScroll(isOpen && preventScroll)

    const openMenu = () => setIsOpen(true)
    const closeMenu = () => setIsOpen(false)

    // Закрытие по Escape
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          closeMenu()
          triggerRef.current?.focus()
        }
      }

      document.addEventListener('keydown', handleEscape as any)
      return () => document.removeEventListener('keydown', handleEscape as any)
    }, [isOpen, closeOnEscape])

    // Закрытие при клике вне меню
    useEffect(() => {
      if (!isOpen || !closeOnOutsideClick) return

      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          !triggerRef.current?.contains(event.target as Node)
        ) {
          closeMenu()
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, closeOnOutsideClick])

    const handleItemClick = () => {
      if (closeOnItemClick) {
        closeMenu()
      }
    }

    const sideClasses = {
      left: {
        container: 'left-0',
        menu: 'animate-in slide-in-from-left-full',
      },
      right: {
        container: 'right-0',
        menu: 'animate-in slide-in-from-right-full',
      },
    }

    return (
      <>
        {/* Trigger button */}
        {trigger || (
          <button
            ref={triggerRef}
            type="button"
            onClick={openMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-colors duration-200"
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label={ariaLabel}
          >
            <AccessibleIcon
              icon={isOpen ? X : Menu}
              className="w-6 h-6"
              label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
            />
          </button>
        )}

        {/* Overlay and Menu */}
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/25 backdrop-blur-sm transition-opacity duration-300"
              aria-hidden="true"
            />

            {/* Menu container */}
            <div className={cn('fixed inset-y-0 flex max-w-xs w-full', sideClasses[side].container)}>
              <div
                ref={menuRef}
                className={cn(
                  'relative flex flex-col flex-1 bg-white dark:bg-gray-900 shadow-xl',
                  sideClasses[side].menu,
                  className
                )}
                role="navigation"
                aria-label={ariaLabel}
                tabIndex={-1}
                {...props}
              >
                {/* Close button */}
                <div className="absolute top-1 right-1 -mr-14">
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="flex items-center justify-center w-12 h-12 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
                    aria-label="Закрыть меню"
                  >
                    <AccessibleIcon
                      icon={X}
                      className="w-6 h-6 text-white"
                      label="Закрыть"
                    />
                  </button>
                </div>

                {/* Menu content */}
                <div 
                  className="flex-1 h-0 pt-5 pb-4 overflow-y-auto"
                  onClick={handleItemClick}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
)

MobileMenu.displayName = 'MobileMenu'

// Компоненты для структурирования мобильного меню
interface MobileMenuHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const MobileMenuHeader = forwardRef<HTMLDivElement, MobileMenuHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-5 pb-4 border-b border-gray-200 dark:border-gray-700', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

MobileMenuHeader.displayName = 'MobileMenuHeader'

interface MobileMenuSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  children: ReactNode
}

const MobileMenuSection = forwardRef<HTMLDivElement, MobileMenuSectionProps>(
  ({ title, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('py-4', className)}
        {...props}
      >
        {title && (
          <h3 className="px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {title}
          </h3>
        )}
        <div className="space-y-1">
          {children}
        </div>
      </div>
    )
  }
)

MobileMenuSection.displayName = 'MobileMenuSection'

interface MobileMenuItemProps extends HTMLAttributes<HTMLElement> {
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  active?: boolean
  children: ReactNode
  external?: boolean
}

const MobileMenuItem = forwardRef<HTMLElement, MobileMenuItemProps>(
  ({ href, icon: Icon, active = false, children, external = false, className, onClick, ...props }, ref) => {
    const baseClasses = cn(
      'group flex items-center px-5 py-3 text-base font-medium transition-colors duration-200',
      active
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-r-4 border-emerald-500 text-emerald-700 dark:text-emerald-300'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
      className
    )

    const content = (
      <>
        {Icon && (
          <Icon
            className={cn(
              'mr-4 w-6 h-6',
              active 
                ? 'text-emerald-500 dark:text-emerald-400' 
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
            )}
          />
        )}
        {children}
      </>
    )

    if (href) {
      return (
        <a
          ref={ref as React.RefObject<HTMLAnchorElement>}
          href={href}
          className={baseClasses}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
          {...props}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type="button"
        className={cn(baseClasses, 'w-full text-left')}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        {...props}
      >
        {content}
      </button>
    )
  }
)

MobileMenuItem.displayName = 'MobileMenuItem'

export { MobileMenu, MobileMenuHeader, MobileMenuSection, MobileMenuItem }
