"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ToastDisplay } from '@/components/ui/toast-display'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { ...toast, id }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto dismiss after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value: ToastContextType = {
    toasts,
    toast,
    dismiss
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastDisplay toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
} 