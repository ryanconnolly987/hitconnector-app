"use client"

import { useState } from "react"
import { format, isAfter, isBefore, parseISO } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, AlertTriangle, Eye, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Define the booking type
interface Booking {
  id: string
  artistName: string
  artistImage: string
  date: string
  startTime: string
  endTime: string
  room: string
  status: "confirmed" | "pending" | "cancelled"
}

export default function StudioBookingsPage() {
  // Mock bookings data
  const allBookings: Booking[] = [
    {
      id: "1",
      artistName: "Marcus Johnson",
      artistImage: "/placeholder.svg?height=40&width=40",
      date: "2025-05-15",
      startTime: "14:00",
      endTime: "17:00",
      room: "Studio A",
      status: "confirmed",
    },
    {
      id: "2",
      artistName: "Alicia Reynolds",
      artistImage: "/placeholder.svg?height=40&width=40",
      date: "2025-05-22",
      startTime: "10:00",
      endTime: "13:00",
      room: "Studio B",
      status: "pending",
    },
    {
      id: "3",
      artistName: "DJ Maximus",
      artistImage: "/placeholder.svg?height=40&width=40",
      date: "2025-05-28",
      startTime: "18:00",
      endTime: "22:00",
      room: "Studio A",
      status: "confirmed",
    },
    {
      id: "4",
      artistName: "Lyrical Genius",
      artistImage: "/placeholder.svg?height=40&width=40",
      date: "2025-06-04",
      startTime: "15:00",
      endTime: "18:00",
      room: "Studio C",
      status: "pending",
    },
    {
      id: "5",
      artistName: "Beat Master",
      artistImage: "/placeholder.svg?height=40&width=40",
      date: "2025-06-10",
      startTime: "11:00",
      endTime: "14:00",
      room: "Studio B",
      status: "confirmed",
    },
    {
      id: "6",
      artistName: "Vocal Queen",
      artistImage: "/placeholder.svg?height=40&width=40",
      date: "2025-04-28",
      startTime: "13:00",
      endTime: "16:00",
      room: "Studio A",
      status: "confirmed",
    },
    {
      id: "7",
      artistName: "Guitar Hero",
      artistImage: "/placeholder.svg?height=40&width=40",
      date: "2025-04-15",
      startTime: "09:00",
      endTime: "12:00",
      room: "Studio C",
      status: "cancelled",
    },
  ]

  // State for filters
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roomFilter, setRoomFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("upcoming")

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Filter bookings based on current filters and tab
  const filteredBookings = allBookings.filter((booking) => {
    const bookingDate = parseISO(booking.date)
    const today = new Date()

    // Filter by tab (upcoming or past)
    if (activeTab === "upcoming" && isBefore(bookingDate, today)) {
      return false
    }
    if (activeTab === "past" && isAfter(bookingDate, today)) {
      return false
    }

    // Filter by date range
    if (dateRange.from && isBefore(bookingDate, dateRange.from)) {
      return false
    }
    if (dateRange.to && isAfter(bookingDate, dateRange.to)) {
      return false
    }

    // Filter by status
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false
    }

    // Filter by room
    if (roomFilter !== "all" && booking.room !== roomFilter) {
      return false
    }

    return true
  })

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined })
    setStatusFilter("all")
    setRoomFilter("all")
  }

  // Check if any filters are active
  const isFiltering =
    dateRange.from !== undefined || dateRange.to !== undefined || statusFilter !== "all" || roomFilter !== "all"

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bookings Manager</h1>
        <p className="text-muted-foreground">Manage and track all your studio bookings</p>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
            <TabsTrigger value="past">Past Bookings</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2">
            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Date Range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar 
                  initialFocus 
                  mode="range" 
                  selected={dateRange} 
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to
                    })
                  }} 
                  numberOfMonths={2} 
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Room Filter */}
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="Studio A">Studio A</SelectItem>
                <SelectItem value="Studio B">Studio B</SelectItem>
                <SelectItem value="Studio C">Studio C</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {isFiltering && (
              <Button variant="ghost" onClick={clearFilters} size="icon">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          <BookingsTable bookings={filteredBookings} />
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <BookingsTable bookings={filteredBookings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Bookings Table Component
function BookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Artist</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <TableRow
                key={booking.id}
                className={cn(booking.status === "pending" && "bg-yellow-50 dark:bg-yellow-950/20")}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={booking.artistImage || "/placeholder.svg"} alt={booking.artistName} />
                      <AvatarFallback>
                        {booking.artistName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{booking.artistName}</span>
                  </div>
                </TableCell>
                <TableCell>{format(parseISO(booking.date), "MMMM d, yyyy")}</TableCell>
                <TableCell>
                  {booking.startTime} - {booking.endTime}
                </TableCell>
                <TableCell>{booking.room}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {booking.status === "pending" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "default"
                          : booking.status === "pending"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/studio-bookings/${booking.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No bookings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}