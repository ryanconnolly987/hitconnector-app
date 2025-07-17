"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { format, addDays, startOfWeek, eachDayOfInterval, parseISO } from "date-fns"
import {
  CalendarDays,
  Clock,
  Settings,
  DollarSign,
  Users,
  Star,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  Heart,
  Megaphone,
  User,
  MessageSquare
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useFollow } from "@/hooks/use-follow"
import { API_BASE_URL } from "@/lib/config"
import OpenCallsTab from "@/components/open-calls-tab"
import { buildArtistProfileHrefFromParams } from "@/lib/url-utils"
import { BookingDetailsProvider } from "@/components/booking/BookingDetailsProvider"
import { BookingDetailsModal } from "@/components/booking/BookingDetailsModal"
import { UpcomingBookingCard } from "@/components/booking/UpcomingBookingCard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function StudioDashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [bookingRequests, setBookingRequests] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string>("")
  const [studioData, setStudioData] = useState({
    name: "Loading...",
    avatar: "/placeholder.svg?height=40&width=40",
    email: "",
    rating: 0, // Changed from 4.8 to 0 as default
    reviewCount: 0,
    profileImage: "",
    firstName: undefined as string | undefined,
    lastName: undefined as string | undefined
  })
  
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Get follow stats for this studio
  const { followersCount } = useFollow(studioId)

  // Generate week days for the calendar
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6),
  })

  // Generate month days for the calendar
  const generateMonthDays = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const startOfCalendar = startOfWeek(startOfMonth, { weekStartsOn: 1 })
    const endOfCalendar = addDays(startOfCalendar, 41) // 6 weeks * 7 days

    return eachDayOfInterval({
      start: startOfCalendar,
      end: endOfCalendar,
    })
  }

  const monthDays = generateMonthDays(currentDate)

  // Helper function to get display range text
  const getDisplayRangeText = () => {
    if (viewMode === 'week') {
      return `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`
    } else {
      return format(currentDate, "MMMM yyyy")
    }
  }

  // Helper function to navigate calendar
  const navigateCalendar = (direction: "prev" | "next") => {
    if (viewMode === 'week') {
      const days = direction === "prev" ? -7 : 7
      setCurrentDate((prevDate) => addDays(prevDate, days))
    } else {
      const months = direction === "prev" ? -1 : 1
      setCurrentDate((prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + months, 1))
    }
  }

  // Fetch studio data and bookings
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email && !user?.id) {
        setLoading(false)
        return
      }
      
      try {
        console.time('loadDashboardData'); // added performance timing
        console.log('🔍 [Dashboard] Fetching studio data and bookings for user:', { email: user.email, id: user.id, studioId: user.studioId })
        
        // First, fetch studio data using backend API
        const studiosUrl = `${API_BASE_URL}/api/studios`
        console.log('[DEBUG] Fetching from:', studiosUrl)
        const studiosResponse = await fetch(studiosUrl)
        if (!studiosResponse.ok) {
          throw new Error('Failed to fetch studios')
        }
        
        const studiosData = await studiosResponse.json()
        console.log('📊 [Dashboard] Studios data received:', studiosData.studios?.length || 0)
        
        // Filter studios owned by this user
        const userStudios = studiosData.studios?.filter((studio: any) => 
          studio.owner === user.email || studio.owner === user.id
        ) || []
        
        console.log('🏢 [Dashboard] User studios found:', userStudios.length)
        
        if (userStudios.length > 0) {
          const studio = userStudios[0] // Get the first studio
          console.log('🎯 [Dashboard] Using studio:', { id: studio.id, name: studio.name })
          
          // Fetch unified booking data using new API
          const bookingsResponse = await fetch(`${API_BASE_URL}/api/bookings?studioId=${studio.id}`)
          
          // Set studio ID for follow tracking
          const currentStudioId = studio.id || user.studioId
          setStudioId(currentStudioId)
          
          // Calculate actual rating based on reviews
          let actualRating = 0
          let actualReviewCount = 0
          
          // Check if studio has reviews data
          if (studio.reviews && Array.isArray(studio.reviews) && studio.reviews.length > 0) {
            const totalRating = studio.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0)
            actualReviewCount = studio.reviews.length
            actualRating = totalRating / actualReviewCount
          }
          
          setStudioData({
            name: studio.name || "Studio",
            avatar: studio.profileImage || "/placeholder.svg?height=40&width=40",
            email: studio.email || user.email || "",
            rating: actualRating, // Use calculated rating instead of hardcoded 4.8
            reviewCount: actualReviewCount, // Use actual review count
            profileImage: studio.profileImage || "",
            firstName: studio.firstName,
            lastName: studio.lastName
          })
          
          console.log('✅ [Dashboard] Studio data loaded:', {
            name: studio.name,
            hasProfileImage: !!studio.profileImage
          })
          
          // Process unified booking data
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json()
            console.log(`✅ [Dashboard] Found unified bookings data:`, bookingsData)
            
            // Normalize data from unified API response
            const pendingRequests = (bookingsData.pending || []).filter((request: any) => {
              if (!request.id) {
                console.warn('⚠️ [Dashboard] Found booking request without ID:', request)
                return false
              }
              return true
            })
            
            const upcomingBookings = (bookingsData.upcoming || []).filter((booking: any) => {
              if (!booking.id) {
                console.warn('⚠️ [Dashboard] Found booking without ID:', booking)
                return false
              }
              return true
            })
            
            const pastBookings = (bookingsData.past || []).filter((booking: any) => {
              if (!booking.id) {
                console.warn('⚠️ [Dashboard] Found booking without ID:', booking)
                return false
              }
              return true
            })
            
            console.log(`🔍 [Dashboard] Processed: ${pendingRequests.length} pending, ${upcomingBookings.length} upcoming, ${pastBookings.length} past`)
            setBookingRequests(pendingRequests)
            setBookings([...upcomingBookings, ...pastBookings]) // Combine for existing calendar display
          } else {
            console.log(`❌ [Dashboard] Failed to fetch booking data`)
            setBookingRequests([])
            setBookings([])
          }
        } else {
          // No studio found, set defaults
          setStudioData({
            name: user.name || "Studio",
            avatar: "/placeholder.svg?height=40&width=40",
            email: user.email || "",
            rating: 0,
            reviewCount: 0,
            profileImage: "",
            firstName: undefined,
            lastName: undefined
          })
          setBookingRequests([])
          setBookings([])
        }
      } catch (error) {
        console.error('❌ [Dashboard] Error fetching data:', error)
        setStudioData({
          name: user.name || "Studio",
          avatar: "/placeholder.svg?height=40&width=40",
          email: user.email || "",
          rating: 0,
          reviewCount: 0,
          profileImage: "",
          firstName: undefined,
          lastName: undefined
        })
        setBookingRequests([])
        setBookings([])
      } finally {
        console.timeEnd('loadDashboardData'); // added performance timing
        setLoading(false)
      }
    }

    fetchData()
  }, [user]) // added proper dependency array to prevent rerender loop

  // Handle booking request approval/rejection
  const handleBookingRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      // Immediately update UI to prevent duplicate clicks
      setBookingRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'approve' ? 'processing' : 'processing' }
          : req
      ))

      const endpoint = action === 'approve' 
        ? `${API_BASE_URL}/api/bookings/${requestId}/accept`
        : `${API_BASE_URL}/api/bookings/${requestId}/decline`

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (action === 'approve') {
          // Remove from requests and add to bookings
          setBookingRequests(prev => prev.filter(req => req.id !== requestId))
          // Add the new booking to the bookings list for calendar display
          if (result.booking) {
            setBookings(prev => [...prev, result.booking])
          }
          toast({
            title: "Booking Approved",
            description: "The booking has been confirmed and added to your calendar.",
          })
        } else {
          // Remove rejected request from the list completely
          setBookingRequests(prev => prev.filter(req => req.id !== requestId))
          toast({
            title: "Booking Rejected",
            description: "The booking request has been declined.",
          })
        }
      } else {
        // Revert UI state on error
        setBookingRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'pending' }
            : req
        ))
        throw new Error('Failed to update booking request')
      }
    } catch (error) {
      console.error('Error handling booking request:', error)
      // Revert UI state on error
      setBookingRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'pending' }
          : req
      ))
      toast({
        title: "Error",
        description: "Failed to update booking request. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Function to get bookings for a specific day and time slot
  const getBookingsForSlot = (date: string, timeSlot: string) => {
    return bookings.filter(
      (booking) => {
        // Ensure we have valid booking data
        if (!booking || !booking.date || !booking.startTime) {
          return false
        }
        
        // Only show CONFIRMED bookings in calendar (not PENDING)
        if (booking.status !== 'CONFIRMED' && booking.status !== 'confirmed') {
          return false
        }
        
        // Check if the booking is for this date
        const bookingDate = booking.date
        if (bookingDate !== date) {
          return false
        }
        
        // Parse start time to determine time slot
        const startTime = booking.startTime
        const hour = parseInt(startTime.split(':')[0])
        
        // Determine which time slot this booking belongs to
        let bookingTimeSlot = ''
        if (hour >= 8 && hour < 12) {
          bookingTimeSlot = 'morning'
        } else if (hour >= 12 && hour < 17) {
          bookingTimeSlot = 'afternoon'
        } else if (hour >= 17 && hour < 22) {
          bookingTimeSlot = 'evening'
        } else {
          bookingTimeSlot = 'late'
        }
        
        return bookingTimeSlot === timeSlot
      }
    )
  }

  return (
    <BookingDetailsProvider>
      <div className="flex min-h-screen bg-muted/40">
        <StudioDashboardSidebar studio={studioData} />
        <main className="flex-1">
          <div className="flex-1 space-y-6 p-6 md:p-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Manage Your Studio</h1>
                <p className="text-muted-foreground">
                  Welcome back {studioData.firstName ? studioData.firstName : studioData.name}. Manage your bookings and studio profile.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(studioData.rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{studioData.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-1">({studioData.reviewCount} reviews)</span>
                </div>
                {studioId && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{followersCount} followers</span>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/studio-profile">View Public Profile</Link>
                </Button>
              </div>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>Manage your studio bookings</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateCalendar("prev")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {getDisplayRangeText()}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => navigateCalendar("next")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Select value={viewMode} onValueChange={(value: 'week' | 'month') => setViewMode(value)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="View" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === 'week' ? (
                    <div className="grid grid-cols-8 gap-1 text-xs">
                      <div className="font-medium text-center py-2"></div>
                      {weekDays.map((day) => (
                        <div key={day.toString()} className="font-medium text-center py-2">
                          <div>{format(day, "EEE")}</div>
                          <div className="text-lg">{format(day, "d")}</div>
                        </div>
                      ))}
                      
                      {["Morning", "Afternoon", "Evening"].map((timeSlot) => (
                        <React.Fragment key={timeSlot}>
                          <div className="font-medium py-3 pr-2 text-right">
                            {timeSlot}
                          </div>
                          {weekDays.map((day) => {
                            const dayString = format(day, "yyyy-MM-dd")
                            const slotBookings = getBookingsForSlot(dayString, timeSlot.toLowerCase())
                            return (
                              <div key={`${day.toString()}-${timeSlot}`} className="border rounded p-1 min-h-[60px] relative">
                                {slotBookings.map((booking, index) => (
                                  <div
                                    key={booking.id || `booking-${index}`}
                                    className="bg-blue-100 text-blue-800 text-xs p-1 rounded mb-1 truncate"
                                    title={`${booking.userName} - ${booking.startTime}-${booking.endTime}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{booking.userName}</span>
                                      {booking.userId && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-4 w-4 p-0 ml-1"
                                          asChild
                                        >
                                          {buildArtistProfileHrefFromParams(booking.userSlug, booking.userId) ? (
                                            <Link 
                                              href={buildArtistProfileHrefFromParams(booking.userSlug, booking.userId)!}
                                              title={`View ${booking.userName}'s profile`}
                                            >
                                              <User className="h-3 w-3" />
                                            </Link>
                                          ) : (
                                            <span title="Profile not available">
                                              <User className="h-3 w-3" />
                                            </span>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {/* Day headers */}
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="font-medium text-center py-2 bg-gray-50">
                          {day}
                        </div>
                      ))}
                      
                      {/* Month days */}
                      {monthDays.map((day) => {
                        const dayString = format(day, "yyyy-MM-dd")
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                        // Only show CONFIRMED bookings in calendar (not PENDING)
                        const dayBookings = bookings.filter(booking => 
                          booking.date === dayString && 
                          (booking.status === 'CONFIRMED' || booking.status === 'confirmed')
                        )
                        
                        return (
                          <div 
                            key={day.toString()} 
                            className={`border rounded p-1 min-h-[80px] ${
                              isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                            {dayBookings.slice(0, 3).map((booking, index) => (
                              <div
                                key={booking.id || `booking-${index}`}
                                className="bg-blue-100 text-blue-800 text-xs p-1 rounded mb-1 truncate"
                                title={`${booking.userName} - ${booking.startTime}-${booking.endTime}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{booking.userName}</span>
                                  {booking.userId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-3 w-3 p-0 ml-1"
                                      asChild
                                    >
                                      {buildArtistProfileHrefFromParams(booking.userSlug, booking.userId) ? (
                                        <Link 
                                          href={buildArtistProfileHrefFromParams(booking.userSlug, booking.userId)!}
                                          title={`View ${booking.userName}'s profile`}
                                        >
                                          <User className="h-2 w-2" />
                                        </Link>
                                      ) : (
                                        <span title="Profile not available">
                                          <User className="h-2 w-2" />
                                        </span>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {dayBookings.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{dayBookings.length - 3} more
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage your studio settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/studio-dashboard/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        Studio Settings
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/studio-dashboard/profile?tab=availability">
                        <Clock className="mr-2 h-4 w-4" />
                        Edit Availability
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/studio-dashboard/profile?tab=staff">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Staff
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Booking Requests</CardTitle>
                    <CardDescription>Pending requests from artists</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bookingRequests.length > 0 ? (
                      bookingRequests.filter(request => request && request.id).map((request, index) => (
                        <div key={request.id || `request-${index}`} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            {buildArtistProfileHrefFromParams(request.artistSlug || request.userSlug, request.artistId || request.userId) ? (
                              <Link
                                href={buildArtistProfileHrefFromParams(request.artistSlug || request.userSlug, request.artistId || request.userId)!}
                                className="inline-flex items-center gap-2 group"
                              >
                                <Avatar>
                                  <AvatarImage src={request.artistProfilePicture || "/placeholder.svg"} alt={request.artistName || request.userName} />
                                  <AvatarFallback>{(request.artistName || request.userName)?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="group-hover:underline font-medium">{request.artistName || request.userName}</span>
                              </Link>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <Avatar>
                                  <AvatarImage src={request.artistProfilePicture || "/placeholder.svg"} alt={request.artistName || request.userName} />
                                  <AvatarFallback>{(request.artistName || request.userName)?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{request.artistName || request.userName}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <span>{request.date ? format(parseISO(request.date), "MMM dd, yyyy") : "Date not available"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{request.startTime} - {request.endTime}</span>
                            </div>
                            {request.roomName && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Room:</span>
                                <span className="font-medium">{request.roomName}</span>
                              </div>
                            )}
                            {request.staffName ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Staff: {request.staffName}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">No staff preference</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>${request.totalCost}</span>
                            </div>
                          </div>
                          <div className="text-sm italic">"{request.message}"</div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1" 
                              onClick={() => handleBookingRequest(request.id, 'approve')}
                              disabled={request.status === 'processing'}
                            >
                              <Check className="mr-1 h-4 w-4" /> 
                              {request.status === 'processing' ? 'Processing...' : 'Confirm'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1" 
                              onClick={() => handleBookingRequest(request.id, 'reject')}
                              disabled={request.status === 'processing'}
                            >
                              <X className="mr-1 h-4 w-4" /> 
                              {request.status === 'processing' ? 'Processing...' : 'Decline'}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CalendarDays className="h-10 w-10 text-muted-foreground mb-2" />
                        <h3 className="font-medium">No pending requests</h3>
                        <p className="text-sm text-muted-foreground">New booking requests will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
                <TabsTrigger value="past">Past Bookings</TabsTrigger>
                <TabsTrigger value="open-calls" className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Open Calls
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings.filter(booking => booking && booking.id).map((booking, index) => (
                    <UpcomingBookingCard
                      key={booking.id || `booking-${index}`}
                      booking={{
                        id: booking.id,
                        date: booking.date,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        roomName: booking.roomName,
                        status: booking.status,
                        artistId: booking.artistId,
                        artistName: booking.artistName,
                        artistSlug: booking.artistSlug,
                        artistProfilePicture: booking.artistProfilePicture,
                        userName: booking.userName,
                        userId: booking.userId
                      }}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="past">
                <div className="rounded-lg border p-8 text-center">
                  <h3 className="text-lg font-medium">Past bookings will appear here</h3>
                  <p className="text-sm text-muted-foreground mt-1">View your booking history and artist reviews</p>
                </div>
              </TabsContent>

              <TabsContent value="open-calls">
                <OpenCallsTab 
                  userType="studio" 
                  userId={user?.id || ''} 
                  studioId={studioId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <BookingDetailsModal />
    </BookingDetailsProvider>
  )
}

function StudioDashboardSidebar({ studio }: { studio: { name: string; avatar: string; email: string; profileImage?: string; firstName?: string; lastName?: string } }) {
  return (
    <CollapsibleSidebar>
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl font-bold">HitConnector</span>
        </Link>
      </div>
      
      <div className="flex flex-col gap-2">
        <Link 
          href="/studio-dashboard" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link 
          href="/studio-dashboard/profile" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Users className="h-4 w-4" />
          <span>My Studio Profile</span>
        </Link>
        <Link 
          href="/studio-dashboard/bookings" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          <span>Bookings</span>
        </Link>
        <Link 
          href="/messages" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Messages</span>
        </Link>
        <Link 
          href="/studio-dashboard/settings" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Account Settings</span>
        </Link>
      </div>

      <div className="mt-auto pt-4 border-t">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={studio.profileImage || studio.avatar || "/placeholder.svg"} alt={studio.name} />
            <AvatarFallback>{studio.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{studio.name}</span>
            <span className="text-xs text-muted-foreground">{studio.email}</span>
          </div>
        </div>
      </div>
    </CollapsibleSidebar>
  )
}