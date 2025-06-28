"use client"

import { useState, useEffect } from "react"
import { format, parseISO, isAfter, isBefore } from "date-fns"
import { CalendarIcon, Clock, MapPin, Music, Eye, Grid, Calendar as CalendarView } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import Link from "next/link"

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
  status: "confirmed" | "completed" | "cancelled" | "pending"
  createdAt: string
  approvedAt?: string
}

export default function RapperBookingsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch user's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        console.log('🔍 [Rapper Bookings] Fetching bookings for user:', user.id)
        
        const response = await fetch(`${API_BASE_URL}/api/bookings?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [Rapper Bookings] Bookings fetched:', data.bookings?.length || 0)
          
          // Validate and filter bookings
          const validBookings = (data.bookings || []).filter((booking: any) => {
            if (!booking.id) {
              console.warn('⚠️ [Rapper Bookings] Found booking without ID:', booking)
              return false
            }
            return true
          })
          
          setBookings(validBookings)
        } else {
          console.error('❌ [Rapper Bookings] Failed to fetch bookings')
          setBookings([])
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookings([])
        toast({
          title: "Error",
          description: "Failed to load your bookings. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, toast])

  // Filter bookings based on tab (upcoming or past)
  const upcomingBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.date)
    const today = new Date()
    return isAfter(bookingDate, today) || booking.status === "pending" || booking.status === "confirmed"
  })

  const pastBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.date)
    const today = new Date()
    return (isBefore(bookingDate, today) && booking.status !== "pending") || booking.status === "completed"
  })

  // Get bookings for a specific date (for calendar view)
  const getBookingsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return bookings.filter((booking) => booking.date === dateString)
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "outline"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Render booking cards
  const renderBookingCards = (bookings: Booking[]) => {
    if (bookings.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Music className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You don't have any {bookings === upcomingBookings ? "upcoming" : "past"} studio sessions.
          </p>
          <Button asChild>
            <Link href="/studios">Find Studios</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <div className="bg-muted/50 p-4 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{booking.studioName}</h3>
                <Badge variant={getStatusVariant(booking.status)}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(parseISO(booking.date), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.startTime} - {booking.endTime}
                  </span>
                </div>
                {booking.roomName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.roomName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>${booking.totalCost}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button variant="outline" className="w-full" asChild>
                <a href={`/bookings/${booking.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // Render calendar view
  const renderCalendarView = () => {
    const bookingsForSelectedDate = selectedDate ? getBookingsForDate(selectedDate) : []

    return (
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Bookings for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}
          </h3>
          {bookingsForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {bookingsForSelectedDate.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{booking.studioName}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{booking.startTime} - {booking.endTime}</span>
                          {booking.roomName && <span>{booking.roomName}</span>}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No bookings</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don't have any bookings for this date.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">
            Manage your studio sessions and track your booking history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarView className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {renderBookingCards(upcomingBookings)}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {renderBookingCards(pastBookings)}
          </TabsContent>
        </Tabs>
      ) : (
        renderCalendarView()
      )}
    </div>
  )
}