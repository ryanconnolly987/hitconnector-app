'use client'

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, Clock, DollarSign, User, MessageSquare, X } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Room {
  id: string
  name: string
  description: string
  hourlyRate: number
  capacity: number
  equipment: string[]
  images: string[]
}

interface Studio {
  id: string
  name: string
  location: string
  hourlyRate: number
  specialties: string[]
  rating: number
  reviewCount: number
  description: string
  amenities: string[]
  images: string[]
  equipment: string[]
  rooms?: Room[]
  createdAt: string
  owner: string
}

interface BookingDialogProps {
  studio: Studio
  children: React.ReactNode
}

export function BookingDialog({ studio, children }: BookingDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    message: ""
  })

  // Fetch room data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchRooms()
    }
  }, [isOpen, studio.id])

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/studios/${studio.id}`)
      if (response.ok) {
        const data = await response.json()
        const studioData = data.studio || data
        setRooms(studioData.rooms || [])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  // Generate time slots (9 AM to 10 PM)
  const timeSlots = Array.from({ length: 26 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    if (hour > 22) return null
    return `${hour.toString().padStart(2, '0')}:${minute}`
  }).filter((time): time is string => time !== null)

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0
    const start = new Date(`2000-01-01T${bookingData.startTime}:00`)
    const end = new Date(`2000-01-01T${bookingData.endTime}:00`)
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
  }

  const totalCost = selectedRoom ? calculateDuration() * selectedRoom.hourlyRate : 0

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    setSelectedRoom(room || null)
  }

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a studio session.",
        variant: "destructive"
      })
      return
    }

    if (!selectedRoom) {
      toast({
        title: "Missing Room Selection",
        description: "Please select a room to book.",
        variant: "destructive"
      })
      return
    }

    if (!bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (calculateDuration() <= 0) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/booking-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studioId: studio.id,
          studioName: studio.name,
          roomId: selectedRoom.id,
          roomName: selectedRoom.name,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          date: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          duration: calculateDuration(),
          hourlyRate: selectedRoom.hourlyRate,
          totalCost: totalCost,
          message: bookingData.message
        }),
      })

      if (response.ok) {
        const booking = await response.json()
        toast({
          title: "Booking Request Sent!",
          description: `Your booking request for ${selectedRoom.name} at ${studio.name} has been sent. The studio will respond within 24 hours.`
        })
        setIsOpen(false)
        setBookingData({ date: "", startTime: "", endTime: "", message: "" })
        setSelectedRoom(null)
      } else {
        const error = await response.json()
        if (response.status === 409) {
          toast({
            title: "Time Slot Unavailable",
            description: "This time slot is already booked. Please select a different time or room.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Booking Failed",
            description: error.error || "Failed to create booking. Please try again.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: "Network Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Studio Session</DialogTitle>
          <DialogDescription>
            Request a booking at {studio.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room">Room *</Label>
            <Select value={selectedRoom?.id || ""} onValueChange={handleRoomSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} - ${room.hourlyRate}/hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoom && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium">{selectedRoom.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{selectedRoom.description}</p>
              <p className="text-sm">
                <span className="font-medium">Capacity:</span> {selectedRoom.capacity} people
              </p>
              <p className="text-sm">
                <span className="font-medium">Rate:</span> ${selectedRoom.hourlyRate}/hour
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={bookingData.date}
              onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Select 
                value={bookingData.startTime} 
                onValueChange={(value) => setBookingData(prev => ({ ...prev, startTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Time *</Label>
              <Select 
                value={bookingData.endTime} 
                onValueChange={(value) => setBookingData(prev => ({ ...prev, endTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {calculateDuration() > 0 && selectedRoom && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Duration:
                </span>
                <span>{calculateDuration()} hours</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Rate:
                </span>
                <span>${selectedRoom.hourlyRate}/hour</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>Total Cost:</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell the studio about your project..."
              value={bookingData.message}
              onChange={(e) => setBookingData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleBooking} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 