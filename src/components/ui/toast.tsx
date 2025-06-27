'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & ToastProps
>(({ className, variant = 'default', title, description, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        variant === 'destructive'
          ? "border-destructive bg-destructive text-destructive-foreground"
          : variant === 'success' 
          ? "border-green-500 bg-green-50 text-green-900"
          : "border border-gray-200 bg-white text-gray-900",
        className
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title && (
          <div className="text-sm font-semibold">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90">
            {description}
          </div>
        )}
      </div>
    </div>
  )
})
Toast.displayName = "Toast"

export { Toast } 