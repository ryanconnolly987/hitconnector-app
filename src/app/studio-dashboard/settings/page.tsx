"use client"

import { useState, useEffect } from "react"

// Feature flag for subscription functionality
const STUDIO_SUBSCRIPTION_ENABLED = process.env.NEXT_PUBLIC_STUDIO_SUBSCRIPTION_ENABLED === 'true' || false;
import Link from "next/link"
import { ArrowLeft, Bell, Shield, CreditCard, User, Mail, Phone, Lock, Eye, EyeOff, Upload, Camera } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [accountData, setAccountData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studioName: "",
    bio: "",
    timezone: "America/Los_Angeles",
    language: "en",
    profileImage: ""
  })

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailMessages: true,
    emailMarketing: false,
    pushBookings: true,
    pushMessages: true,
    pushMarketing: false,
    smsBookings: false,
    smsMessages: false
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: "24"
  })

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  })

  // Load studio data on component mount
  useEffect(() => {
    const loadStudioData = async () => {
      if (!user?.email && !user?.id) {
        setLoading(false)
        return
      }
      
      try {
        console.time('loadSettingsData'); // start performance timing
        console.log('🔍 [Settings] Loading studio data for user:', { email: user.email, id: user.id })
        
        // Construct and log the URL being used
        const studiosUrl = `${API_BASE_URL}/api/studios`
        
        const response = await fetch(studiosUrl, {
          // Add timeout and caching headers for better performance
          signal: AbortSignal.timeout(10000), // 10 second timeout
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const userStudios = data.studios?.filter((studio: any) => 
            studio.owner === user.email || studio.owner === user.id
          )
          
          if (userStudios && userStudios.length > 0) {
            const studio = userStudios[0]
            
            console.log('✅ [Settings] Studio data loaded:', studio.name)
            
            // Parse studio name to extract first and last name if available
            const nameParts = studio.name ? studio.name.split(' ') : ['', '']
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''
            
            setAccountData({
              firstName,
              lastName,
              email: studio.email || user.email || '',
              phone: studio.phone || '',
              studioName: studio.name || '',
              bio: studio.description || '',
              timezone: "America/Los_Angeles", // Default, could be stored in studio data
              language: "en", // Default, could be stored in studio data
              profileImage: studio.profileImage || ''
            })
          } else {
            console.log('⚠️ [Settings] No studio found for user, using defaults')
            // No studio found, set defaults with user data
            setAccountData(prev => ({
              ...prev,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              email: user.email || '',
              studioName: ''
            }))
          }
        } else {
          console.warn('❌ [Settings] Failed to load studio data - Status:', response.status)
          // Set defaults with user data
          setAccountData(prev => ({
            ...prev,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            email: user.email || ''
          }))
        }
      } catch (error) {
        console.error('❌ [Settings] Error loading studio data:', error)
        // Set defaults with user data
        setAccountData(prev => ({
          ...prev,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || ''
        }))
      } finally {
        console.timeEnd('loadSettingsData'); // end performance timing
        setLoading(false)
      }
    }

    loadStudioData()
  }, [user?.id]) // optimized dependency array to prevent unnecessary rerenders

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      console.time('imageUploadProcess'); // added performance timing
      console.log('📤 [Settings] Starting image upload:', file.name, file.size)
      
      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        console.timeEnd('imageUploadProcess'); // end timing on early return
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 1MB",
          variant: "destructive"
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.timeEnd('imageUploadProcess'); // end timing on early return
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file",
          variant: "destructive"
        })
        return
      }

      // Use Promise for better async handling
      const compressedImage = await new Promise<string>((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        img.onload = () => {
          try {
            // Calculate new dimensions (max 400x400)
            const maxSize = 400
            let { width, height } = img
            
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width
                width = maxSize
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height
                height = maxSize
              }
            }

            // Set canvas dimensions and draw image
            canvas.width = width
            canvas.height = height
            ctx?.drawImage(img, 0, 0, width, height)

            // Convert to base64 with compression
            const result = canvas.toDataURL('image/jpeg', 0.8)
            
            console.log('🖼️ [Settings] Image compressed:', {
              originalSize: file.size,
              compressedSize: result.length,
              dimensions: `${width}x${height}`
            })
            
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }

        img.onerror = () => reject(new Error('Failed to load image'))

        // Load the image
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      // Update account data with new image
      setAccountData(prev => ({
        ...prev,
        profileImage: compressedImage
      }))

      console.timeEnd('imageUploadProcess'); // end timing after successful processing
      toast({
        title: "Image Uploaded",
        description: "Profile image uploaded successfully. Remember to save your changes.",
        variant: "default"
      })

    } catch (error) {
      console.timeEnd('imageUploadProcess'); // end timing on error
      console.error('❌ [Settings] Error uploading image:', error)
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSaveAccount = async () => {
    try {
      setSaving(true)
      console.time('saveAccountData'); // start performance timing
      console.log('💾 [Settings] Starting save process')

      // Validate required fields
      if (!accountData.studioName.trim()) {
        console.log('❌ [Settings] Validation failed: Studio name required')
        toast({
          title: "Validation Error",
          description: "Studio name is required",
          variant: "destructive"
        })
        return
      }

      // Prepare data for API
      const studioApiData = {
        name: accountData.studioName,
        firstName: accountData.firstName,
        lastName: accountData.lastName,
        email: accountData.email,
        phone: accountData.phone,
        description: accountData.bio,
        profileImage: accountData.profileImage,
        owner: user?.email || user?.id
      }

      console.log('📤 [Settings] Sending account data to API')
      
      // Construct and log the URL being used
      const studiosUrl = `${API_BASE_URL}/api/studios`
      
      const response = await fetch(studiosUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studioApiData),
        // Add timeout for better performance
        signal: AbortSignal.timeout(15000), // 15 second timeout for uploads
      })

      if (response.ok) {
        const savedStudio = await response.json()
        console.log('✅ [Settings] Account data saved successfully:', savedStudio.id)
        
        // Invalidate cache by clearing studio data in localStorage  
        const userKey = user?.email || user?.id
        if (userKey) {
          localStorage.removeItem(`studioProfileData_${userKey}`)
          // Force refresh on next dashboard visit by adding timestamp
          localStorage.setItem('studio_data_updated', Date.now().toString())
        }
        
        toast({
          title: "Settings Saved!",
          description: "Your account settings have been updated successfully.",
          variant: "default"
        })
      } else {
        const errorData = await response.text()
        console.error('❌ [Settings] Failed to save account data:', response.status, response.statusText)
        
        toast({
          title: "Save Failed",
          description: `Failed to save account settings (${response.status}). Please try again.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('💥 [Settings] Error saving account data:', error)
      toast({
        title: "Save Error",
        description: "An error occurred while saving. Please try again.",
        variant: "destructive"
      })
    } finally {
      console.timeEnd('saveAccountData'); // end performance timing
      setSaving(false)
    }
  }

  const handleSaveNotifications = () => {
    console.log("Saving notification settings:", notifications)
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved.",
      variant: "default"
    })
  }

  const handleSaveSecurity = () => {
    console.log("Saving security settings:", security)
    toast({
      title: "Security Updated",
      description: "Your security settings have been updated.",
      variant: "default"
    })
  }

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Password Mismatch",
        description: "New passwords don't match!",
        variant: "destructive"
      })
      return
    }
    if (passwords.new.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long!",
        variant: "destructive"
      })
      return
    }
    console.log("Changing password...")
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
      variant: "default"
    })
    setPasswords({ current: "", new: "", confirm: "" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/studio-dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
              <p className="text-muted-foreground">Loading your settings...</p>
            </div>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/studio-dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and security</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal and studio information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={accountData.profileImage || "/placeholder.svg?height=100&width=100"} alt="Profile" />
                      <AvatarFallback>
                        {accountData.firstName.charAt(0)}{accountData.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor="profile-upload" className="absolute -right-2 -bottom-2 cursor-pointer">
                      <div className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                      </div>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-upload-btn" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <div>
                          <Upload className="mr-2 h-4 w-4" />
                          Change Photo
                        </div>
                      </Button>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={accountData.firstName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={accountData.lastName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studioName">Studio Name</Label>
                  <Input
                    id="studioName"
                    value={accountData.studioName}
                    onChange={(e) => setAccountData(prev => ({ ...prev, studioName: e.target.value }))}
                    placeholder="Enter your studio name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Studio Description</Label>
                  <Textarea
                    id="bio"
                    value={accountData.bio}
                    onChange={(e) => setAccountData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Describe your studio, equipment, and services..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={accountData.phone}
                      onChange={(e) => setAccountData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={accountData.timezone} onValueChange={(value) => setAccountData(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={accountData.language} onValueChange={(value) => setAccountData(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveAccount} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Manage your email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Confirmations</Label>
                    <p className="text-sm text-muted-foreground">Receive emails when bookings are confirmed</p>
                  </div>
                  <Switch
                    checked={notifications.emailBookings}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailBookings: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Messages</Label>
                    <p className="text-sm text-muted-foreground">Receive emails for new messages from artists</p>
                  </div>
                  <Switch
                    checked={notifications.emailMessages}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailMessages: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive promotional emails and platform updates</p>
                  </div>
                  <Switch
                    checked={notifications.emailMarketing}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailMarketing: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Control your browser and mobile push notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified instantly for new bookings</p>
                  </div>
                  <Switch
                    checked={notifications.pushBookings}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushBookings: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Message Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified for new messages</p>
                  </div>
                  <Switch
                    checked={notifications.pushMessages}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushMessages: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications for promotions</p>
                  </div>
                  <Switch
                    checked={notifications.pushMarketing}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushMarketing: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS Notifications</CardTitle>
                <CardDescription>Manage text message notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking SMS</Label>
                    <p className="text-sm text-muted-foreground">Receive SMS for urgent booking updates</p>
                  </div>
                  <Switch
                    checked={notifications.smsBookings}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsBookings: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Message SMS</Label>
                    <p className="text-sm text-muted-foreground">Receive SMS for urgent messages</p>
                  </div>
                  <Switch
                    checked={notifications.smsMessages}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsMessages: checked }))}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                      placeholder="Enter your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleChangePassword}>Change Password</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of logins from new devices</p>
                  </div>
                  <Switch
                    checked={security.loginAlerts}
                    onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, loginAlerts: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <Select value={security.sessionTimeout} onValueChange={(value) => setSecurity(prev => ({ ...prev, sessionTimeout: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveSecurity}>Save Security Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Manage your billing details and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subscription section - disabled by default */}
                {STUDIO_SUBSCRIPTION_ENABLED && (
                  <>
                    <div className="rounded-lg border p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">HitConnector Pro</h3>
                          <p className="text-sm text-muted-foreground">Monthly subscription</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">$29/month</p>
                          <p className="text-sm text-muted-foreground">Next billing: Jan 15, 2024</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Subscription Status</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Payment Method</span>
                        <span className="text-sm text-muted-foreground">•••• •••• •••• 4242</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Next Payment</span>
                        <span className="text-sm text-muted-foreground">January 15, 2024</span>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium">Payment Methods</h4>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>

                <Separator />

                {/* Subscription management buttons - only show if subscriptions are enabled */}
                {STUDIO_SUBSCRIPTION_ENABLED && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-medium">Billing History</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium">Dec 15, 2023</p>
                            <p className="text-sm text-muted-foreground">HitConnector Pro - Monthly</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">$29.00</p>
                            <Button variant="ghost" size="sm">Download</Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium">Nov 15, 2023</p>
                            <p className="text-sm text-muted-foreground">HitConnector Pro - Monthly</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">$29.00</p>
                            <Button variant="ghost" size="sm">Download</Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline">Cancel Subscription</Button>
                      <Button>Update Billing</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 