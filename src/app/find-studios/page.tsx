'use client'

import { useState, useEffect } from "react"
import { Search, Filter, Star, MapPin, Music, Clock, DollarSign, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingDialog } from "@/components/ui/booking-dialog"
import { FollowButton } from "@/components/ui/follow-button"

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
}

export default function FindStudiosPage() {
  const router = useRouter()
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [sortBy, setSortBy] = useState("rating")

  useEffect(() => {
    console.log('🚀 Component mounted, triggering fetchStudios...')
    fetchStudios()
  }, [])

  // Add a simple connection test
  useEffect(() => {
    console.log('🔧 Testing basic fetch capabilities...')
    fetch('http://localhost:3002/health')
      .then(response => {
        console.log('🟢 Health check response:', response.status)
        return response.text()
      })
      .then(text => console.log('🟢 Health check text:', text))
      .catch(err => console.error('🔴 Health check failed:', err))
  }, [])

  const fetchStudios = async () => {
    try {
      console.log('🎯 Starting fetchStudios...')
      setLoading(true)
      setError(null)
      
      console.log('🔗 Making request to:', `${API_BASE_URL}/api/studios`)
      const response = await fetch(`${API_BASE_URL}/api/studios`)
      console.log('📡 Response received:', response.status, response.ok)
      
      if (response.ok) {
        console.log('✅ Response OK, parsing JSON...')
        const data = await response.json()
        console.log('📊 Data received:', data)
        console.log('🏢 Studios count:', data.studios?.length || 0)
        setStudios(data.studios || [])
        console.log('✅ Studios set successfully')
      } else {
        console.error('❌ Response not OK:', response.status, response.statusText)
        throw new Error('Failed to fetch studios')
      }
    } catch (err) {
      console.error('🚨 Error fetching studios:', err)
      setError('Failed to load studios. Please try again.')
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }

  const getAvailabilityStatus = (studio: Studio) => {
    return "Available"
  }

  const getStudioImage = (studio: Studio) => {
    // Priority: profileImage -> coverImage -> first gallery image -> first image -> placeholder
    return studio.profileImage || 
           studio.coverImage || 
           studio.gallery?.[0] || 
           studio.images?.[0] || 
           "/placeholder.svg?height=200&width=300"
  }

  const isStudioVerified = (studio: Studio) => {
    return studio.rating >= 4.0
  }

  const filteredAndSortedStudios = studios
    .filter(studio => {
      const matchesSearch = studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (studio.location || studio.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          studio.specialties.some(specialty => 
                            specialty.toLowerCase().includes(searchTerm.toLowerCase())
                          )
      
      const studioLocation = studio.location || studio.address || ''
      const matchesLocation = locationFilter === "all" || 
                            studioLocation.toLowerCase().includes(locationFilter.toLowerCase())
      
      const matchesPrice = priceFilter === "all" || 
                         (priceFilter === "budget" && studio.hourlyRate <= 75) ||
                         (priceFilter === "mid" && studio.hourlyRate > 75 && studio.hourlyRate <= 150) ||
                         (priceFilter === "premium" && studio.hourlyRate > 150)
      
      return matchesSearch && matchesLocation && matchesPrice
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "price-low":
          return a.hourlyRate - b.hourlyRate
        case "price-high":
          return b.hourlyRate - a.hourlyRate
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  const handleStudioClick = (studioId: string) => {
    router.push(`/studio/${studioId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Recording Studios</h1>
          <p className="text-muted-foreground">
            Discover professional recording studios in your area
          </p>
          {/* Debug test button */}
          <Button 
            onClick={fetchStudios} 
            variant="outline" 
            className="mt-4"
          >
            🔄 Test API Call (Debug)
          </Button>
          <div className="mt-2 text-sm text-muted-foreground">
            Studios loaded: {studios.length} | Loading: {loading.toString()} | Error: {error || 'none'}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search studios, locations, or genres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="los angeles">Los Angeles</SelectItem>
                <SelectItem value="new york">New York</SelectItem>
                <SelectItem value="nashville">Nashville</SelectItem>
                <SelectItem value="atlanta">Atlanta</SelectItem>
                <SelectItem value="miami">Miami</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="budget">Budget ($0-$75/hr)</SelectItem>
                <SelectItem value="mid">Mid-range ($75-$150/hr)</SelectItem>
                <SelectItem value="premium">Premium ($150+/hr)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {error && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchStudios}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {filteredAndSortedStudios.length} studio{filteredAndSortedStudios.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedStudios.map((studio) => (
                <Card key={studio.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div onClick={() => handleStudioClick(studio.id)}>
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={getStudioImage(studio)}
                        alt={studio.name}
                        className="w-full h-full object-cover"
                      />
                      {isStudioVerified(studio) && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Verified
                        </Badge>
                      )}
                      <Badge className="absolute top-2 right-2" variant="outline">
                        {getAvailabilityStatus(studio)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div onClick={() => handleStudioClick(studio.id)} className="cursor-pointer">
                        <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                          {studio.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{studio.location || studio.address || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{studio.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({studio.reviewCount})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${studio.hourlyRate}/hr</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {studio.specialties.slice(0, 3).map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {studio.specialties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{studio.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {studio.description}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <BookingDialog studio={studio}>
                        <Button className="flex-1" size="sm">
                          <Music className="mr-1 h-3 w-3" />
                          Book Now
                        </Button>
                      </BookingDialog>
                      <FollowButton 
                        targetId={studio.id} 
                        size="sm" 
                        showIcon={false}
                        className="min-w-[80px]"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStudioClick(studio.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAndSortedStudios.length === 0 && !loading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">No studios found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={() => {
                    setSearchTerm("")
                    setLocationFilter("all")
                    setPriceFilter("all")
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 