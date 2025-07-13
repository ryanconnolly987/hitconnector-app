import { useEffect, useRef, useState } from 'react'

// Utility to safely handle async operations in components
export function useAsyncOperation<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    
    const executeAsync = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await asyncFn()
        
        if (!cancelled && mountedRef.current) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
        }
      }
    }

    executeAsync()

    return () => {
      cancelled = true
    }
  }, deps)

  return { data, loading, error }
}

// Utility to handle async operations with proper error boundaries
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    if (onError) {
      onError(err)
    }
    console.error('Async operation failed:', err)
    return fallback
  }
}

// Utility to create a cancellable fetch
export function createCancellableFetch(url: string, options?: RequestInit) {
  const controller = new AbortController()
  
  const fetchPromise = fetch(url, {
    ...options,
    signal: controller.signal
  })

  return {
    promise: fetchPromise,
    cancel: () => controller.abort()
  }
}

// Utility to handle multiple async operations
export async function handleMultipleAsync<T>(
  operations: Array<() => Promise<T>>,
  onError?: (error: Error, index: number) => void
): Promise<Array<T | null>> {
  const results = await Promise.allSettled(operations.map(op => op()))
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      const error = result.reason instanceof Error ? result.reason : new Error('Unknown error')
      if (onError) {
        onError(error, index)
      }
      console.error(`Operation ${index} failed:`, error)
      return null
    }
  })
} 