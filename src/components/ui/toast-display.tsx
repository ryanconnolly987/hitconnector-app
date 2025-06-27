"use client"

import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Toast } from '@/hooks/use-toast'

interface ToastDisplayProps {
  toasts: Toast[]
  dismiss: (id: string) => void
}

export function ToastDisplay({ toasts, dismiss }: ToastDisplayProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "min-w-[300px] rounded-lg border p-4 shadow-lg transition-all duration-300",
            "bg-background text-foreground",
            toast.variant === 'destructive' 
              ? "border-destructive/50 text-destructive" 
              : "border-border"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold mb-1">{toast.title}</div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
} 