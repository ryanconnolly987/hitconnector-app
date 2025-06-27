import Link from "next/link"
import { CheckCircle2, Calendar, Clock, MapPin, CreditCard, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function BookingConfirmationPage() {
  // Mock booking data - in a real app, this would come from your database or state
  const booking = {
    id: "BK-12345678",
    studio: {
      name: "Soundwave Studios",
      address: "1234 Music Avenue, Los Angeles, CA 90028",
    },
    date: "May 15, 2025",
    startTime: "2:00 PM",
    endTime: "5:00 PM",
    room: "Studio A",
    hours: 3,
    hourlyRate: 125,
    subtotal: 375,
    fees: 18.75,
    total: 393.75,
    payment: {
      method: "Visa •••• 4242",
      receiptNumber: "RC-87654321",
      date: "April 30, 2025",
    },
  }

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <div className="flex-1 container max-w-3xl px-4 py-12 md:py-24 flex flex-col items-center justify-center">
        <div className="w-full space-y-8">
          {/* Success Message */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Confirmed!</h1>
            <p className="text-muted-foreground">Your session at {booking.studio.name} has been successfully booked.</p>
          </div>

          {/* Booking Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{booking.studio.name}</h3>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{booking.studio.address}</span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{booking.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Time:</span>
                  <span>
                    {booking.startTime} - {booking.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Room:</span>
                  <span>{booking.room}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ${booking.hourlyRate} × {booking.hours} hours
                  </span>
                  <span>${booking.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service fee</span>
                  <span>${booking.fees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total paid</span>
                  <span>${booking.total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Payment Method:</span>
                  <span>{booking.payment.method}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Receipt Number:</span>
                  <span>{booking.payment.receiptNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Payment Date:</span>
                  <span>{booking.payment.date}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" asChild>
                <Link href="/bookings">
                  Go to My Bookings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/find-studios">Find More Studios</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Additional Information */}
          <div className="text-center text-sm text-muted-foreground">
            <p>A confirmation email has been sent to your registered email address.</p>
            <p className="mt-1">
              Need help?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} HitConnector. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}