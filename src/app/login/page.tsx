'use client'

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

function LoginPageContent() {
  const [activeTab, setActiveTab] = useState<'rapper' | 'studio'>('rapper')
  const [formData, setFormData] = useState({
    rapper: { email: '', password: '' },
    studio: { email: '', password: '' }
  })
  const [loading, setLoading] = useState(false)
  const [showSignupMessage, setShowSignupMessage] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Handle redirect from signup
  useEffect(() => {
    const fromSignup = searchParams.get('from') === 'signup'
    const email = searchParams.get('email')
    
    if (fromSignup && email) {
      setShowSignupMessage(true)
      // Pre-fill email in both forms
      setFormData(prev => ({
        rapper: { ...prev.rapper, email: decodeURIComponent(email) },
        studio: { ...prev.studio, email: decodeURIComponent(email) }
      }))
      
      toast({
        title: "Email Already Registered",
        description: "Please log in with your existing account.",
        variant: "default"
      })
    }
  }, [searchParams, toast])

  const handleInputChange = (userType: 'rapper' | 'studio', field: 'email' | 'password', value: string) => {
    setFormData(prev => ({
      ...prev,
      [userType]: {
        ...prev[userType],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (userType: 'rapper' | 'studio') => {
    const { email, password } = formData[userType]
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      await login(email, password, userType)
      
      toast({
        title: "Success",
        description: "Logged in successfully!",
      })
      
      // Redirect based on user type
      if (userType === 'rapper') {
        router.push('/dashboard')
      } else {
        router.push('/studio-dashboard')
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (userType: 'rapper' | 'studio') => {
    // TODO: Implement Google OAuth integration
    toast({
      title: "Coming Soon",
      description: "Google login will be available soon!",
    })
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-8 px-4 md:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex items-center justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold">HitConnector</span>
            </Link>
          </div>
          <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Enter your email below to login to your account</p>
          </div>

          {showSignupMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800">
                <strong>Email already registered!</strong> Please log in with your existing account below.
              </p>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'rapper' | 'studio')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rapper">Rapper</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
          </TabsList>

          <TabsContent value="rapper">
            <Card>
              <CardHeader>
                <CardTitle>Rapper Login</CardTitle>
                <CardDescription>Login to find and book the perfect studio for your next hit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('rapper'); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rapper-email">Email</Label>
                    <Input 
                      id="rapper-email" 
                      type="email" 
                      placeholder="name@example.com"
                      value={formData.rapper.email}
                      onChange={(e) => handleInputChange('rapper', 'email', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rapper-password">Password</Label>
                      <Link href="/auth/reset-password" className="text-xs text-muted-foreground hover:text-primary">
                        Forgot password?
                      </Link>
                    </div>
                    <Input 
                      id="rapper-password" 
                      type="password"
                      value={formData.rapper.password}
                      onChange={(e) => handleInputChange('rapper', 'password', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleGoogleLogin('rapper')}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col items-center justify-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="studio">
            <Card>
              <CardHeader>
                <CardTitle>Studio Login</CardTitle>
                <CardDescription>Login to manage your studio profile and bookings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('studio'); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studio-email">Email</Label>
                    <Input 
                      id="studio-email" 
                      type="email" 
                      placeholder="studio@example.com"
                      value={formData.studio.email}
                      onChange={(e) => handleInputChange('studio', 'email', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="studio-password">Password</Label>
                      <Link href="/auth/reset-password" className="text-xs text-muted-foreground hover:text-primary">
                        Forgot password?
                      </Link>
                    </div>
                    <Input 
                      id="studio-password" 
                      type="password"
                      value={formData.studio.password}
                      onChange={(e) => handleInputChange('studio', 'password', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleGoogleLogin('studio')}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col items-center justify-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}