"use client"

import { useState } from "react"
import { format, isSameMonth } from "date-fns"
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
  studioName?: string
  studio?: {
    id: string
    name: string
    slug: string
    avatarUrl: string | null
  }
  date: string
  startTime?: string
  endTime?: string
  start?: string
  end?: string
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
          <div className="p-4">
            <div className="mb-3">
              <h4 className="font-medium text-sm text-muted-foreground">Your Bookings Calendar</h4>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md"
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

                  // Check if day is outside the current month
                  const isOutsideMonth = displayMonth ? !isSameMonth(date, displayMonth) : false
                  
                  // Don't show bookings indicators for outside month days
                  const showBookings = hasBookings && !isOutsideMonth

                  const dayContent = (
                    <div className="relative w-full h-full">
                      <button 
                        {...buttonProps} 
                        disabled={isOutsideMonth}
                        className={`
                          w-8 h-8 mx-auto flex items-center justify-center text-sm rounded-md transition-all duration-200 relative
                          ${isOutsideMonth 
                            ? 'text-gray-400 cursor-default hover:bg-transparent' 
                            : showBookings 
                              ? 'text-foreground hover:bg-primary/10 hover:text-primary border border-primary/20' 
                              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                          }
                        `}
                      >
                        {format(date, 'd')}
                        {showBookings && (
                          <>
                            <div className="absolute top-0.5 right-0.5">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                            </div>
                            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                              <div className="flex gap-0.5">
                                {dayBookings.slice(0, 3).map((_, index) => (
                                  <div key={index} className="w-0.5 h-0.5 bg-primary rounded-full"></div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </button>
                    </div>
                  )

                  // Only wrap with tooltip if it's not an outside month day and has bookings
                  if (showBookings) {
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {dayContent}
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-64">
                          <div className="space-y-2">
                            <div className="font-medium text-xs text-center border-b pb-1">
                              {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} on {format(date, 'MMM d')}
                            </div>
                            {dayBookings.slice(0, 3).map((booking, index) => (
                              <div key={index} className="text-xs bg-background/50 p-2 rounded border">
                                <div className="font-medium text-primary">{booking.studio?.name || booking.studioName}</div>
                                <div className="text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {booking.time || (booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime}` : (booking.start && booking.end ? `${booking.start} - ${booking.end}` : 'Time TBD'))}
                                </div>
                                <Badge variant={booking.status === "confirmed" ? "default" : "outline"} className="text-xs mt-1">
                                  {booking.status}
                                </Badge>
                              </div>
                            ))}
                            {dayBookings.length > 3 && (
                              <div className="text-xs text-center text-muted-foreground">
                                +{dayBookings.length - 3} more booking{dayBookings.length - 3 !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  }
                  
                  // Return day content without tooltip for outside days or days without bookings
                  return dayContent
                }
              }}
            />
            
            {selectedDate && selectedDateBookings.length > 0 && (
              <div className="mt-4 p-4 border-t bg-muted/30 rounded-b-md">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Bookings for {format(selectedDate, "MMM d, yyyy")}
                </h4>
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <div key={booking.id} className="bg-background rounded-md p-3 border shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">{booking.studio?.name || booking.studioName}</span>
                        <Badge variant={booking.status === "confirmed" ? "default" : "outline"} className="text-xs">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {booking.time || (booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime}` : (booking.start && booking.end ? `${booking.start} - ${booking.end}` : 'Time TBD'))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedDate && selectedDateBookings.length === 0 && (
              <div className="mt-4 p-4 border-t bg-muted/30 rounded-b-md text-center">
                <div className="flex flex-col items-center gap-2">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No bookings on {format(selectedDate, "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    This day is available for new bookings
                  </p>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
} 