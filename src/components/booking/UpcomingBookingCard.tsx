"use client"

import { format } from 'date-fns'
import { CalendarDays, Clock } from 'lucide-react'
import { useBookingDetails } from './BookingDetailsProvider'
import { buildArtistProfileHrefFromParams } from '@/lib/url-utils'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface UpcomingBookingCardProps {
  booking: {
    id: string
    date: string
    startTime: string
    endTime: string
    roomName?: string
    status: string
    artistId?: string
    artistName?: string
    artistSlug?: string
    artistProfilePicture?: string
    userName?: string
    userId?: string
  }
}

export function UpcomingBookingCard({ booking }: UpcomingBookingCardProps) {
  const { open } = useBookingDetails()

  const handleViewDetails = () => {
    open(booking.id)
  }

  const artistName = booking.artistName || booking.userName || 'Unknown Artist'
  const artistId = booking.artistId || booking.userId

  return (
    <Card key={booking.id}>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        {buildArtistProfileHrefFromParams(booking.artistSlug, artistId) ? (
          <Link
            href={buildArtistProfileHrefFromParams(booking.artistSlug, artistId)!}
            className="inline-flex items-center gap-2 group"
          >
            <Avatar>
              <AvatarImage src={booking.artistProfilePicture || "/placeholder.svg"} alt={artistName} />
              <AvatarFallback>{artistName.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="group-hover:underline font-semibold">{artistName}</span>
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2">
            <Avatar>
              <AvatarImage src={booking.artistProfilePicture || "/placeholder.svg"} alt={artistName} />
              <AvatarFallback>{artistName.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="font-semibold">{artistName}</span>
          </div>
        )}
        <div className="flex-1">
          <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
            {booking.status === "confirmed" ? "Confirmed" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{booking.date ? format(new Date(booking.date), "MMM dd, yyyy") : "Date not available"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {booking.startTime} - {booking.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{booking.roomName}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleViewDetails}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
} 