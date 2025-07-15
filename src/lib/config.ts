// API configuration for Next.js API routes
export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000') 