"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  CalendarDays,
  Clock,
  Settings,
  MapPin,
  Users,
  Star,
  Search,
  Heart,
  Music,
  User,
  Calendar,
  Megaphone,
  MessageSquare
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { API_BASE_URL } from "@/lib/config"
import { useFollowing, useFollowers } from "@/hooks/use-follow"
import { MusicPlayer } from "@/components/ui/music-player"
import OpenCallsTab from "@/components/open-calls-tab"
import { BookingDetailsCard } from "@/components/ui/booking-details-card"
import { CalendarDropdown } from "@/components/ui/calendar-dropdown"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar"
import { Input } from "@/components/ui/input"

interface DashboardSidebarProps {
  userName: string
  userEmail: string
  userInitials: string
  profileImage?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [pastBookings, setPastBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [artistProfile, setArtistProfile] = useState<{
    trackUrl?: string
    bio?: string
    location?: string
    genres?: string[]
    profileImage?: string
  }>({})
  const { following, loading: followingLoading } = useFollowing()
  const { followers, loading: followersLoading } = useFollowers(user?.id)
  const [activeFollowTab, setActiveFollowTab] = useState('following')
  const [followSearchTerm, setFollowSearchTerm] = useState('')
  
  // Use authenticated user data or fallback
  const userName = user?.name || "User"
  const userEmail = user?.email || "user@example.com"
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || "U"

  // Filter follow data based on search term and active tab
  const filteredFollowData = (activeFollowTab === 'following' ? following : followers)
    .filter((user: any) => 
      user.name.toLowerCase().includes(followSearchTerm.toLowerCase()) ||
      (user.location && user.location.toLowerCase().includes(followSearchTerm.toLowerCase()))
    )

  // Fetch user's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      
      try {
        console.time('fetchBookings'); // added performance timing
        console.log('🔍 [Dashboard] Fetching bookings for user:', user.id)
        
        const bookingsResponse = await fetch(`${API_BASE_URL}/api/users/${user.id}/bookings`)
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          console.log(`✅ [Dashboard] Found ${bookingsData.bookings?.length || 0} bookings`)
          const allBookings = bookingsData.bookings || []
          
          // Separate upcoming and past bookings
          const now = new Date()
          const upcoming = allBookings.filter((booking: any) => {
            const bookingDate = new Date(booking.date)
            return bookingDate >= now && booking.status !== 'cancelled'
          })
          const past = allBookings.filter((booking: any) => {
            const bookingDate = new Date(booking.date)
            return bookingDate < now || booking.status === 'cancelled'
          })
          
          setUpcomingBookings(upcoming)
          setPastBookings(past)
        } else {
          console.error(`❌ [Dashboard] Failed to fetch bookings - Status: ${bookingsResponse.status}`)
          setUpcomingBookings([])
          setPastBookings([])
        }
      } catch (error) {
        console.error('❌ [Dashboard] Error fetching bookings:', error)
        setUpcomingBookings([])
        setPastBookings([])
      } finally {
        console.timeEnd('fetchBookings'); // added performance timing
        setLoading(false)
      }
    }

    const fetchArtistProfile = async () => {
      if (!user?.id) return
      
      try {
        console.time('fetchArtistProfile'); // added performance timing
        console.log('🔍 [Dashboard] Fetching artist profile for user:', user.id)
        
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/${user.id}`)
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          console.log('✅ [Dashboard] Artist profile loaded')
          setArtistProfile(profileData)
        } else {
          console.error(`❌ [Dashboard] Failed to fetch artist profile - Status: ${profileResponse.status}`)
          // Set default profile data
          setArtistProfile({
            bio: '',
            location: '',
            genres: [],
            trackUrl: '',
            profileImage: ''
          })
        }
      } catch (error) {
        console.error('❌ [Dashboard] Error fetching artist profile:', error)
        // Set default profile data on error
        setArtistProfile({
          bio: '',
          location: '',
          genres: [],
          trackUrl: '',
          profileImage: ''
        })
      } finally {
        console.timeEnd('fetchArtistProfile'); // added performance timing
      }
    }

    if (user?.id) {
      fetchBookings()
    }
    fetchArtistProfile()
  }, [user?.id]) // added proper dependency array to prevent rerender loop

  return (
    <div className="flex min-h-screen bg-muted/40">
      <DashboardSidebar 
        userName={userName} 
        userEmail={userEmail} 
        userInitials={userInitials}
        profileImage={artistProfile.profileImage || user?.avatar}
      />
      <main className="flex-1">
          <div className="flex-1 space-y-6 p-6 md:p-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Welcome back, {userName}!</h1>
                <p className="text-muted-foreground">
                  Manage your bookings and find the perfect studio for your next hit.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDropdown bookings={upcomingBookings}>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    View Calendar
                  </Button>
                </CalendarDropdown>
                <Link href="/find-studios">
                  <Button size="sm">
                    <Search className="mr-2 h-4 w-4" />
                    Find Studios
                  </Button>
                </Link>
              </div>
            </header>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  My Profile
                </TabsTrigger>
                <TabsTrigger value="following" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Network
                </TabsTrigger>
                <TabsTrigger value="open-calls" className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Open Calls
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  {upcomingBookings.map((booking) => (
                    <BookingDetailsCard
                      key={booking.id}
                      booking={{
                        id: booking.id,
                        // Use new studio format if available, fallback to old format
                        studio: booking.studio || undefined,
                        studioName: booking.studioName || booking.studio?.name,
                        studioImage: booking.studioImage,
                        date: booking.date,
                        startTime: booking.startTime || booking.start,
                        endTime: booking.endTime || booking.end,
                        time: booking.time,
                        location: booking.location,
                        status: booking.status
                      }}
                      onCancel={(bookingId) => {
                        // Remove the cancelled booking from the list
                        setUpcomingBookings(prev => prev.filter(b => b.id !== bookingId))
                      }}
                    />
                  ))}

                  {upcomingBookings.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <CalendarDays className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">No upcoming bookings</h3>
                      <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Book your first studio session to get started.
                      </p>
                      <Button asChild>
                        <Link href="/find-studios">Find Studios</Link>
                      </Button>
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Artist Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Artist Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={artistProfile.profileImage || user?.avatar || "/placeholder.svg?height=64&width=64"} alt={userName} />
                          <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">{userName}</h3>
                          {artistProfile.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{artistProfile.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {artistProfile.bio && (
                        <div>
                          <h4 className="font-medium mb-2">Bio</h4>
                          <p className="text-sm text-muted-foreground">{artistProfile.bio}</p>
                        </div>
                      )}
                      
                      {artistProfile.genres && artistProfile.genres.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Genres</h4>
                          <div className="flex flex-wrap gap-2">
                            {artistProfile.genres.map((genre) => (
                              <Badge key={genre} variant="secondary">
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-4">
                        <Button asChild className="w-full">
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Profile
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full mt-2">
                          <Link href={`/artist/${user?.slug || user?.id}?returnTo=/dashboard`}>
                            <User className="mr-2 h-4 w-4" />
                            View Public Profile
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Music Sample */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        My Music Sample
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {artistProfile.trackUrl ? (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Share your music with studios to showcase your style
                          </p>
                          <MusicPlayer trackUrl={artistProfile.trackUrl} />
                          <Button variant="outline" asChild className="w-full">
                            <Link href="/settings">
                              Update Music Sample
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Music className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">No music sample yet</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Add a music sample to showcase your talent to studios
                            </p>
                          </div>
                          <Button asChild>
                            <Link href="/settings">
                              Add Music Sample
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="following" className="space-y-4">
                <div className="space-y-4">
                  {/* Followers/Following Toggle and Search */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={activeFollowTab === 'following' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveFollowTab('following')}
                      >
                        Following ({following.length})
                      </Button>
                      <Button
                        variant={activeFollowTab === 'followers' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveFollowTab('followers')}
                      >
                        Followers ({followers.length})
                      </Button>
                    </div>
                    <div className="w-full sm:w-64">
                      <Input
                        placeholder="Search users..."
                        value={followSearchTerm}
                        onChange={(e) => setFollowSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="space-y-3">
                    {filteredFollowData.map((followedUser) => (
                      <div key={followedUser.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={followedUser.profileImage || "/placeholder.svg"} 
                              alt={followedUser.name} 
                            />
                            <AvatarFallback>
                              {followedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{followedUser.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {followedUser.type === 'studio' ? 'Recording Studio' : 'Artist'}
                              {followedUser.location && ` • ${followedUser.location}`}
                            </p>
                            {followedUser.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-muted-foreground">{followedUser.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={followedUser.type === 'studio' ? `/studio/${followedUser.slug || followedUser.id}` : `/artist/${followedUser.slug || followedUser.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    ))}

                    {filteredFollowData.length === 0 && !followingLoading && !followersLoading && (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Heart className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                          {activeFollowTab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
                        </h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground">
                          {activeFollowTab === 'following' 
                            ? 'Discover and follow your favorite studios and artists.'
                            : 'Share your profile to gain followers.'
                          }
                        </p>
                        {activeFollowTab === 'following' && (
                          <Button asChild>
                            <Link href="/find-studios">Discover Studios</Link>
                          </Button>
                        )}
                      </div>
                    )}

                    {(followingLoading || followersLoading) && (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="open-calls" className="space-y-6">
                <OpenCallsTab 
                  userType="artist" 
                  userId={user?.id || ''} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    )
}

function DashboardSidebar({ userName, userEmail, userInitials, profileImage }: DashboardSidebarProps) {
  return (
    <CollapsibleSidebar>
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl font-bold">HitConnector</span>
        </Link>
      </div>
      
      <div className="flex flex-col gap-2">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium"
        >
          <CalendarDays className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/find-studios" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Find Studios</span>
        </Link>
        <Link 
          href="/messages" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Messages</span>
        </Link>
        <Link 
          href="/settings" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Account Settings</span>
        </Link>
      </div>

      <div className="mt-auto pt-4 border-t">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={profileImage || "/placeholder.svg?height=40&width=40"} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          </div>
        </div>
      </div>
    </CollapsibleSidebar>
  )
}