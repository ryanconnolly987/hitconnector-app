"use client"

import { useState } from "react"
import { format, parseISO, isAfter, isBefore } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, Grid, CalendarDays, Music, Eye } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"

// Define the booking type
interface Booking {
  id: string
  studioName: string
  studioImage: string
  date: string
  startTime: string
  endTime: string
  location: string
  room: string
  status: "confirmed" | "pending" | "completed" | "cancelled"
}

export default function RapperBookingsPage() {
  // State for view mode (grid or calendar)
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Mock bookings data
  const allBookings: Booking[] = [
    {
      id: "1",
      studioName: "Soundwave Studios",
      studioImage: "/placeholder.svg?height=80&width=80",
      date: "2025-05-15",
      startTime: "14:00",
      endTime: "17:00",
      location: "Los Angeles, CA",
      room: "Studio A",
      status: "confirmed",
    },
    {
      id: "2",
      studioName: "Beat Factory",
      studioImage: "/placeholder.svg?height=80&width=80",
      date: "2025-05-22",
      startTime: "10:00",
      endTime: "13:00",
      location: "Atlanta, GA",
      room: "Studio B",
      status: "pending",
    },
    {
      id: "3",
      studioName: "Rhythm House",
      studioImage: "/placeholder.svg?height=80&width=80",
      date: "2025-04-28",
      startTime: "15:00",
      endTime: "18:00",
      location: "New York, NY",
      room: "Main Studio",
      status: "completed",
    },
    {
      id: "4",
      studioName: "Flow Records",
      studioImage: "/placeholder.svg?height=80&width=80",
      date: "2025-04-15",
      startTime: "13:00",
      endTime: "16:00",
      location: "Miami, FL",
      room: "Studio C",
      status: "completed",
    },
    {
      id: "5",
      studioName: "Echo Chamber",
      studioImage: "/placeholder.svg?height=80&width=80",
      date: "2025-06-05",
      startTime: "18:00",
      endTime: "21:00",
      location: "Chicago, IL",
      room: "Vocal Booth",
      status: "confirmed",
    },
    {
      id: "6",
      studioName: "Platinum Sound",
      studioImage: "/placeholder.svg?height=80&width=80",
      date: "2025-06-12",
      startTime: "11:00",
      endTime: "14:00",
      location: "Nashville, TN",
      room: "Studio A",
      status: "confirmed",
    },
  ]

  // Filter bookings based on tab (upcoming or past)
  const upcomingBookings = allBookings.filter((booking) => {
    const bookingDate = parseISO(booking.date)
    const today = new Date()
    return isAfter(bookingDate, today) || booking.status === "pending"
  })

  const pastBookings = allBookings.filter((booking) => {
    const bookingDate = parseISO(booking.date)
    const today = new Date()
    return isBefore(bookingDate, today) && booking.status !== "pending"
  })

  // Get bookings for a specific date (for calendar view)
  const getBookingsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return allBookings.filter((booking) => booking.date === dateString)
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
            <a href="/find-studios">Find Studios</a>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <div className="bg-muted/50 p-4 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                <img
                  src={booking.studioImage || "/placeholder.svg"}
                  alt={booking.studioName}
                  className="h-full w-full object-cover"
                />
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
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.room}</span>
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
            modifiers={{
              booked: (date) => {
                const dateString = format(date, "yyyy-MM-dd")
                return allBookings.some((booking) => booking.date === dateString)
              },
            }}
            modifiersStyles={{
              booked: { fontWeight: "bold", backgroundColor: "hsl(var(--primary) / 0.1)" },
            }}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </h3>
          {bookingsForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {bookingsForSelectedDate.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                        <img
                          src={booking.studioImage || "/placeholder.svg"}
                          alt={booking.studioName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">{booking.studioName}</h4>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Music className="h-3 w-3 text-muted-foreground" />
                            <span>{booking.room}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/bookings/${booking.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">No bookings for this date</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Track and manage your studio sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendar
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Bookings ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past Bookings ({pastBookings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-4">
            {renderBookingCards(upcomingBookings)}
          </TabsContent>
          <TabsContent value="past" className="space-y-4">
            {renderBookingCards(pastBookings)}
          </TabsContent>
        </Tabs>
      ) : (
        renderCalendarView()
      )}
    </div>
  )
}