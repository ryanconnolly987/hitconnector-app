"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Star, Search, Wifi, Mic, Monitor, Headphones, MapPin } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

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
  specialties?: string[]
  rating: number
  reviewCount: number
  description: string
  amenities?: string[]
  owner?: string
  images?: string[]
  gallery?: string[]
  availability?: any
  equipment?: string[]
  trackUrl?: string
  followers?: string[]
  rooms?: any[]
  staff?: any[]
}

const amenityIcons: { [key: string]: any } = {
  "WiFi": Wifi,
  "24/7 Access": Monitor,
  "Parking": MapPin,
  "Mixing Board": Monitor,
  "Instruments": Mic,
  "Coffee": Monitor,
  "Recording Equipment": Mic,
  "Monitors": Headphones,
  "Vocal Booth": Mic,
  "Mastering Suite": Monitor,
  "Lounge Area": Monitor
}

function StudiosPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // Fetch studios from API
  useEffect(() => {
    const fetchStudios = async () => {
      try {
        console.log('🔍 [Studios] Fetching studios from API')
        
        const response = await fetch(`${API_BASE_URL}/api/studios`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [Studios] Studios fetched:', data.studios?.length || 0)
          
          const validStudios = (data.studios || []).filter((studio: any) => {
            if (!studio.id) {
              console.warn('⚠️ [Studios] Found studio without ID:', studio)
              return false
            }
            return true
          })
          
          setStudios(validStudios)
        } else {
          console.error('❌ [Studios] Failed to fetch studios')
          setStudios([])
        }
      } catch (error) {
        console.error('Error fetching studios:', error)
        setStudios([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudios()
  }, [])

  useEffect(() => {
    // Get search parameters from URL
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    
    if (location) {
      setSearchQuery(location)
    } else if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery
    setSearching(true)
    
    // Filter studios based on search term
    setTimeout(() => {
      if (searchTerm.trim()) {
        const filtered = studios.filter(studio => 
          studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          studio.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          studio.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (studio.specialties && studio.specialties.some(specialty => 
            specialty.toLowerCase().includes(searchTerm.toLowerCase())
          ))
        )
        setStudios(filtered)
      } else {
        // Re-fetch all studios if search is cleared
        fetchStudios()
      }
      setSearching(false)
    }, 300)
  }

  const fetchStudios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/studios`)
      if (response.ok) {
        const data = await response.json()
        const validStudios = (data.studios || []).filter((studio: any) => studio.id)
        setStudios(validStudios)
      }
    } catch (error) {
      console.error('Error fetching studios:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">HitConnector</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
                How It Works
              </Link>
              <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
                Log In
              </Link>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading studios...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">HitConnector</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
              How It Works
            </Link>
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
              Log In
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-8 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col space-y-4">
              <h1 className="text-2xl font-bold">Find Recording Studios</h1>
              <div className="flex gap-4 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by city, name, or genre..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <Button onClick={() => handleSearch()} disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-8">
          <div className="container px-4 md:px-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {studios.length} studio{studios.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {studios.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">No studios found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studios.map((studio) => (
                  <StudioCard key={studio.id} studio={studio} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function StudioCard({ studio }: { studio: Studio }) {
  const getLocationDisplay = (location: string) => {
    // If location already contains city/state format, use it
    if (location.includes(',')) {
      return location
    }
    // Otherwise, assume it's a city and add a generic state
    return location
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative">
        <Image 
          src={studio.profileImage || studio.coverImage || "/placeholder.svg?height=300&width=400"} 
          alt={studio.name}
          fill
          className="object-cover"
        />
        {!studio.hourlyRate && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">Contact for Pricing</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg leading-none">{studio.name}</h3>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{studio.rating}</span>
              <span className="text-sm text-muted-foreground">({studio.reviewCount})</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{getLocationDisplay(studio.location)}</span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {studio.description}
          </p>
          
          {studio.specialties && studio.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {studio.specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {studio.specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{studio.specialties.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {studio.amenities && studio.amenities.length > 0 && (
            <div className="flex gap-2 pt-2">
              {studio.amenities.slice(0, 4).map((amenity) => {
                const IconComponent = amenityIcons[amenity] || Monitor
                return (
                  <div key={amenity} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconComponent className="h-3 w-3" />
                    <span className="hidden sm:inline">{amenity}</span>
                  </div>
                )
              })}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="text-lg font-semibold">
              {studio.hourlyRate ? `$${studio.hourlyRate}/hr` : 'Contact for pricing'}
            </div>
            <Button asChild size="sm">
              <Link href={`/studio-profile?id=${studio.id}`}>
                View Studio
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StudiosPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <StudiosPageContent />
    </Suspense>
  )
} 