import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastType } from '../components/ui/Toast'

interface ToastContextType {
  toasts: Toast[]
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    type: ToastType,
    message: string,
    title?: string,
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: Toast = {
      id,
      type,
      message,
      title,
      duration
    }

    setToasts((prev) => [...prev, newToast])
  }, [])

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast('success', message, title)
  }, [showToast])

  const showError = useCallback((message: string, title?: string) => {
    showToast('error', message, title, 7000) // Errors stay longer
  }, [showToast])

  const showWarning = useCallback((message: string, title?: string) => {
    showToast('warning', message, title)
  }, [showToast])

  const showInfo = useCallback((message: string, title?: string) => {
    showToast('info', message, title)
  }, [showToast])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
