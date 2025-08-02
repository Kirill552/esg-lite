'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast } from './Notification'

interface NotificationItem {
  id: string
  variant: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description?: string
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: NotificationItem[]
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string
  removeNotification: (id: string) => void
  clearAll: () => void
  success: (title: string, description?: string, options?: Partial<NotificationItem>) => string
  error: (title: string, description?: string, options?: Partial<NotificationItem>) => string
  warning: (title: string, description?: string, options?: Partial<NotificationItem>) => string
  info: (title: string, description?: string, options?: Partial<NotificationItem>) => string
}

const NotificationContext = createContext<NotificationContextType | null>(null)

interface NotificationProviderProps {
  children: ReactNode
  maxNotifications?: number
  defaultDuration?: number
  defaultPosition?: NotificationItem['position']
}

export function NotificationProvider({ 
  children, 
  maxNotifications = 5,
  defaultDuration = 5000,
  defaultPosition = 'top-right'
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = generateId()
    const newNotification: NotificationItem = {
      id,
      duration: defaultDuration,
      position: defaultPosition,
      ...notification,
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications)
      return updated
    })

    // Автоматическое удаление через заданное время
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [generateId, defaultDuration, defaultPosition, maxNotifications])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const success = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'success',
      title,
      description,
      ...options,
    })
  }, [addNotification])

  const error = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'error',
      title,
      description,
      duration: 0, // Ошибки не исчезают автоматически
      ...options,
    })
  }, [addNotification])

  const warning = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'warning',
      title,
      description,
      ...options,
    })
  }, [addNotification])

  const info = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'info',
      title,
      description,
      ...options,
    })
  }, [addNotification])

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  }

  // Группируем уведомления по позициям
  const notificationsByPosition = notifications.reduce((acc, notification) => {
    const position = notification.position || defaultPosition
    if (!acc[position]) {
      acc[position] = []
    }
    acc[position].push(notification)
    return acc
  }, {} as Record<string, NotificationItem[]>)

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Рендерим Toast уведомления */}
      {Object.entries(notificationsByPosition).map(([position, items]) => (
        <div key={position}>
          {items.map((notification) => (
            <Toast
              key={notification.id}
              variant={notification.variant}
              title={notification.title}
              description={notification.description}
              position={position as NotificationItem['position']}
              action={notification.action}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      ))}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Хук для простого использования уведомлений
export function useToast() {
  const { success, error, warning, info } = useNotifications()
  
  return {
    toast: {
      success,
      error,
      warning,
      info,
    }
  }
}
