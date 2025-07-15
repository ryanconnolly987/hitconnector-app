"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface Booking {
  id: string
  studioName: string
  date: string
  startTime?: string
  endTime?: string
  time?: string
  status: string
}

interface CalendarDropdownProps {
  bookings: Booking[]
  children?: React.ReactNode
}

export function CalendarDropdown({ bookings, children }: CalendarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return bookings.filter(booking => booking.date === dateString)
  }

  // Get all booking dates for highlighting
  const getBookingDates = () => {
    return bookings.map(booking => new Date(booking.date))
  }

  // Custom day component to show dots for bookings
  const modifiers = {
    booked: getBookingDates(),
  }

  const modifiersStyles = {
    booked: {
      position: 'relative' as const,
    }
  }

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : []

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
              components={{
                Day: ({ date, ...props }) => {
                  const dayBookings = getBookingsForDate(date)
                  const hasBookings = dayBookings.length > 0
                  
                  // Extract non-DOM props to prevent React warnings
                  // displayMonth is passed by react-day-picker but shouldn't reach the DOM
                  const { 
                    displayMonth,
                    ...buttonProps 
                  } = props

                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative w-full h-full">
                          <button {...buttonProps} className="w-full h-full p-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-md">
                            {format(date, 'd')}
                            {hasBookings && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                              </div>
                            )}
                          </button>
                        </div>
                      </TooltipTrigger>
                      {hasBookings && (
                        <TooltipContent>
                          <div className="space-y-1">
                            {dayBookings.map((booking, index) => (
                              <div key={index} className="text-xs">
                                <div className="font-medium">{booking.studioName}</div>
                                <div className="text-muted-foreground">
                                  {booking.time || (booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime}` : 'Time TBD')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                }
              }}
            />
            
            {selectedDate && selectedDateBookings.length > 0 && (
              <div className="mt-4 p-3 border-t">
                <h4 className="text-sm font-medium mb-2">
                  Bookings for {format(selectedDate, "MMM d, yyyy")}
                </h4>
                <div className="space-y-2">
                  {selectedDateBookings.map((booking) => (
                    <div key={booking.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{booking.studioName}</span>
                        <Badge variant={booking.status === "confirmed" ? "default" : "outline"} className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {booking.time || (booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime}` : 'Time TBD')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedDate && selectedDateBookings.length === 0 && (
              <div className="mt-4 p-3 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  No bookings on {format(selectedDate, "MMM d, yyyy")}
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
} 