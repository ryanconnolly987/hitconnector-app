"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton, FollowStats } from "@/components/ui/follow-button"
import { Star, MapPin, Clock, DollarSign, Wifi, Car, Coffee, Shield, Users, Calendar, CheckCircle, XCircle, Music } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import Link from "next/link"
import { MusicPlayer } from "@/components/ui/music-player"

export default function StudioProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [studioData, setStudioData] = useState({
    id: 1,
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    profileImage: "",
    coverImage: "",
    rating: 0,
    reviewCount: 0,
    amenities: [] as string[],
    genres: [] as string[],
    hourlyRate: 0,
    isAvailable: false,
    trackUrl: "",
    followersCount: 0,
    operatingHours: {
      monday: { open: "", close: "", closed: true },
      tuesday: { open: "", close: "", closed: true },
      wednesday: { open: "", close: "", closed: true },
      thursday: { open: "", close: "", closed: true },
      friday: { open: "", close: "", closed: true },
      saturday: { open: "", close: "", closed: true },
      sunday: { open: "", close: "", closed: true },
    },
    rooms: [] as Array<{
      id: number;
      name: string;
      description: string;
      hourlyRate: number;
      capacity: number;
      images: string[];
      equipment: string[];
    }>,
    gallery: [] as string[],
    reviews: [] as Array<{
      id: string;
      artistName: string;
      artistImage: string;
      rating: number;
      comment: string;
      date: string;
    }>,
    staff: [] as Array<{
      id: string;
      name: string;
      role: string;
      bio: string;
      image: string;
    }>
  })

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (user?.id) {
      loadStudioData()
    }
  }, [user?.id]) // Add proper dependency array

  const loadStudioData = async () => {
    if (!user?.email && !user?.id) return
    
    try {
      console.time('loadStudioProfileData');
      // First, try to load from API (primary source)
      console.log('🔍 [Profile] Loading studio data from API for user:', { email: user.email, id: user.id })
      
      const studiosUrl = '/api/studios'
      console.log('[DEBUG] Fetching from:', studiosUrl)
      const response = await fetch(studiosUrl)
      if (response.ok) {
        const data = await response.json()
        const userStudios = data.studios?.filter((studio: any) => 
          studio.owner === user.email || studio.owner === user.id
        )
        
        if (userStudios && userStudios.length > 0) {
          const studio = userStudios[0] // Get the first studio for this user
          
          console.log('✅ [Profile] Studio data loaded from API:', {
            name: studio.name,
            followersCount: studio.followersCount || 0
          })
          
          // Map API data to display format
          setStudioData({
            id: studio.id ? Number(studio.id) : 0,
            name: studio.name || "",
            address: studio.address || studio.location || "",
            phone: studio.phone || "",
            email: studio.email || "",
            website: studio.website || "",
            profileImage: studio.profileImage || "",
            coverImage: studio.coverImage || "",
            description: studio.description || "",
            hourlyRate: studio.hourlyRate || 0,
            rating: studio.rating || 0,
            reviewCount: studio.reviewCount || 0,
            amenities: studio.amenities || [],
            genres: studio.specialties || [],
            isAvailable: studio.isAvailable !== undefined ? studio.isAvailable : true,
            trackUrl: studio.trackUrl || "",
            followersCount: studio.followersCount || 0,
            operatingHours: studio.operatingHours || {
              monday: { open: "", close: "", closed: true },
              tuesday: { open: "", close: "", closed: true },
              wednesday: { open: "", close: "", closed: true },
              thursday: { open: "", close: "", closed: true },
              friday: { open: "", close: "", closed: true },
              saturday: { open: "", close: "", closed: true },
              sunday: { open: "", close: "", closed: true },
            },
            rooms: studio.rooms || [],
            gallery: studio.gallery || [], // Use gallery from API
            reviews: studio.reviews || [],
            staff: studio.staff || []
          })
          
          console.log('🕒 [Profile] Operating hours loaded:', studio.operatingHours)
          console.log('📍 [Profile] Available status:', studio.isAvailable)
          
          console.timeEnd('loadStudioProfileData');
          return // Successfully loaded from API, no need for localStorage fallback
        }
      }
      
      console.log('⚠️ [Profile] API data not available, falling back to localStorage')
      
      // Fallback to localStorage if API fails or no data found
      const userKey = user?.email || user?.id
      if (userKey) {
        const savedStudioData = localStorage.getItem(`studioProfileData_${userKey}`)
        const savedRoomsData = localStorage.getItem(`studioRoomsData_${userKey}`)
        const savedStaffData = localStorage.getItem(`studioStaffData_${userKey}`)
        
        if (savedStudioData) {
          const parsedStudioData = JSON.parse(savedStudioData)
          let updatedData = { ...studioData, ...parsedStudioData }
          
          // Fix gallery images mapping - edit page saves as galleryImages, display uses gallery
          if (parsedStudioData.galleryImages) {
            updatedData = { ...updatedData, gallery: parsedStudioData.galleryImages }
          }
          
          // If rooms data is saved separately, merge it
          if (savedRoomsData) {
            const parsedRoomsData = JSON.parse(savedRoomsData)
            updatedData = { ...updatedData, rooms: parsedRoomsData }
          }
          
          // If staff data is saved separately, merge it
          if (savedStaffData) {
            const parsedStaffData = JSON.parse(savedStaffData)
            updatedData = { ...updatedData, staff: parsedStaffData }
          }
          
          setStudioData(updatedData)
          console.log('📱 [Profile] Studio data loaded from localStorage')
        } else {
          // Load individual saved data if main data doesn't exist
          if (savedRoomsData) {
            const parsedRoomsData = JSON.parse(savedRoomsData)
            setStudioData(prev => ({ ...prev, rooms: parsedRoomsData }))
          }
          
          if (savedStaffData) {
            const parsedStaffData = JSON.parse(savedStaffData)
            setStudioData(prev => ({ ...prev, staff: parsedStaffData }))
          }
          
          console.log('📱 [Profile] Individual data loaded from localStorage')
        }
      }
      console.timeEnd('loadStudioProfileData');
    } catch (error) {
      console.error('❌ [Profile] Error loading studio data:', error)
      console.timeEnd('loadStudioProfileData');
    }
  }



  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'free wifi':
      case 'wifi':
        return <Wifi className="h-4 w-4" />
      case 'parking available':
      case 'parking':
        return <Car className="h-4 w-4" />
      case 'coffee & snacks':
      case 'refreshments':
        return <Coffee className="h-4 w-4" />
      case '24/7 security':
      case 'security':
        return <Shield className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  if (!studioData.name) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>Setup Your Studio Profile</CardTitle>
            <CardDescription>
              Complete your studio profile to start receiving booking requests from artists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/studio-dashboard/profile">Edit Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500">
        {studioData.coverImage ? (
          <img
            src={studioData.coverImage}
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
                  <AvatarImage src={studioData.profileImage} alt={studioData.name} />
                  <AvatarFallback className="text-2xl">{studioData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{studioData.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{studioData.address || "Location not specified"}</span>
                    </div>
                    {studioData.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{studioData.rating} ({studioData.reviewCount} reviews)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <FollowStats targetId={String(studioData.id)} />
                  </div>
                  {studioData.hourlyRate > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">${studioData.hourlyRate}/hour</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <FollowButton targetId={String(studioData.id)} />
                <Button variant="outline" asChild>
                  <a href="/studio-dashboard">← Back to Dashboard</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/studio-dashboard/profile">Edit Profile</a>
                </Button>
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
                      {studioData.description || "No description provided yet."}
                    </p>
                  </CardContent>
                </Card>

                {/* Music Sample */}
                {studioData.trackUrl && (
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
                      <MusicPlayer trackUrl={studioData.trackUrl} />
                    </CardContent>
                  </Card>
                )}

                {/* Amenities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studioData.amenities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {studioData.amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center gap-2">
                            {getAmenityIcon(amenity)}
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No amenities listed yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Quick Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {studioData.phone && (
                      <div>
                        <div className="font-medium">Phone</div>
                        <div className="text-muted-foreground">{studioData.phone}</div>
                      </div>
                    )}
                    {studioData.email && (
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-muted-foreground">{studioData.email}</div>
                      </div>
                    )}
                    {studioData.website && (
                      <div>
                        <div className="font-medium">Website</div>
                        <a href={studioData.website} className="text-blue-600 hover:underline">
                          {studioData.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Genres */}
                {studioData.genres.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Specialties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {studioData.genres.map((genre) => (
                          <Badge key={genre} variant="secondary">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>When your studio is available for bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(studioData.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="capitalize font-medium">{day}</span>
                      <span className="text-muted-foreground">
                        {hours.closed ? "Closed" : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(studioData.rooms || []).length > 0 ? (
                (studioData.rooms || []).map((room) => (
                  <Card key={room.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{room.name}</CardTitle>
                          <CardDescription>{room.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${room.hourlyRate}/hr</p>
                          <p className="text-sm text-muted-foreground">Up to {room.capacity} people</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {(room.images || []).map((image: string, index: number) => (
                          image && (
                            <img
                              key={index}
                              src={image}
                              alt={`${room.name} ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )
                        ))}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Equipment</h4>
                        <div className="flex flex-wrap gap-1">
                          {(room.equipment || []).map((item: string) => (
                            <Badge key={item} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rooms added yet.</p>
                  <Button asChild className="mt-4">
                    <a href="/studio-dashboard/profile">Add Rooms</a>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Studio Gallery</CardTitle>
                <CardDescription>Take a look inside our studio spaces</CardDescription>
              </CardHeader>
              <CardContent>
                {(studioData.gallery || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(studioData.gallery || []).map((image: string, index: number) => (
                      image && (
                        <img
                          key={index}
                          src={image}
                          alt={`Studio gallery ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                        />
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No gallery images yet.</p>
                    <Button asChild className="mt-4">
                      <a href="/studio-dashboard/profile">Add Images</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Studio Staff</CardTitle>
                <CardDescription>Meet the team behind the magic</CardDescription>
              </CardHeader>
              <CardContent>
                {(studioData.staff || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(studioData.staff || []).map((staffMember) => (
                      <div key={staffMember.id} className="bg-muted/30 rounded-lg p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="h-20 w-20 mb-4">
                            <AvatarImage src={staffMember.image} alt={staffMember.name} />
                            <AvatarFallback className="text-lg">{staffMember.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg">{staffMember.name}</h4>
                            <Badge variant="outline" className="mb-3">{staffMember.role}</Badge>
                            <p className="text-muted-foreground text-sm leading-relaxed">{staffMember.bio}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No staff members added yet.</p>
                    <Button asChild className="mt-4">
                      <a href="/studio-dashboard/profile">Add Staff</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  )
} 