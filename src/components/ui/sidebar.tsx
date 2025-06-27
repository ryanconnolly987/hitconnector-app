"use client"

import { ReactNode } from "react"

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      {children}
    </aside>
  )
}

export function SidebarHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 text-lg font-semibold">{children}</div>
}

export function SidebarContent({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>
}

export function SidebarFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto pt-4 border-t">{children}</div>
}

export function SidebarMenu({ children }: { children: ReactNode }) {
  return <ul>{children}</ul>
}

export function SidebarMenuItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>
}

export function SidebarMenuButton({
  children,
  isActive,
  asChild,
}: {
  children: ReactNode
  isActive?: boolean
  asChild?: boolean
}) {
  return (
    <button
      className={`w-full text-left p-2 rounded ${
        isActive ? "bg-primary text-white" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  )
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function SidebarInset({ children }: { children: ReactNode }) {
  return <main className="flex-1">{children}</main>
}