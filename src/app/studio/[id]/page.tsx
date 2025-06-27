'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Star, MapPin, Clock, DollarSign, Music, Wifi, Car, Coffee, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookingDialog } from "@/components/ui/booking-dialog"
import { FollowButton, FollowStats } from "@/components/ui/follow-button"
import { MusicPlayer } from "@/components/ui/music-player"
import { API_BASE_URL } from "@/lib/config"

interface Studio {
  id: string
  name: string
  location: string
  address?: string
  phone?: string
  email?: string
  website?: string
  profileImage?: string
  coverImage?: string
  hourlyRate: number
  specialties: string[]
  rating: number
  reviewCount: number
  description: string
  amenities: string[]
  images: string[]
  gallery?: string[]
  equipment: string[]
  trackUrl?: string
  rooms?: Array<{
    id: string
    name: string
    description: string
    hourlyRate: number
    capacity: number
    images: string[]
    equipment: string[]
  }>
  operatingHours?: Record<string, any>
  staff?: Array<{
    id: string
    name: string
    role: string
    bio: string
    image: string
  }>
  createdAt: string
  owner: string
  availability?: {
    [key: string]: { start: string; end: string }
  }
}

export default function StudioProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [studio, setStudio] = useState<Studio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudio = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/studios/${params.id}`)
        if (response.ok) {
          const studioData = await response.json()
          setStudio(studioData)
        } else {
          setError("Studio not found")
        }
      } catch (err) {
        console.error('Error fetching studio:', err)
        setError("Failed to load studio")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchStudio()
    }
  }, [params.id])

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase()
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return <Wifi className="h-4 w-4" />
    if (amenityLower.includes('parking') || amenityLower.includes('car')) return <Car className="h-4 w-4" />
    if (amenityLower.includes('coffee') || amenityLower.includes('kitchen')) return <Coffee className="h-4 w-4" />
    if (amenityLower.includes('security') || amenityLower.includes('safe')) return <Shield className="h-4 w-4" />
    if (amenityLower.includes('lounge') || amenityLower.includes('waiting')) return <Users className="h-4 w-4" />
    return <Music className="h-4 w-4" />
  }

  const formatAvailability = () => {
    // Check for operatingHours first (new format)
    if (studio?.operatingHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      
      return days.map((day, index) => {
        const hours = studio.operatingHours?.[day]
        if (!hours || hours.closed) return null
        return (
          <div key={day} className="flex justify-between text-sm">
            <span className="font-medium">{dayNames[index]}</span>
            <span>{hours.open} - {hours.close}</span>
          </div>
        )
      }).filter(Boolean)
    }
    
    // Fallback to old availability format
    if (studio?.availability) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      
      return days.map((day, index) => {
        const hours = studio.availability?.[day]
        if (!hours) return null
        return (
          <div key={day} className="flex justify-between text-sm">
            <span className="font-medium">{dayNames[index]}</span>
            <span>{hours.start} - {hours.end}</span>
          </div>
        )
      }).filter(Boolean)
    }
    
    return "Contact studio for availability"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !studio) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Studio Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The studio you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push('/find-studios')}>
                Browse Studios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Studios
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Studio Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{studio.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{studio.location || studio.address || ''}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{studio.rating}</span>
                        <span className="text-muted-foreground">({studio.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">${studio.hourlyRate}/hour</span>
                      </div>
                    </div>
                    <FollowStats targetId={studio.id} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <FollowButton targetId={studio.id} />
                    <BookingDialog studio={studio}>
                      <Button size="lg" className="w-full sm:w-auto">
                        <Music className="mr-2 h-4 w-4" />
                        Book Now
                      </Button>
                    </BookingDialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Studio Image */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={studio.profileImage || studio.coverImage || studio.gallery?.[0] || studio.images?.[0] || "/placeholder.svg?height=400&width=600"}
                    alt={studio.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Studio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {studio.description || "Professional recording studio with state-of-the-art equipment and experienced engineers."}
                </p>
              </CardContent>
            </Card>

            {/* Music Sample */}
            {studio.trackUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Studio Sample
                  </CardTitle>
                  <CardDescription>
                    Listen to tracks recorded at this studio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MusicPlayer trackUrl={studio.trackUrl} />
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {studio.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studio.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equipment */}
            {studio.equipment.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {studio.equipment.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Book */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Book</CardTitle>
                <CardDescription>
                  Book this studio for your next session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hourly Rate</span>
                  <span className="text-lg font-bold">${studio.hourlyRate}</span>
                </div>
                <BookingDialog studio={studio}>
                  <Button className="w-full">
                    <Music className="mr-2 h-4 w-4" />
                    Book Now
                  </Button>
                </BookingDialog>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formatAvailability()}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            {studio.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studio.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3">
                        {getAmenityIcon(amenity)}
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 