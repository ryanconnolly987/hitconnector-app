"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns"
import {
  CalendarDays,
  Clock,
  Settings,
  Upload,
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
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useFollow } from "@/hooks/use-follow"
import { API_BASE_URL } from "@/lib/config"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudioDashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookingRequests, setBookingRequests] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string>("")
  const [studioData, setStudioData] = useState({
    name: "Loading...",
    avatar: "/placeholder.svg?height=40&width=40",
    email: "",
    rating: 0,
    reviewCount: 0,
    profileImage: ""
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

  // Fetch studio data and bookings
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email && !user?.id) {
        setLoading(false)
        return
      }
      
      try {
        console.log('🔍 [Dashboard] Fetching studio data and bookings for user:', { email: user.email, id: user.id, studioId: user.studioId })
        
        // First, fetch studio data
        const studiosResponse = await fetch(`${API_BASE_URL}/api/studios`)
        if (!studiosResponse.ok) {
          throw new Error('Failed to fetch studios')
        }
        
        const studiosData = await studiosResponse.json()
        const userStudios = studiosData.studios.filter((studio: any) => 
          studio.owner === user.email || studio.owner === user.id
        )
        
        console.log('🏢 [Dashboard] User studios found:', userStudios.length)
        
        if (userStudios.length > 0) {
          const studio = userStudios[0] // Use the first studio
          
          // Set studio ID for follow tracking
          const currentStudioId = studio.id || user.studioId
          setStudioId(currentStudioId)
          
          setStudioData({
            name: studio.name || "Studio",
            avatar: studio.profileImage || "/placeholder.svg?height=40&width=40",
            email: studio.email || user.email || "",
            rating: studio.rating || 4.8, // Default or from API
            reviewCount: studio.reviewCount || 0,
            profileImage: studio.profileImage || ""
          })
          
          console.log('✅ [Dashboard] Studio data loaded:', {
            name: studio.name,
            hasProfileImage: !!studio.profileImage
          })
          
          // Now fetch bookings for this studio
          const studioId = studio.id || user.studioId
          
          if (studioId) {
            console.log(`📋 [Dashboard] Fetching booking data for studio: ${studioId}`)
            
            // Fetch booking requests for this studio
            const requestsResponse = await fetch(`${API_BASE_URL}/api/booking-requests?studioId=${studioId}`)
            if (requestsResponse.ok) {
              const requestsData = await requestsResponse.json()
              console.log(`✅ [Dashboard] Found ${requestsData.bookingRequests?.length || 0} booking requests`)
              
              // Validate and filter booking requests
              const validRequests = (requestsData.bookingRequests || []).filter((request: any) => {
                if (!request.id) {
                  console.warn('⚠️ [Dashboard] Found booking request without ID:', request)
                  return false
                }
                return true
              })
              
              console.log(`🔍 [Dashboard] Valid booking requests: ${validRequests.length}/${requestsData.bookingRequests?.length || 0}`)
              setBookingRequests(validRequests)
            } else {
              console.log(`❌ [Dashboard] Failed to fetch booking requests`)
              setBookingRequests([])
            }

            // Fetch confirmed bookings for this studio
            const bookingsResponse = await fetch(`${API_BASE_URL}/api/bookings?studioId=${studioId}`)
            if (bookingsResponse.ok) {
              const bookingsData = await bookingsResponse.json()
              console.log(`✅ [Dashboard] Found ${bookingsData.bookings?.length || 0} confirmed bookings`)
              
              // Validate and filter bookings
              const validBookings = (bookingsData.bookings || []).filter((booking: any) => {
                if (!booking.id) {
                  console.warn('⚠️ [Dashboard] Found booking without ID:', booking)
                  return false
                }
                return true
              })
              
              console.log(`🔍 [Dashboard] Valid bookings: ${validBookings.length}/${bookingsData.bookings?.length || 0}`)
              setBookings(validBookings)
            } else {
              console.log(`❌ [Dashboard] Failed to fetch confirmed bookings`)
              setBookings([])
            }
          }
        } else {
          // No studio found, set defaults
          setStudioData({
            name: user.name || "Studio",
            avatar: "/placeholder.svg?height=40&width=40",
            email: user.email || "",
            rating: 0,
            reviewCount: 0,
            profileImage: ""
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
          profileImage: ""
        })
        setBookingRequests([])
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Handle booking request approval/rejection
  const handleBookingRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/booking-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (action === 'approve') {
          // Remove from requests and add to bookings
          setBookingRequests(prev => prev.filter(req => req.id !== requestId))
          setBookings(prev => [...prev, result])
          toast({
            title: "Booking Approved",
            description: "The booking has been confirmed and added to your calendar.",
          })
        } else {
          // Update request status to rejected
          setBookingRequests(prev => 
            prev.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req)
          )
          toast({
            title: "Booking Rejected",
            description: "The booking request has been declined.",
          })
        }
      } else {
        throw new Error('Failed to update booking request')
      }
    } catch (error) {
      console.error('Error handling booking request:', error)
      toast({
        title: "Error",
        description: "Failed to update booking request. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Function to navigate weeks
  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -7 : 7
    setCurrentDate((prevDate) => addDays(prevDate, days))
  }

  // Function to get bookings for a specific day and time slot
  const getBookingsForSlot = (date: string, timeSlot: string) => {
    return bookings.filter(
      (booking) =>
        booking.date === date &&
        ((timeSlot === "morning" && booking.startTime >= "08:00" && booking.startTime < "12:00") ||
          (timeSlot === "afternoon" && booking.startTime >= "12:00" && booking.startTime < "17:00") ||
          (timeSlot === "evening" && booking.startTime >= "17:00" && booking.startTime <= "23:00")),
    )
  }

  // Add debugging before render
  console.log('🔍 [Dashboard] Rendering with data:', {
    bookingRequestsCount: bookingRequests.length,
    bookingsCount: bookings.length,
    requestIds: bookingRequests.map(r => r?.id),
    bookingIds: bookings.map(b => b?.id),
    invalidRequests: bookingRequests.filter(r => !r?.id).length,
    invalidBookings: bookings.filter(b => !b?.id).length
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <StudioDashboardSidebar studio={studioData} />
        <SidebarInset>
          <div className="flex-1 space-y-6 p-6 md:p-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Manage Your Studio</h1>
                <p className="text-muted-foreground">
                  Welcome back to {studioData.name}. Manage your bookings and studio profile.
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
                  <span className="text-sm font-medium">{studioData.rating}</span>
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
                    <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Select defaultValue="week">
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
                  <div className="grid grid-cols-8 gap-1">
                    <div className="p-2 text-center font-medium text-sm">Time</div>
                    {weekDays.map((day) => (
                      <div key={day.toString()} className="p-2 text-center font-medium text-sm">
                        <div>{format(day, "EEE")}</div>
                        <div
                          className={`text-xs ${format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "bg-primary text-primary-foreground rounded-full px-1" : ""}`}
                        >
                          {format(day, "d")}
                        </div>
                      </div>
                    ))}

                    {/* Morning time slot */}
                    <div className="p-2 text-xs text-muted-foreground">8AM - 12PM</div>
                    {weekDays.map((day) => {
                      const dayStr = format(day, "yyyy-MM-dd")
                      const dayBookings = getBookingsForSlot(dayStr, "morning")
                      return (
                        <div key={`morning-${dayStr}`} className="min-h-[60px] border rounded-md p-1 text-xs">
                          {dayBookings.map((booking) => (
                            <div key={booking.id} className="bg-primary/10 rounded p-1 mb-1 truncate">
                              <div className="font-medium">{booking.artistName}</div>
                              <div>
                                {booking.startTime} - {booking.endTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}

                    {/* Afternoon time slot */}
                    <div className="p-2 text-xs text-muted-foreground">12PM - 5PM</div>
                    {weekDays.map((day) => {
                      const dayStr = format(day, "yyyy-MM-dd")
                      const dayBookings = getBookingsForSlot(dayStr, "afternoon")
                      return (
                        <div key={`afternoon-${dayStr}`} className="min-h-[60px] border rounded-md p-1 text-xs">
                          {dayBookings.map((booking) => (
                            <div key={booking.id} className="bg-primary/10 rounded p-1 mb-1 truncate">
                              <div className="font-medium">{booking.artistName}</div>
                              <div>
                                {booking.startTime} - {booking.endTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}

                    {/* Evening time slot */}
                    <div className="p-2 text-xs text-muted-foreground">5PM - 11PM</div>
                    {weekDays.map((day) => {
                      const dayStr = format(day, "yyyy-MM-dd")
                      const dayBookings = getBookingsForSlot(dayStr, "evening")
                      return (
                        <div key={`evening-${dayStr}`} className="min-h-[60px] border rounded-md p-1 text-xs">
                          {dayBookings.map((booking) => (
                            <div key={booking.id} className="bg-primary/10 rounded p-1 mb-1 truncate">
                              <div className="font-medium">{booking.artistName}</div>
                              <div>
                                {booking.startTime} - {booking.endTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Studio Management</CardTitle>
                    <CardDescription>Manage your studio details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/studio-dashboard/profile?tab=photos">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
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
                        Manage Studio Staff Bios
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/studio-dashboard/reviews">
                        <Star className="mr-2 h-4 w-4" />
                        View Reviews
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
                            <Avatar>
                              <AvatarImage src="/placeholder.svg" alt={request.userName} />
                              <AvatarFallback>{request.userName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{request.userName}</div>
                              <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <span>{request.date ? format(new Date(request.date), "MMM dd, yyyy") : "Date not available"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{request.startTime} - {request.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>${request.totalCost}</span>
                            </div>
                          </div>
                          <div className="text-sm italic">"{request.message}"</div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => handleBookingRequest(request.id, 'approve')}>
                              <Check className="mr-1 h-4 w-4" /> Confirm
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleBookingRequest(request.id, 'reject')}>
                              <X className="mr-1 h-4 w-4" /> Decline
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
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
                <TabsTrigger value="past">Past Bookings</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings.filter(booking => booking && booking.id).map((booking, index) => (
                    <Card key={booking.id || `booking-${index}`}>
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt={booking.userName} />
                          <AvatarFallback>{booking.userName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{booking.userName}</CardTitle>
                          <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
                            {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.date ? format(new Date(booking.date), "MMM dd, yyyy") : "Date not available"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{booking.roomName}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/studio-dashboard/bookings/${booking.id}`}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="past">
                <div className="rounded-lg border p-8 text-center">
                  <h3 className="text-lg font-medium">Past bookings will appear here</h3>
                  <p className="text-sm text-muted-foreground mt-1">View your booking history and artist reviews</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function StudioDashboardSidebar({ studio }: { studio: { name: string; avatar: string; email: string; profileImage?: string } }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl font-bold">HitConnector</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive>
              <Link href="/studio-dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/studio-profile">
                <Users className="h-4 w-4" />
                <span>My Studio Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/studio-dashboard/bookings">
                <BookOpen className="h-4 w-4" />
                <span>Bookings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/open-calls">
                <Megaphone className="h-4 w-4" />
                <span>Open Calls</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/studio-dashboard/settings">
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
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
      </SidebarFooter>
    </Sidebar>
  )
}