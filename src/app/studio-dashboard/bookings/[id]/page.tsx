'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Clock, User, DollarSign, MessageSquare, X, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BookingDetails {
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
  status: 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
  createdAt: string
  approvedAt?: string
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const bookingId = params.id as string

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      
      // Try fetching as a booking first
      const bookingsResponse = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`)
      if (bookingsResponse.ok) {
        const bookingData = await bookingsResponse.json()
        setBooking(bookingData)
        return
      }
      
      // If not found in bookings, try booking requests
      const studiosResponse = await fetch(`${API_BASE_URL}/api/studios`)
      if (studiosResponse.ok) {
        const studiosData = await studiosResponse.json()
        const userStudios = studiosData.studios.filter((studio: any) => 
          studio.owner === user?.email || studio.owner === user?.id
        )
        
        // Search through all booking requests for user's studios
        for (const studio of userStudios) {
          const requestsResponse = await fetch(`${API_BASE_URL}/api/booking-requests?studioId=${studio.id}`)
          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json()
            const foundRequest = requestsData.bookingRequests?.find((req: any) => req.id === bookingId)
            if (foundRequest) {
              setBooking(foundRequest)
              return
            }
          }
        }
      }
      
      // If still not found, show error
      toast({
        title: "Booking Not Found",
        description: "The requested booking could not be found.",
        variant: "destructive"
      })
      router.push('/studio-dashboard/bookings')
      
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookingAction = async (action: 'approve' | 'reject' | 'cancel') => {
    if (!booking) return
    
    try {
      setActionLoading(true)
      
      let endpoint = ''
      const method = 'PUT'
      let body = {}
      
      if (action === 'cancel') {
        endpoint = `${API_BASE_URL}/api/bookings/${booking.id}/cancel`
      } else {
        endpoint = `${API_BASE_URL}/api/booking-requests/${booking.id}`
        body = { action }
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (action === 'approve') {
          toast({
            title: "Booking Approved",
            description: "The booking has been confirmed and added to your calendar.",
          })
          // Update booking status
          setBooking(prev => prev ? { ...prev, status: 'confirmed' } : null)
        } else if (action === 'reject') {
          toast({
            title: "Booking Rejected",
            description: "The booking request has been declined.",
          })
          setBooking(prev => prev ? { ...prev, status: 'rejected' } : null)
        } else if (action === 'cancel') {
          toast({
            title: "Booking Cancelled",
            description: "The booking has been cancelled.",
          })
          setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update booking. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error handling booking action:', error)
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "approved": 
      case "confirmed": return "bg-green-100 text-green-800"
      case "rejected": 
      case "cancelled": return "bg-red-100 text-red-800"
      case "completed": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <AlertCircle className="h-4 w-4" />
      case "approved":
      case "confirmed": return <CheckCircle className="h-4 w-4" />
      case "rejected":
      case "cancelled": return <X className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-muted/40 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => router.push('/studio-dashboard/bookings')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Booking Not Found</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">The requested booking could not be found.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/studio-dashboard/bookings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Booking Details</h1>
            <p className="text-muted-foreground">View and manage booking information</p>
          </div>
        </div>

        {/* Status Alert */}
        {booking.status === 'pending' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This booking request is pending your approval. Review the details below and approve or reject the request.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Artist Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Artist Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{booking.userName}</h3>
                    <p className="text-muted-foreground">{booking.userEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Studio</Label>
                    <p className="text-sm">{booking.studioName}</p>
                  </div>
                  {booking.roomName && (
                    <div>
                      <Label className="text-sm font-medium">Room</Label>
                      <p className="text-sm">{booking.roomName}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{format(new Date(booking.date), "EEEE, MMMM dd, yyyy")}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{booking.startTime} - {booking.endTime}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-sm">{booking.duration} hours</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </Badge>
                  </div>
                </div>

                {booking.message && (
                  <div>
                    <Label className="text-sm font-medium">Message from Artist</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm italic">"{booking.message}"</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Booking Timeline</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Request Created:</span>
                      <span>{format(new Date(booking.createdAt), "MMM dd, yyyy HH:mm")}</span>
                    </div>
                    {booking.approvedAt && (
                      <div className="flex justify-between">
                        <span>Approved:</span>
                        <span>{format(new Date(booking.approvedAt), "MMM dd, yyyy HH:mm")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.hourlyRate && (
                  <div className="flex justify-between text-sm">
                    <span>Hourly Rate:</span>
                    <span>${booking.hourlyRate}/hour</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span>{booking.duration} hours</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>${booking.totalCost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.status === 'pending' && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => handleBookingAction('approve')}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Booking
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleBookingAction('reject')}
                      disabled={actionLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Booking
                    </Button>
                  </>
                )}
                
                {booking.status === 'confirmed' && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => handleBookingAction('cancel')}
                    disabled={actionLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${booking.userEmail}`}>
                    Contact Artist
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 