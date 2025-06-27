'use client'

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, Music, DollarSign, CheckCircle, XCircle, AlertCircle, MessageSquare, X, User } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'approved' | 'rejected'
  createdAt: string
  approvedAt?: string
  updatedAt?: string
}

export default function BookingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // Fetch user's bookings and booking requests
      const [bookingsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bookings?userId=${user.id}`),
        // Fetch all booking requests since we need to filter by user on frontend
        fetch(`${API_BASE_URL}/api/booking-requests`)
      ])
      
      const allBookings: Booking[] = []
      
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        allBookings.push(...(bookingsData.bookings || []))
      }
      
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        // Filter requests for this user
        const userRequests = (requestsData.bookingRequests || []).filter((req: any) => req.userId === user.id)
        allBookings.push(...userRequests)
      }
      
      setBookings(allBookings)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to load bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancelLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
        })
        
        // Update the booking status locally
        setBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'cancelled' as const }
              : booking
          )
        )
        
        // Close dialog if open
        setSelectedBooking(null)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to cancel booking. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCancelLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const filteredAndSortedBookings = bookings
    .filter(booking => statusFilter === "all" || booking.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "studio":
          return a.studioName.localeCompare(b.studioName)
        default:
          return 0
      }
    })

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
              <p className="text-muted-foreground">
                You need to be logged in to view your bookings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">
            Manage your studio booking requests and sessions
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Session Date</SelectItem>
              <SelectItem value="created">Date Created</SelectItem>
              <SelectItem value="studio">Studio Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchBookings}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Bookings List */}
            {filteredAndSortedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                  <p className="text-muted-foreground mb-4">
                    {statusFilter === "all" 
                      ? "You haven't made any booking requests yet."
                      : `No ${statusFilter} bookings found.`
                    }
                  </p>
                  <Button onClick={() => window.location.href = '/find-studios'}>
                    Find Studios
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{booking.studioName}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(booking.status)}
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </div>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(booking.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.roomName || 'Room TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${booking.totalCost.toFixed(2)}</span>
                            </div>
                          </div>

                          {booking.message && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">
                                <strong>Message:</strong> {booking.message}
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Requested on {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancelLoading}
                            >
                              {booking.status === 'pending' ? 'Cancel Request' : 'Cancel Booking'}
                            </Button>
                          )}
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedBooking(booking)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Booking Details</DialogTitle>
                                <DialogDescription>
                                  View your booking information
                                </DialogDescription>
                              </DialogHeader>
                              {selectedBooking && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>{selectedBooking.studioName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h4 className="font-medium">{selectedBooking.studioName}</h4>
                                      {selectedBooking.roomName && (
                                        <p className="text-sm text-muted-foreground">{selectedBooking.roomName}</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm">
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
                                      <Label>Status</Label>
                                      <Badge className={getStatusColor(selectedBooking.status)}>
                                        {selectedBooking.status}
                                      </Badge>
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

                                  {selectedBooking.message && (
                                    <div>
                                      <Label>Your Message</Label>
                                      <div className="mt-2 p-3 bg-muted rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <p className="text-sm italic">"{selectedBooking.message}"</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label>Booking Timeline</Label>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span>Request Created:</span>
                                        <span>{format(new Date(selectedBooking.createdAt), "MMM dd, yyyy HH:mm")}</span>
                                      </div>
                                      {selectedBooking.approvedAt && (
                                        <div className="flex justify-between">
                                          <span>Approved:</span>
                                          <span>{format(new Date(selectedBooking.approvedAt), "MMM dd, yyyy HH:mm")}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                {selectedBooking && (selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleCancelBooking(selectedBooking.id)}
                                    disabled={cancelLoading}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    {selectedBooking.status === 'pending' ? 'Cancel Request' : 'Cancel Booking'}
                                  </Button>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 