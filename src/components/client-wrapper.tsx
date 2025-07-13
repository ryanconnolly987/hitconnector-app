'use client'

import { Suspense, ReactNode } from 'react'
import ErrorBoundary from './error-boundary'

interface ClientWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  )
}

export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <DefaultFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default ClientWrapper 