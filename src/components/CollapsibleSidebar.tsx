"use client"

import { useState, useEffect, ReactNode } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CollapsibleSidebarProps {
  children: ReactNode
  className?: string
}

export function CollapsibleSidebar({ children, className }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setCollapsed(savedState === 'true')
    }
    setMounted(true)
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className={cn("w-64 bg-white border-r min-h-screen transition-all duration-300", className)}>
        <div className="p-4">
          {children}
        </div>
      </aside>
    )
  }

  return (
    <aside 
      className={cn(
        "bg-white border-r min-h-screen transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 -right-3 z-10 bg-white border border-border shadow-sm hover:shadow-md"
        onClick={toggleCollapsed}
      >
        {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </Button>

      {/* Sidebar Content */}
      <div className={cn("p-4 transition-all duration-300", collapsed && "px-2")}>
        <div className={cn(
          "transition-all duration-300",
          collapsed && "opacity-0 pointer-events-none"
        )}>
          {children}
        </div>
        
        {/* Collapsed state icons only */}
        {collapsed && (
          <div className="flex flex-col items-center space-y-4 mt-8">
            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
              <span className="text-xs font-bold text-primary">HC</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

// Hook for sidebar state management
export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setCollapsed(savedState === 'true')
    }
    setMounted(true)
  }, [])

  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  return { collapsed, toggleCollapsed, mounted }
} 