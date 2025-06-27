'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useAuth, SignupData } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const [activeTab, setActiveTab] = useState<'rapper' | 'studio'>('rapper')
  const [formData, setFormData] = useState({
    rapper: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    },
    studio: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      studioName: '',
      phoneNumber: ''
    }
  })
  const [loading, setLoading] = useState(false)
  
  const { signup } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (userType: 'rapper' | 'studio', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [userType]: {
        ...prev[userType],
        [field]: value
      }
    }))
  }

  const validateForm = (userType: 'rapper' | 'studio') => {
    const data = formData[userType]
    
    if (!data.email || !data.password || !data.confirmPassword || !data.firstName || !data.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return false
    }

    if (data.password !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return false
    }

    if (data.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return false
    }

    if (userType === 'studio' && !(data as any).studioName) {
      toast({
        title: "Error",
        description: "Studio name is required",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (userType: 'rapper' | 'studio') => {
    if (!validateForm(userType)) return

    const data = formData[userType]
    const signupData: SignupData = {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      name: `${data.firstName} ${data.lastName}`.trim(),
      role: userType,
      ...(userType === 'studio' && { 
        studioName: (data as any).studioName,
        phone: (data as any).phoneNumber 
      })
    }

    try {
      setLoading(true)
      const result = await signup(signupData)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Account created successfully!",
        })
        
        // Redirect based on user type
        if (userType === 'rapper') {
          router.push('/dashboard')
        } else {
          router.push('/studio-dashboard')
        }
      } else if (result.redirectToLogin) {
        // Redirect to login page after a short delay with a parameter
        setTimeout(() => {
          router.push('/login?from=signup&email=' + encodeURIComponent(signupData.email))
        }, 2000)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async (userType: 'rapper' | 'studio') => {
    // TODO: Implement Google OAuth integration
    toast({
      title: "Coming Soon",
      description: "Google signup will be available soon!",
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
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Choose your account type to get started</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'rapper' | 'studio')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rapper">Rapper</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
          </TabsList>

          <TabsContent value="rapper">
            <Card>
              <CardHeader>
                <CardTitle>Rapper Signup</CardTitle>
                <CardDescription>Create an account to find and book recording studios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('rapper'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rapper-firstName">First Name</Label>
                      <Input 
                        id="rapper-firstName"
                        type="text"
                        value={formData.rapper.firstName}
                        onChange={(e) => handleInputChange('rapper', 'firstName', e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rapper-lastName">Last Name</Label>
                      <Input 
                        id="rapper-lastName"
                        type="text"
                        value={formData.rapper.lastName}
                        onChange={(e) => handleInputChange('rapper', 'lastName', e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
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
                    <Label htmlFor="rapper-password">Password</Label>
                    <Input 
                      id="rapper-password" 
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.rapper.password}
                      onChange={(e) => handleInputChange('rapper', 'password', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rapper-confirmPassword">Confirm Password</Label>
                    <Input 
                      id="rapper-confirmPassword" 
                      type="password"
                      value={formData.rapper.confirmPassword}
                      onChange={(e) => handleInputChange('rapper', 'confirmPassword', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Rapper Account'
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
                  onClick={() => handleGoogleSignup('rapper')}
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
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="studio">
            <Card>
              <CardHeader>
                <CardTitle>Studio Signup</CardTitle>
                <CardDescription>Create an account to list your recording studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit('studio'); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studio-firstName">First Name</Label>
                      <Input 
                        id="studio-firstName"
                        type="text"
                        value={formData.studio.firstName}
                        onChange={(e) => handleInputChange('studio', 'firstName', e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studio-lastName">Last Name</Label>
                      <Input 
                        id="studio-lastName"
                        type="text"
                        value={formData.studio.lastName}
                        onChange={(e) => handleInputChange('studio', 'lastName', e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studio-studioName">Studio Name</Label>
                    <Input 
                      id="studio-studioName"
                      type="text"
                      placeholder="Your Studio Name"
                      value={formData.studio.studioName}
                      onChange={(e) => handleInputChange('studio', 'studioName', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
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
                    <Label htmlFor="studio-phoneNumber">Phone Number (Optional)</Label>
                    <Input 
                      id="studio-phoneNumber"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.studio.phoneNumber}
                      onChange={(e) => handleInputChange('studio', 'phoneNumber', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studio-password">Password</Label>
                    <Input 
                      id="studio-password" 
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.studio.password}
                      onChange={(e) => handleInputChange('studio', 'password', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studio-confirmPassword">Confirm Password</Label>
                    <Input 
                      id="studio-confirmPassword" 
                      type="password"
                      value={formData.studio.confirmPassword}
                      onChange={(e) => handleInputChange('studio', 'confirmPassword', e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Studio Account'
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
                  onClick={() => handleGoogleSignup('studio')}
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
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
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