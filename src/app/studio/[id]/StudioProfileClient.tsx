"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Star, MapPin, Clock, DollarSign, Music, Wifi, Car, Coffee, Shield, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookingDialog } from "@/components/ui/booking-dialog"
import { FollowButton, FollowStats } from "@/components/ui/follow-button"
import { MessageButton } from "@/components/ui/message-button"
import { MusicPlayer } from "@/components/ui/music-player"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

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
  minRoomRate?: number | null
  maxRoomRate?: number | null
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
  operatingHours?: {
    [key: string]: { open: string; close: string; closed: boolean }
  }
  staff?: Array<{
    id: string
    name: string
    role: string
    experience: string
    profileImage: string
  }>
  reviews?: Array<{
    id: string
    artistName: string
    artistImage: string
    rating: number
    comment: string
    date: string
  }>
  createdAt: string
  owner: string
  availability?: {
    [key: string]: { start: string; end: string }
  }
  followersCount?: number
}

export default function StudioProfileClient({ 
  studio: initialStudio,
  studioId 
}: { 
  studio: Studio | null
  studioId: string 
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [studio, setStudio] = useState<Studio | null>(initialStudio)
  const [loading, setLoading] = useState(!initialStudio)
  const [error, setError] = useState<string | null>(null)

  // Check if current user owns this studio
  const isOwner = user && studio && (studio.owner === user.email || studio.owner === user.id)

  // If no initial studio data, fetch it client-side
  useEffect(() => {
    if (!initialStudio && studioId) {
      const fetchStudio = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/studios/${studioId}`)
          
          if (!response.ok) {
            throw new Error('Studio not found')
          }
          
          const studioData = await response.json()
          setStudio(studioData)
        } catch (error) {
          console.error('Error fetching studio:', error)
          setError('Failed to load studio')
          toast({
            title: "Error",
            description: "Failed to load studio",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }

      fetchStudio()
    }
  }, [initialStudio, studioId, toast])

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase()
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return <Wifi className="h-4 w-4" />
    if (amenityLower.includes('parking') || amenityLower.includes('car')) return <Car className="h-4 w-4" />
    if (amenityLower.includes('coffee') || amenityLower.includes('kitchen')) return <Coffee className="h-4 w-4" />
    if (amenityLower.includes('security') || amenityLower.includes('safe')) return <Shield className="h-4 w-4" />
    if (amenityLower.includes('lounge') || amenityLower.includes('waiting')) return <Users className="h-4 w-4" />
    return <Music className="h-4 w-4" />
  }

  const formatOperatingHours = (hours: { open: string; close: string; closed: boolean }) => {
    if (hours.closed) return "Closed"
    return `${hours.open} - ${hours.close}`
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
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500">
        {studio.coverImage ? (
          <img
            src={studio.coverImage}
            alt="Studio cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 -mt-16 relative">
        {/* Studio Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              <div className="flex items-end gap-4">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={studio.profileImage} alt={studio.name} />
                  <AvatarFallback className="text-2xl">{studio.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{studio.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground mb-2">
                    {studio.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{studio.rating} ({studio.reviewCount} reviews)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{studio.location || studio.address || "Location not specified"}</span>
                    </div>
                    <FollowStats targetId={String(studio.id)} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <FollowButton targetId={String(studio.id)} />
                <MessageButton recipientId={String(studio.id)} recipientName={studio.name} />
                <BookingDialog studio={studio}>
                  <Button size="lg">
                    <Music className="mr-2 h-4 w-4" />
                    Book Now
                  </Button>
                </BookingDialog>
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {/* Only show edit button if user owns this studio */}
                {isOwner && (
                  <Button variant="outline" asChild>
                    <a href="/studio-dashboard/profile">Edit Profile</a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {studio.description || "No description provided yet."}
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

                {/* Amenities */}
                {studio.amenities && studio.amenities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Amenities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {studio.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Equipment */}
                {studio.equipment && studio.equipment.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Equipment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {studio.equipment.map((item, index) => (
                          <Badge key={index} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {/* Quick Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {studio.minRoomRate && studio.maxRoomRate && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Price Range</span>
                          <span className="font-medium">${studio.minRoomRate} – ${studio.maxRoomRate}/hr</span>
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">{studio.followersCount || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{studio.rating}</span>
                        <span className="text-muted-foreground">({studio.reviewCount})</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Specialties */}
                {studio.specialties && studio.specialties.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Specialties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {studio.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {studio.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{studio.phone}</span>
                      </div>
                    )}
                    {studio.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{studio.email}</span>
                      </div>
                    )}

                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>
                  When this studio is available for bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studio.operatingHours ? (
                  <div className="space-y-3">
                    {Object.entries(studio.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between py-2">
                        <span className="font-medium capitalize">{day}</span>
                        <span className="text-muted-foreground">
                          {formatOperatingHours(hours)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Operating hours not specified</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            {studio.rooms && studio.rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studio.rooms.map((room) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <CardTitle>{room.name}</CardTitle>
                      <CardDescription>
                        Capacity: {room.capacity} people • ${room.hourlyRate}/hour
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{room.description}</p>
                      {room.equipment && room.equipment.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Equipment</h4>
                          <div className="flex flex-wrap gap-1">
                            {room.equipment.map((item, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No rooms information available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            {studio.gallery && studio.gallery.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studio.gallery.map((image, index) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Studio gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No gallery images available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            {studio.staff && studio.staff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studio.staff.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={member.profileImage} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                          <p className="text-sm">{member.experience}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No staff information available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 