'use client'

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, Clock, DollarSign, User, MessageSquare, X, CreditCard, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { useRouter } from "next/navigation"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Room {
  id: string
  name: string
  description: string
  hourlyRate: number
  capacity: number
  equipment: string[]
  images: string[]
}

interface StaffMember {
  id: string
  name: string
  role: string
  experience: string
  profileImage: string
}

interface Studio {
  id: string
  name: string
  description: string
  location: string
  hourlyRate: number
  rating: number
  images: string[]
  rooms?: Room[]
  staff?: StaffMember[]
}

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface BookingDialogProps {
  studio: Studio
  children: React.ReactNode
}

export function BookingDialog({ studio, children }: BookingDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [showPaymentSelection, setShowPaymentSelection] = useState(false)
  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    message: ""
  })

  // Fetch room and staff data when dialog opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchStudioData()
      checkPaymentMethod()
    }
  }, [isOpen, studio.id, user?.id])

  const fetchStudioData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/studios/${studio.id}`)
      if (response.ok) {
        const data = await response.json()
        const studioData = data.studio || data
        setRooms(studioData.rooms || [])
        setStaffMembers(studioData.staff || [])
      }
    } catch (error) {
      console.error('Error fetching studio data:', error)
    }
  }

  const checkPaymentMethod = async () => {
    if (!user?.id) return
    
    setCheckingPayment(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/payment-methods?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setHasPaymentMethod(data.hasPaymentMethod)
        setPaymentMethods(data.paymentMethods || [])
        
        // Set default payment method if available
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          setSelectedPaymentMethod(data.paymentMethods[0].id)
        }
      }
    } catch (error) {
      console.error('Error checking payment methods:', error)
    } finally {
      setCheckingPayment(false)
    }
  }

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0
    const start = new Date(`2024-01-01T${bookingData.startTime}`)
    const end = new Date(`2024-01-01T${bookingData.endTime}`)
    const diffMs = end.getTime() - start.getTime()
    return Math.max(0, diffMs / (1000 * 60 * 60))
  }

  const totalCost = selectedRoom ? selectedRoom.hourlyRate * calculateDuration() : 0

  const handleProceedToPayment = () => {
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

    // Check for payment method
    if (!hasPaymentMethod || paymentMethods.length === 0) {
      const currentUrl = encodeURIComponent(window.location.href)
      toast({
        title: "Payment Method Required",
        description: "Please add a payment method to continue with your booking.",
        variant: "destructive"
      })
      router.push(`/add-card?returnUrl=${currentUrl}`)
      return
    }

    // Show payment selection modal
    setShowPaymentSelection(true)
  }

  const handleBookingSubmit = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method to continue.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const requestUrl = `${API_BASE_URL}/api/booking-requests`
      console.info('🚀 [Booking-Dialog] Making booking request to URL:', requestUrl)
      
      const requestBody = {
        studioId: studio.id,
        studioName: studio.name,
        roomId: selectedRoom?.id,
        roomName: selectedRoom?.name,
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        duration: calculateDuration(),
        hourlyRate: selectedRoom?.hourlyRate,
        totalCost: totalCost,
        message: bookingData.message,
        staffId: selectedStaff?.id || null,
        staffName: selectedStaff?.name || null,
        paymentMethodId: selectedPaymentMethod
      }
      
      console.info('📝 [Booking-Dialog] Request payload:', {
        studioId: requestBody.studioId,
        userId: requestBody.userId,
        date: requestBody.date,
        startTime: requestBody.startTime,
        endTime: requestBody.endTime,
        totalCost: requestBody.totalCost
      })

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.info('📡 [Booking-Dialog] Response status:', response.status)
      console.info('📡 [Booking-Dialog] Response headers:', Object.fromEntries(response.headers.entries()))

      // Check if the response is JSON before trying to parse
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ [Booking-Dialog] Received non-JSON response:', contentType)
        const responseText = await response.text()
        console.error('❌ [Booking-Dialog] Response text (first 500 chars):', responseText.substring(0, 500))
        
        toast({
          title: "Booking Failed",
          description: "Server returned an invalid response. Please check your connection and try again.",
          variant: "destructive"
        })
        return
      }

      if (response.ok) {
        const booking = await response.json()
        console.info('✅ [Booking-Dialog] Booking created successfully:', booking.bookingRequest?.id)
        
        toast({
          title: "Booking Request Sent!",
          description: `Your booking request for ${selectedRoom?.name} at ${studio.name} has been sent. The studio will respond within 24 hours.`
        })
        setIsOpen(false)
        setShowPaymentSelection(false)
        setBookingData({ date: "", startTime: "", endTime: "", message: "" })
        setSelectedRoom(null)
        setSelectedStaff(null)
        setSelectedPaymentMethod("")
      } else {
        const error = await response.json()
        console.error('❌ [Booking-Dialog] API error response:', error)
        
        if (response.status === 409) {
          toast({
            title: "Time Slot Unavailable",
            description: "This time slot is already booked. Please select a different time or room.",
            variant: "destructive"
          })
        } else if (response.status === 503) {
          toast({
            title: "Payment System Unavailable",
            description: error.error || "Payment system is temporarily unavailable. Please try again later.",
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
      console.error('❌ [Booking-Dialog] Network or unexpected error:', error)
      toast({
        title: "Booking Failed",
        description: "An unexpected error occurred. Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNewCard = () => {
    const currentUrl = encodeURIComponent(window.location.href)
    router.push(`/add-card?returnUrl=${currentUrl}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {!showPaymentSelection ? (
          // Booking Form
          <>
            <DialogHeader>
              <DialogTitle>Book {studio.name}</DialogTitle>
              <DialogDescription>
                Select your preferred date, time, and room for your session.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room">Select Room</Label>
                <Select value={selectedRoom?.id || ""} onValueChange={(value) => {
                  const room = rooms.find(r => r.id === value)
                  setSelectedRoom(room || null)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.filter(room => room.id && room.id.trim() !== "").map((room) => (
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
                  <p className="text-sm text-muted-foreground">{selectedRoom.description}</p>
                  <p className="text-sm font-medium mt-1">${selectedRoom.hourlyRate}/hour</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={bookingData.startTime}
                    onChange={(e) => setBookingData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={bookingData.endTime}
                    onChange={(e) => setBookingData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              {staffMembers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="staff">Producer/Engineer (Optional)</Label>
                  <Select value={selectedStaff?.id || "none"} onValueChange={(value) => {
                    if (value === "none") {
                      setSelectedStaff(null)
                    } else {
                      const staff = staffMembers.find(s => s.id === value)
                      setSelectedStaff(staff || null)
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an engineer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No engineer needed</SelectItem>
                      {staffMembers.filter(staff => staff.id && staff.id.trim() !== "").map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                      Studio Rate:
                    </span>
                    <span>${selectedRoom.hourlyRate}/hour</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Processing Fee (3%):</span>
                    <span>${(totalCost * 0.03).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium border-t pt-2">
                    <span>Total Charge:</span>
                    <span>${(totalCost * 1.03).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Payment Method Status */}
              {user && !checkingPayment && (
                <div className={`p-3 rounded-lg border ${hasPaymentMethod ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center gap-2">
                    <CreditCard className={`h-4 w-4 ${hasPaymentMethod ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className={`text-sm font-medium ${hasPaymentMethod ? 'text-green-800' : 'text-orange-800'}`}>
                      {hasPaymentMethod ? 'Payment Method Ready' : 'Payment Method Required'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${hasPaymentMethod ? 'text-green-700' : 'text-orange-700'}`}>
                    {hasPaymentMethod 
                      ? 'You can submit booking requests. Payment will be processed when the studio accepts.'
                      : 'Add a payment method to submit booking requests. You\'ll be redirected to add your card.'
                    }
                  </p>
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
              <Button onClick={handleProceedToPayment} disabled={isLoading || checkingPayment}>
                {checkingPayment ? "Checking..." : "Send Request"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Payment Selection Modal
          <>
            <DialogHeader>
              <DialogTitle>Select Payment Method</DialogTitle>
              <DialogDescription>
                Choose how you'd like to pay for this booking. Your card will only be charged if the studio accepts your request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Booking Summary */}
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">{selectedRoom?.name} at {studio.name}</h4>
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{bookingData.date} • {bookingData.startTime} - {bookingData.endTime}</span>
                    <span>{calculateDuration()} hours</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground mt-1">
                    <span>Total:</span>
                    <span>${(totalCost * 1.03).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <Label>Select Payment Method</Label>
                <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{method.brand} •••• {method.last4}</p>
                            <p className="text-sm text-muted-foreground">Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <Button variant="outline" onClick={handleAddNewCard} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Card
                </Button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Secure Payment:</strong> Your card will be authorized but not charged until the studio accepts your booking request.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentSelection(false)} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleBookingSubmit} disabled={isLoading || !selectedPaymentMethod}>
                {isLoading ? "Processing..." : "Complete Request"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 