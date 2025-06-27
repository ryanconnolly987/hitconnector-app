'use client'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, Star, MapPin, Clock, Wifi, Mic, Headphones, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Studio {
  id: string
  name: string
  city: string
  state: string
  rating: number
  reviewCount: number
  pricePerHour: number
  image: string
  amenities: string[]
  description: string
  isAvailable: boolean
}

// Mock data - in real app this would come from the backend API
const mockStudios: Studio[] = [
  {
    id: "1",
    name: "Soundwave Studios",
    city: "Los Angeles",
    state: "CA",
    rating: 4.9,
    reviewCount: 127,
    pricePerHour: 75,
    image: "/placeholder.svg?height=300&width=400",
    amenities: ["WiFi", "Recording Equipment", "Mixing Board", "Monitors"],
    description: "Professional recording studio with state-of-the-art equipment and experienced engineers.",
    isAvailable: true
  },
  {
    id: "2",
    name: "Beat Factory",
    city: "Atlanta",
    state: "GA",
    rating: 4.8,
    reviewCount: 95,
    pricePerHour: 65,
    image: "/placeholder.svg?height=300&width=400",
    amenities: ["WiFi", "Mixing Board", "Vocal Booth", "Instruments"],
    description: "Hip-hop focused studio with industry-standard equipment and platinum record history.",
    isAvailable: true
  },
  {
    id: "3",
    name: "Rhythm House",
    city: "New York",
    state: "NY",
    rating: 4.7,
    reviewCount: 203,
    pricePerHour: 85,
    image: "/placeholder.svg?height=300&width=400",
    amenities: ["WiFi", "Recording Equipment", "Mixing Board", "Mastering Suite"],
    description: "Premium recording facility in the heart of NYC with Grammy-winning engineers.",
    isAvailable: false
  },
  {
    id: "4",
    name: "Flow Records",
    city: "Miami",
    state: "FL",
    rating: 4.6,
    reviewCount: 78,
    pricePerHour: 70,
    image: "/placeholder.svg?height=300&width=400",
    amenities: ["WiFi", "Vocal Booth", "Mixing Board", "Lounge Area"],
    description: "Modern studio with tropical vibes and cutting-edge technology.",
    isAvailable: true
  }
]

const amenityIcons: { [key: string]: any } = {
  "WiFi": Wifi,
  "Recording Equipment": Mic,
  "Mixing Board": Monitor,
  "Monitors": Headphones,
  "Vocal Booth": Mic,
  "Mastering Suite": Monitor,
  "Instruments": Mic,
  "Lounge Area": Monitor
}

function StudiosPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [studios, setStudios] = useState<Studio[]>(mockStudios)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get search parameters from URL
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    
    if (location) {
      setSearchQuery(location)
      handleSearch(location)
    } else if (search) {
      setSearchQuery(search)
      handleSearch(search)
    }
  }, [searchParams])

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      if (searchTerm.trim()) {
        const filtered = mockStudios.filter(studio => 
          studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          studio.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          studio.state.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setStudios(filtered)
      } else {
        setStudios(mockStudios)
      }
      setLoading(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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
                    placeholder="Search by city, state, or studio name..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <Button onClick={() => handleSearch()} disabled={loading}>
                  {loading ? "Searching..." : "Search"}
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
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative">
        <Image 
          src={studio.image} 
          alt={studio.name} 
          fill 
          className="object-cover" 
        />
        {!studio.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Currently Unavailable</Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{studio.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {studio.city}, {studio.state}
            </div>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="ml-1 text-sm font-medium">{studio.rating}</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({studio.reviewCount})
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {studio.description}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {studio.amenities.slice(0, 3).map((amenity) => {
            const Icon = amenityIcons[amenity] || Clock
            return (
              <Badge key={amenity} variant="secondary" className="text-xs">
                <Icon className="h-3 w-3 mr-1" />
                {amenity}
              </Badge>
            )
          })}
          {studio.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{studio.amenities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div>
          <span className="text-lg font-bold">${studio.pricePerHour}</span>
          <span className="text-sm text-muted-foreground"> / hour</span>
        </div>
        <Button 
          asChild 
          disabled={!studio.isAvailable}
          variant={studio.isAvailable ? "default" : "secondary"}
        >
          <Link href={`/studios/${studio.id}`}>
            {studio.isAvailable ? "Book Now" : "View Details"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function StudiosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudiosPageContent />
    </Suspense>
  )
} 