"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'

// Types

interface User {
  id: string
  email: string
  name: string
  role: 'rapper' | 'studio'
  slug?: string
  avatar?: string
  studioId?: string
}

export interface SignupData {
  email: string
  password: string
  confirmPassword: string
  name: string
  role: 'rapper' | 'studio'
  studioName?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: 'rapper' | 'studio') => Promise<boolean>
  signup: (data: SignupData) => Promise<{ success: boolean; redirectToLogin?: boolean }>
  logout: () => void
  updateUser: (updatedUser: User) => void
  loading: boolean
}

// API Client
export class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    console.log('Making API request to:', url)
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('API Response data:', result)
    return result
  }

  async login(email: string, password: string, role: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    })
  }

  async signup(data: SignupData) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request('/api/auth/me')
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API client instance
const apiClient = new ApiClient()

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Safe toast hook usage
  let toast: any
  try {
    const toastHook = useToast()
    toast = toastHook.toast
  } catch (error) {
    // Fallback if toast context is not available
    toast = (message: any) => console.log('Toast:', message)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Check for existing session
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
    
    setLoading(false)
  }, [mounted])

  const login = async (email: string, password: string, role: 'rapper' | 'studio'): Promise<boolean> => {
    if (!mounted) return false
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      })

      if (response.ok) {
        const data = await response.json()
        const userData = {
          ...data.user,
          studioId: data.studioId  // Store studioId if provided
        }
        setUser(userData)
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${userData.name}`,
        })
        
        return true
      } else {
        const errorData = await response.json()
        toast({
          title: "Login Failed",
          description: errorData.error || "Invalid credentials",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Network error. Please try again.",
        variant: "destructive"
      })
      return false
    }
  }

  const signup = async (data: SignupData): Promise<{ success: boolean; redirectToLogin?: boolean }> => {
    if (!mounted) return { success: false }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        const userData = {
          ...result.user,
          studioId: result.studioId  // Store studioId if provided
        }
        setUser(userData)
        localStorage.setItem('auth_token', result.token)
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        toast({
          title: "Account Created!",
          description: `Welcome to HitConnector, ${userData.name}!`,
        })
        
        return { success: true }
      } else {
        if (result.error?.includes('already exists')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please login instead.",
            variant: "destructive"
          })
          return { success: false, redirectToLogin: true }
        }
        
        toast({
          title: "Signup Failed",
          description: result.error || "Failed to create account",
          variant: "destructive"
        })
        return { success: false }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Network error. Please try again.",
        variant: "destructive"
      })
      return { success: false }
    }
  }

  const logout = () => {
    // Clear user-specific studio data if user exists
    if (user) {
      const userKey = user.email || user.id
      localStorage.removeItem(`studioProfileData_${userKey}`)
      localStorage.removeItem(`studioRoomsData_${userKey}`)
      localStorage.removeItem(`studioStaffData_${userKey}`)
    }
    
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('studioProfile') // Clear general studio profile too
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user_data', JSON.stringify(updatedUser))
  }

  // Don't render children until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 