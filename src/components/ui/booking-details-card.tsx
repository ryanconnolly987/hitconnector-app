"use client"

import { useState } from "react"
import { CalendarDays, Clock, MapPin, X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface BookingDetailsCardProps {
  booking: {
    id: string
    studioName: string
    studioImage?: string
    date: string
    time?: string
    startTime?: string
    endTime?: string
    location?: string
    status: string
  }
  onCancel?: (bookingId: string) => void
}

export function BookingDetailsCard({ booking, onCancel }: BookingDetailsCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to cancel bookings.",
        variant: "destructive"
      })
      return
    }

    setIsCancelling(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${booking.id}?userId=${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been successfully cancelled.",
        })
        setShowCancelDialog(false)
        setIsOpen(false)
        onCancel?.(booking.id)
      } else {
        const error = await response.json()
        toast({
          title: "Cancellation Failed",
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
      setIsCancelling(false)
    }
  }

  // Format time display
  const timeDisplay = booking.time || 
    (booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime}` : 'Time TBD')

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shadow-sm border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                {booking.studioImage && (
                  <img
                    src={booking.studioImage}
                    alt={booking.studioName}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{booking.studioName}</CardTitle>
                <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
                  {booking.status === "confirmed" ? "Confirmed" : booking.status}
                </Badge>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                View Details
                {isOpen ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3 border-t pt-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Time:</span>
                  <span>{timeDisplay}</span>
                </div>
                {booking.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span>
                    <span>{booking.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Booking ID:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {booking.id}
                  </span>
                </div>
              </div>

              {booking.status === "confirmed" && (
                <div className="pt-3 border-t">
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel your booking at {booking.studioName} on {booking.date}?
                          This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                        <div className="text-sm text-destructive">
                          <p className="font-medium">Important Notice</p>
                          <p>Cancelling this booking may affect your relationship with the studio. Please review the studio's cancellation policy.</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Keep Booking
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleCancel}
                          disabled={isCancelling}
                        >
                          {isCancelling ? "Cancelling..." : "Cancel Booking"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
} 