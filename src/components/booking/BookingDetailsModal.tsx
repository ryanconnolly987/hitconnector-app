"use client"

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, User, DollarSign, X } from 'lucide-react'
import { useBookingDetails } from './BookingDetailsProvider'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '@/lib/config'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

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
  artistSlug?: string
  artistId?: string
  engineer?: {
    displayName: string
  }
}

export function BookingDetailsModal() {
  const { isOpen, close, bookingId } = useBookingDetails()
  const { user } = useAuth()
  const { toast } = useToast()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails(bookingId)
    }
  }, [isOpen, bookingId])

  const fetchBookingDetails = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`)
      
      if (!response.ok) {
        throw new Error('Booking not found')
      }
      
      const bookingData = await response.json()
      setBooking(bookingData)
    } catch (error) {
      console.error('Error fetching booking details:', error)
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!booking || !user) return

    setActionLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          userId: user.id
        }),
      })

      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: "The booking has been successfully cancelled.",
        })
        close()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to cancel booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (!booking && !loading) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-md booking-details-modal">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            View booking information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : booking ? (
          <div className="space-y-4">
            {/* Artist Information */}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{booking.userName}</h4>
                <p className="text-sm text-muted-foreground">{booking.userEmail}</p>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Studio</Label>
                <p>{booking.studioName}</p>
              </div>
              {booking.roomName && (
                <div>
                  <Label>Room</Label>
                  <p>{booking.roomName}</p>
                </div>
              )}
              {booking.engineer && (
                <div>
                  <Label>Engineer Preference</Label>
                  <p>{booking.engineer.displayName}</p>
                </div>
              )}
              <div>
                <Label>Date</Label>
                <p>{format(new Date(booking.date), "MMM dd, yyyy")}</p>
              </div>
              <div>
                <Label>Time</Label>
                <p>{booking.startTime} - {booking.endTime}</p>
              </div>
              <div>
                <Label>Duration</Label>
                <p>{booking.duration} hours</p>
              </div>
              <div>
                <Label>Total Cost</Label>
                <p className="font-medium">${booking.totalCost}</p>
              </div>
              <div className="col-span-2">
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            </div>

            {booking.message && (
              <div>
                <Label>Message</Label>
                <p className="text-sm italic">"{booking.message}"</p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          {booking && booking.status === 'confirmed' && (
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={actionLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 