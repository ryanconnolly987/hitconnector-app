"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format, addDays, subDays } from "date-fns"
import { ArrowLeft, Calendar, Clock, User, DollarSign, Check, X, MessageSquare, Filter, Search } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { buildArtistProfileHrefFromParams } from "@/lib/url-utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface BookingRequest {
  id: string
  studioId: string
  studioName: string
  roomId?: string
  roomName?: string
  userId: string
  userName: string
  userEmail: string
  date: string
  startTime: string
  endTime: string
  duration: number
  hourlyRate?: number
  totalCost: number
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  // Enhanced artist profile fields from API
  artistId?: string
  artistName?: string
  artistSlug?: string
  artistProfilePicture?: string
}

interface Booking {
  id: string
  studioId: string
  studioName: string
  roomId?: string
  roomName?: string
  userId: string
  userName: string
  userEmail: string
  date: string
  startTime: string
  endTime: string
  duration: number
  hourlyRate?: number
  totalCost: number
  message: string
  status: 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  // Enhanced artist profile fields from API
  artistId?: string
  artistName?: string
  artistSlug?: string
  artistProfilePicture?: string
}

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [detailsBooking, setDetailsBooking] = useState<any>(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [revenue, setRevenue] = useState<number>(0)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchBookingRequests = async () => {
    setLoading(true)
    try {
      console.time('fetchBookings');
      
      // Fetch booking requests
      const requestsResponse = await fetch(`${API_BASE_URL}/api/booking-requests`)
      if (!requestsResponse.ok) {
        throw new Error('Failed to fetch booking requests')
      }
      const requestsData = await requestsResponse.json()
      console.log('📥 [Bookings] Raw booking requests data:', requestsData)
      
      const validBookingRequests = (requestsData.bookingRequests || []).filter((request: any) => {
        if (!request.id) {
          console.warn('⚠️ [Bookings] Found booking request without ID:', request)
          return false
        }
        return true
      })
      
      setBookingRequests(validBookingRequests)
      
      // Fetch unified bookings data (returns partitioned structure)
      const bookingsResponse = await fetch(`${API_BASE_URL}/api/bookings`)
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        console.log('📥 [Bookings] Unified bookings data:', bookingsData)
        
        // Set revenue if available
        if (bookingsData.revenue !== undefined) {
          setRevenue(bookingsData.revenue)
          console.log(`💰 [Bookings] Monthly revenue: $${bookingsData.revenue}`)
        }
        
        // Handle both old format (for user bookings) and new format (for studio bookings)
        let allBookings = []
        if (bookingsData.pending || bookingsData.upcoming || bookingsData.past) {
          // New partitioned format - combine all bookings
          allBookings = [
            ...(bookingsData.pending || []),
            ...(bookingsData.upcoming || []),
            ...(bookingsData.past || [])
          ]
        } else {
          // Old format - direct bookings array
          allBookings = bookingsData.bookings || []
        }
        
        const validBookings = allBookings.filter((booking: any) => {
          if (!booking.id) {
            console.warn('⚠️ [Bookings] Found booking without ID:', booking)
            return false
          }
          return true
        })
        
        setConfirmedBookings(validBookings)
      }
      console.timeEnd('fetchBookings');
    } catch (error) {
      console.error('❌ [Bookings] Error fetching booking requests:', error)
      setBookingRequests([])
      setConfirmedBookings([])
      console.timeEnd('fetchBookings');
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookingRequests()
  }, [])

  const handleBookingAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      console.log(`📋 [Bookings] ${action}ing booking request:`, requestId)
      
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
          setBookingRequests(prev => prev.filter(req => req.id !== requestId))
          if (result.booking) {
            setConfirmedBookings(prev => [...prev, result.booking])
          }
          toast({
            title: "Booking Approved",
            description: "The booking request has been approved and added to your calendar."
          })
        } else {
          setBookingRequests(prev => 
            prev.map(req => 
              req.id === requestId 
                ? { ...req, status: 'rejected' as const }
                : req
            )
          )
          toast({
            title: "Booking Rejected",
            description: "The booking request has been rejected."
          })
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process booking action')
      }
    } catch (error) {
      console.error('Error processing booking action:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process booking action. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCancelBooking = async (bookingId: string, isRequest: boolean = false) => {
    try {
      setCancelLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        if (isRequest) {
          setBookingRequests(prev => prev.filter(req => req.id !== bookingId))
          toast({
            title: "Request Cancelled",
            description: "The booking request has been cancelled."
          })
        } else {
          setConfirmedBookings(prev => 
            prev.map(booking => 
              booking.id === bookingId 
                ? { ...booking, status: 'cancelled' as const }
                : booking
            )
          )
          toast({
            title: "Booking Cancelled",
            description: "The booking has been cancelled."
          })
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCancelLoading(false)
    }
  }

  const filteredBookings = bookingRequests.filter(booking => {
    const matchesSearch = booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.studioName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "approved": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const pendingBookings = filteredBookings.filter(b => b.status === "pending")
  const upcomingBookings = confirmedBookings.filter(b => b.status === "confirmed" && new Date(b.date) >= new Date())
  const pastBookings = confirmedBookings.filter(b => b.status === "completed" || new Date(b.date) < new Date())

  console.log('🔍 [Bookings] Rendering with data:', {
    pendingCount: pendingBookings.length,
    upcomingCount: upcomingBookings.length,
    pastCount: pastBookings.length,
    pendingIds: pendingBookings.map(b => b.id),
    upcomingIds: upcomingBookings.map(b => b.id),
    pastIds: pastBookings.map(b => b.id),
    invalidPendingIds: pendingBookings.filter(b => !b.id).length,
    invalidUpcomingIds: upcomingBookings.filter(b => !b.id).length,
    invalidPastIds: pastBookings.filter(b => !b.id).length
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading bookings...</p>
            </div>
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
            <h1 className="text-2xl font-bold tracking-tight">Bookings Management</h1>
            <p className="text-muted-foreground">Manage your studio bookings and requests</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by artist name or room..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold">{pendingBookings.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{bookingRequests.length}</p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month Revenue</p>
                  <p className="text-2xl font-bold">${revenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Requests ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past Bookings ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length > 0 ? (
              pendingBookings.map((booking, index) => (
                <Card key={booking.id || `pending-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{booking.userName}</h3>
                              {buildArtistProfileHrefFromParams(booking.artistSlug, booking.artistId || booking.userId) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  asChild
                                >
                                  <Link 
                                    href={buildArtistProfileHrefFromParams(booking.artistSlug, booking.artistId || booking.userId)!}
                                    title={`View ${booking.userName}'s profile`}
                                  >
                                    <User className="h-3 w-3" />
                                  </Link>
                                </Button>
                              ) : (
                                <span title="Profile not available">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{booking.userEmail}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(booking.date), "MMM dd, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <Badge variant="outline">{booking.studioName}</Badge>
                            {booking.roomName && (
                              <Badge variant="secondary">{booking.roomName}</Badge>
                            )}
                          </div>
                          <p className="text-sm italic">"{booking.message}"</p>
                          <div className="flex items-center gap-4 text-sm">
                            <p className="font-medium">${booking.totalCost} total</p>
                            {booking.hourlyRate && (
                              <p className="text-muted-foreground">${booking.hourlyRate}/hr</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Booking Request Details</DialogTitle>
                              <DialogDescription>
                                Review and respond to this booking request
                              </DialogDescription>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{selectedBooking.userName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-medium">{selectedBooking.userName}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedBooking.userEmail}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Studio</Label>
                                    <p>{selectedBooking.studioName}</p>
                                  </div>
                                  {selectedBooking.roomName && (
                                    <div>
                                      <Label>Room</Label>
                                      <p>{selectedBooking.roomName}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Date</Label>
                                    <p>{format(new Date(selectedBooking.date), "MMM dd, yyyy")}</p>
                                  </div>
                                  <div>
                                    <Label>Time</Label>
                                    <p>{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                                  </div>
                                  <div>
                                    <Label>Duration</Label>
                                    <p>{selectedBooking.duration} hours</p>
                                  </div>
                                  <div>
                                    <Label>Total Cost</Label>
                                    <p className="font-medium">${selectedBooking.totalCost}</p>
                                  </div>
                                  {selectedBooking.hourlyRate && (
                                    <div>
                                      <Label>Hourly Rate</Label>
                                      <p>${selectedBooking.hourlyRate}/hr</p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Label>Message</Label>
                                  <p className="text-sm italic">"{selectedBooking.message}"</p>
                                </div>
                                <div>
                                  <Label htmlFor="response">Response Message (Optional)</Label>
                                  <Textarea
                                    id="response"
                                    placeholder="Add a message for the artist..."
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter className="gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => handleBookingAction(selectedBooking?.id, "reject")}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button onClick={() => handleBookingAction(selectedBooking?.id, "approve")}>
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleCancelBooking(booking.id, true)}
                          disabled={cancelLoading}
                        >
                          Cancel Request
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No pending requests</h3>
                    <p className="text-muted-foreground">New booking requests will appear here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking, index) => (
                <Card key={booking.id || `upcoming-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{booking.userName}</h3>
                            {buildArtistProfileHrefFromParams(booking.artistSlug, booking.artistId || booking.userId) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  asChild
                                >
                                  <Link 
                                    href={buildArtistProfileHrefFromParams(booking.artistSlug, booking.artistId || booking.userId)!}
                                    title={`View ${booking.userName}'s profile`}
                                  >
                                    <User className="h-3 w-3" />
                                  </Link>
                                </Button>
                              ) : (
                                <span title="Profile not available">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
                            </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(booking.date), "MMM dd, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <Badge variant="outline">{booking.studioName}</Badge>
                            {booking.roomName && (
                              <Badge variant="secondary">{booking.roomName}</Badge>
                            )}
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <span className="font-medium">${booking.totalCost}</span>
                          {booking.hourlyRate && (
                            <p className="text-sm text-muted-foreground">${booking.hourlyRate}/hr</p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setDetailsBooking(booking)}>
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                              <DialogDescription>
                                View booking information
                              </DialogDescription>
                            </DialogHeader>
                            {detailsBooking && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{detailsBooking.userName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-medium">{detailsBooking.userName}</h4>
                                    <p className="text-sm text-muted-foreground">{detailsBooking.userEmail}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Studio</Label>
                                    <p>{detailsBooking.studioName}</p>
                                  </div>
                                  {detailsBooking.roomName && (
                                    <div>
                                      <Label>Room</Label>
                                      <p>{detailsBooking.roomName}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Date</Label>
                                    <p>{format(new Date(detailsBooking.date), "MMM dd, yyyy")}</p>
                                  </div>
                                  <div>
                                    <Label>Time</Label>
                                    <p>{detailsBooking.startTime} - {detailsBooking.endTime}</p>
                                  </div>
                                  <div>
                                    <Label>Duration</Label>
                                    <p>{detailsBooking.duration} hours</p>
                                  </div>
                                  <div>
                                    <Label>Total Cost</Label>
                                    <p className="font-medium">${detailsBooking.totalCost}</p>
                                  </div>
                                  {detailsBooking.hourlyRate && (
                                    <div>
                                      <Label>Hourly Rate</Label>
                                      <p>${detailsBooking.hourlyRate}/hr</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Status</Label>
                                    <Badge className={getStatusColor(detailsBooking.status)}>
                                      {detailsBooking.status}
                                    </Badge>
                                  </div>
                                </div>
                                {detailsBooking.message && (
                                  <div>
                                    <Label>Message</Label>
                                    <p className="text-sm italic">"{detailsBooking.message}"</p>
                                  </div>
                                )}
                                {detailsBooking.approvedAt && (
                                  <div>
                                    <Label>Approved At</Label>
                                    <p className="text-sm">{format(new Date(detailsBooking.approvedAt), "MMM dd, yyyy HH:mm")}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            <DialogFooter>
                              {detailsBooking && detailsBooking.status === 'confirmed' && (
                                <Button 
                                  variant="destructive" 
                                  onClick={() => handleCancelBooking(detailsBooking.id, false)}
                                  disabled={cancelLoading}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Booking
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        {booking.status === 'confirmed' && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleCancelBooking(booking.id, false)}
                            disabled={cancelLoading}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No upcoming bookings</h3>
                    <p className="text-muted-foreground">Approved bookings will appear here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length > 0 ? (
              pastBookings.map((booking, index) => (
                <Card key={booking.id || `past-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{booking.userName}</h3>
                            {buildArtistProfileHrefFromParams(booking.artistSlug, booking.artistId || booking.userId) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  asChild
                                >
                                  <Link 
                                    href={buildArtistProfileHrefFromParams(booking.artistSlug, booking.artistId || booking.userId)!}
                                    title={`View ${booking.userName}'s profile`}
                                  >
                                    <User className="h-3 w-3" />
                                  </Link>
                                </Button>
                              ) : (
                                <span title="Profile not available">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
                            </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(booking.date), "MMM dd, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <Badge variant="outline">{booking.studioName}</Badge>
                            {booking.roomName && (
                              <Badge variant="secondary">{booking.roomName}</Badge>
                            )}
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <span className="font-medium">${booking.totalCost}</span>
                          {booking.hourlyRate && (
                            <p className="text-sm text-muted-foreground">${booking.hourlyRate}/hr</p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setDetailsBooking(booking)}>
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                              <DialogDescription>
                                View booking information
                              </DialogDescription>
                            </DialogHeader>
                            {detailsBooking && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{detailsBooking.userName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-medium">{detailsBooking.userName}</h4>
                                    <p className="text-sm text-muted-foreground">{detailsBooking.userEmail}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Studio</Label>
                                    <p>{detailsBooking.studioName}</p>
                                  </div>
                                  {detailsBooking.roomName && (
                                    <div>
                                      <Label>Room</Label>
                                      <p>{detailsBooking.roomName}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Date</Label>
                                    <p>{format(new Date(detailsBooking.date), "MMM dd, yyyy")}</p>
                                  </div>
                                  <div>
                                    <Label>Time</Label>
                                    <p>{detailsBooking.startTime} - {detailsBooking.endTime}</p>
                                  </div>
                                  <div>
                                    <Label>Duration</Label>
                                    <p>{detailsBooking.duration} hours</p>
                                  </div>
                                  <div>
                                    <Label>Total Cost</Label>
                                    <p className="font-medium">${detailsBooking.totalCost}</p>
                                  </div>
                                  {detailsBooking.hourlyRate && (
                                    <div>
                                      <Label>Hourly Rate</Label>
                                      <p>${detailsBooking.hourlyRate}/hr</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Status</Label>
                                    <Badge className={getStatusColor(detailsBooking.status)}>
                                      {detailsBooking.status}
                                    </Badge>
                                  </div>
                                </div>
                                {detailsBooking.message && (
                                  <div>
                                    <Label>Message</Label>
                                    <p className="text-sm italic">"{detailsBooking.message}"</p>
                                  </div>
                                )}
                                {detailsBooking.approvedAt && (
                                  <div>
                                    <Label>Approved At</Label>
                                    <p className="text-sm">{format(new Date(detailsBooking.approvedAt), "MMM dd, yyyy HH:mm")}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No past bookings</h3>
                    <p className="text-muted-foreground">Completed bookings will appear here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 