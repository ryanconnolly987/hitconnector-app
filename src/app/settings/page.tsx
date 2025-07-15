'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, Save, Trash2, Eye, EyeOff, Bell, CreditCard, Shield, Music, User, Instagram, Twitter, Headphones } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { MusicPlayerInput, MusicPlayer } from "@/components/ui/music-player"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ImageUpload } from "@/components/ui/image-upload"
import { ProjectHighlights } from "@/components/ui/project-highlights"

interface ProjectHighlight {
  id: string
  title: string
  description: string
}

interface BillingTransaction {
  id: string
  studioName: string
  amount: number
  date: string
  createdAt: string
  description: string
  paymentMethodLast4: string
}

interface ProfileData {
  name: string
  email: string
  phone: string
  bio: string
  location: string
  experience: string
  genres: string[]
  profileImage: string
  bannerImage: string
  trackUrl: string
  projectHighlights: ProjectHighlight[]
  socialMedia: {
    instagram: string
    twitter: string
    youtube: string
    spotify: string
  }
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [billingTransactions, setBillingTransactions] = useState<BillingTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Form states
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    experience: '',
    genres: [],
    profileImage: '',
    bannerImage: '',
    trackUrl: '',
    projectHighlights: [],
    socialMedia: {
      instagram: '',
      twitter: '',
      youtube: '',
      spotify: '',
    }
  })

  const [notificationSettings, setNotificationSettings] = useState({
    bookingConfirmations: true,
    studioMessages: true,
    promotionalEmails: false,
    weeklyDigest: true,
    pushNotifications: true,
    smsNotifications: false,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [newGenre, setNewGenre] = useState("")

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            bio: userData.bio || '',
            location: userData.location || '',
            experience: userData.experience || '',
            genres: userData.genres || [],
            profileImage: userData.profileImage || '',
            bannerImage: userData.bannerImage || '',
            trackUrl: userData.trackUrl || '',
            projectHighlights: userData.projectHighlights || [],
            socialMedia: userData.socialMedia || {
              instagram: '',
              twitter: '',
              youtube: '',
              spotify: '',
            }
          })
        }
      } catch (error) {
        console.error('Error loading profile data:', error)
      }
    }
    
    loadProfileData()
  }, [user])

  useEffect(() => {
    loadBillingTransactions()
  }, [user])

  const loadBillingTransactions = async () => {
    if (!user) return
    
    setLoadingTransactions(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/billing/transactions?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setBillingTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error loading billing transactions:', error)
      setBillingTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      })
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Password Updated",
      description: "Your password has been successfully updated.",
    })
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  const handleEmailUpdate = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    // Check if email actually changed
    if (profileData.email === user.email) {
      toast({
        title: "No Changes",
        description: "Email address is already up to date.",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/update-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newEmail: profileData.email
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update auth context with new email
        updateUser({
          ...user,
          email: profileData.email
        })
        
        toast({
          title: "Success",
          description: "Email address updated successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update email')
      }
    } catch (error) {
      console.error('Error updating email:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update email",
        variant: "destructive",
      })
      // Reset email field to original value on error
      setProfileData(prev => ({
        ...prev,
        email: user.email || ""
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = () => {
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved.",
    })
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Account deletion is not implemented in this demo.",
      variant: "destructive"
    })
  }

  const userName = user?.name || "User"
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || "U"

  const addGenre = () => {
    if (newGenre.trim() && !profileData.genres.includes(newGenre.trim())) {
      setProfileData({
        ...profileData,
        genres: [...profileData.genres, newGenre.trim()]
      })
      setNewGenre("")
    }
  }

  const removeGenre = (genreToRemove: string) => {
    setProfileData({
      ...profileData,
      genres: profileData.genres.filter(genre => genre !== genreToRemove)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addGenre()
    }
  }

  const predefinedGenres = [
    "Hip Hop", "R&B", "Pop", "Rock", "Jazz", "Blues", "Country", 
    "Electronic", "Reggae", "Soul", "Funk", "Alternative", "Indie"
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Please log in to access settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your profile, preferences, and account security
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">
                  Manage your profile information and preferences
                </p>
              </div>

              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Images & Media
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    Projects
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Update your basic profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Display Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                          rows={4}
                          placeholder="Tell studios about your music style and experience..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={profileData.location}
                            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                            placeholder="City, State"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience">Experience Level</Label>
                          <Select 
                            value={profileData.experience} 
                            onValueChange={(value) => setProfileData({...profileData, experience: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Musical Genres</CardTitle>
                      <CardDescription>
                        Add genres that describe your music style
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {profileData.genres.map((genre) => (
                          <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                            {genre}
                            <button
                              onClick={() => removeGenre(genre)}
                              className="ml-1 text-xs hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={newGenre}
                          onChange={(e) => setNewGenre(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add a genre..."
                          className="flex-1"
                        />
                        <Button onClick={addGenre} variant="outline">
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {predefinedGenres.map((genre) => (
                          <Button
                            key={genre}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!profileData.genres.includes(genre)) {
                                setProfileData({
                                  ...profileData,
                                  genres: [...profileData.genres, genre]
                                })
                              }
                            }}
                            disabled={profileData.genres.includes(genre)}
                          >
                            {genre}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Social Media</CardTitle>
                      <CardDescription>
                        Connect your social media profiles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="instagram" className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            Instagram
                          </Label>
                          <Input
                            id="instagram"
                            value={profileData.socialMedia.instagram}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, instagram: e.target.value }
                            })}
                            placeholder="@username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter" className="flex items-center gap-2">
                            <Twitter className="h-4 w-4" />
                            Twitter
                          </Label>
                          <Input
                            id="twitter"
                            value={profileData.socialMedia.twitter}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, twitter: e.target.value }
                            })}
                            placeholder="@username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube">YouTube</Label>
                          <Input
                            id="youtube"
                            value={profileData.socialMedia.youtube}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, youtube: e.target.value }
                            })}
                            placeholder="Channel name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="spotify">Spotify</Label>
                          <Input
                            id="spotify"
                            value={profileData.socialMedia.spotify}
                            onChange={(e) => setProfileData({
                              ...profileData,
                              socialMedia: { ...profileData.socialMedia, spotify: e.target.value }
                            })}
                            placeholder="Artist name or URL"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Images</CardTitle>
                      <CardDescription>
                        Upload your profile banner and avatar images
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ImageUpload
                        label="Banner Image"
                        currentImage={profileData.bannerImage}
                        onImageUpload={(imageUrl) => setProfileData({...profileData, bannerImage: imageUrl})}
                        userId={user.id}
                        type="banner"
                        placeholder="Upload a banner image for your profile (like a cover photo)"
                        maxSizeMB={10}
                      />

                      <Separator />

                      <ImageUpload
                        label="Profile Avatar"
                        currentImage={profileData.profileImage}
                        onImageUpload={(imageUrl) => setProfileData({...profileData, profileImage: imageUrl})}
                        userId={user.id}
                        type="avatar"
                        placeholder="Upload your profile picture"
                        maxSizeMB={5}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Music Sample
                      </CardTitle>
                      <CardDescription>
                        Share your music with studios to showcase your style
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="trackUrl" className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Music Sample URL
                        </Label>
                        <MusicPlayerInput
                          value={profileData.trackUrl}
                          onChange={(value) => setProfileData({...profileData, trackUrl: value})}
                          placeholder="Paste a YouTube, SoundCloud, or MP3 link to showcase your music..."
                        />
                        {profileData.trackUrl && (
                          <div className="mt-3">
                            <MusicPlayer trackUrl={profileData.trackUrl} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Highlights</CardTitle>
                      <CardDescription>
                        Showcase up to 3 of your best projects or achievements. These will be displayed prominently on your public profile.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProjectHighlights
                        highlights={profileData.projectHighlights}
                        onChange={(highlights) => setProfileData({...profileData, projectHighlights: highlights})}
                        maxHighlights={3}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about bookings and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="booking-confirmations">Booking Confirmations</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your booking requests are confirmed or declined
                      </p>
                    </div>
                    <Switch
                      id="booking-confirmations"
                      checked={notificationSettings.bookingConfirmations}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, bookingConfirmations: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="studio-messages">Studio Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive messages from studios about your bookings
                      </p>
                    </div>
                    <Switch
                      id="studio-messages"
                      checked={notificationSettings.studioMessages}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, studioMessages: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="promotional-emails">Promotional Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Get updates about new features and studio promotions
                      </p>
                    </div>
                    <Switch
                      id="promotional-emails"
                      checked={notificationSettings.promotionalEmails}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, promotionalEmails: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-digest">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Weekly summary of your bookings and new studios in your area
                      </p>
                    </div>
                    <Switch
                      id="weekly-digest"
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, weeklyDigest: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable browser push notifications for real-time updates
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, pushNotifications: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive text messages for urgent booking updates
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({...notificationSettings, smsNotifications: checked})
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationUpdate} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Save Notification Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                  </div>

                  <Button onClick={handlePasswordChange} className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>
                    Manage your account security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Login Activity</p>
                        <p className="text-sm text-muted-foreground">View recent login sessions</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Connected Apps</p>
                        <p className="text-sm text-muted-foreground">Manage third-party access</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Data Export</p>
                        <p className="text-sm text-muted-foreground">Download your account data</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Payments</CardTitle>
                <CardDescription>
                  Manage your payment methods and billing history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/27</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Recent Transactions</h4>
                  {loadingTransactions ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading transactions...
                    </div>
                  ) : billingTransactions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No transactions found. Complete a booking to see your payment history.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {billingTransactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{transaction.studioName}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                          </div>
                          <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                        </div>
                      ))}
                      {billingTransactions.length > 5 && (
                        <Button variant="outline" className="w-full mt-2">
                          View All Transactions
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 text-red-600">Danger Zone</h4>
                  <Card className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium">Delete Account</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleProfileUpdate} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
} 