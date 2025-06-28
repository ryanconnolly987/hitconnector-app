"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Filter, Calendar, CheckCircle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

interface Review {
  id: string
  artistName: string
  artistImage: string
  rating: number
  date: Date
  comment: string
  verifiedBooking: boolean
}

export default function StudioReviewsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State for reviews data
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [studioId, setStudioId] = useState<string>("")

  // State for filters
  const [sortBy, setSortBy] = useState<string>("recent")
  const [filterRating, setFilterRating] = useState<string>("all")

  // Fetch reviews data
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.email && !user?.id) {
        setLoading(false)
        return
      }
      
      try {
        console.log('🔍 [Reviews] Fetching studio data and reviews for user:', { email: user.email, id: user.id })
        
        // First, find the studio owned by this user
        const studiosResponse = await fetch(`${API_BASE_URL}/api/studios`)
        if (!studiosResponse.ok) {
          throw new Error('Failed to fetch studios')
        }
        
        const studiosData = await studiosResponse.json()
        const userStudios = studiosData.studios.filter((studio: any) => 
          studio.owner === user.email || studio.owner === user.id
        )
        
        if (userStudios.length > 0) {
          const studio = userStudios[0]
          const currentStudioId = studio.id || user.studioId
          setStudioId(currentStudioId)
          
          console.log(`⭐ [Reviews] Fetching reviews for studio: ${currentStudioId}`)
          
          // Fetch reviews for this studio
          const reviewsResponse = await fetch(`${API_BASE_URL}/api/reviews?studioId=${currentStudioId}`)
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json()
            const validReviews = (reviewsData.reviews || []).filter((review: any) => review.id)
            
            // Convert API reviews to component format
            const formattedReviews = validReviews.map((review: any) => ({
              id: review.id,
              artistName: review.artistName || review.userName || 'Anonymous',
              artistImage: review.artistImage || "/placeholder.svg?height=40&width=40",
              rating: review.rating || 0,
              date: new Date(review.createdAt || review.date || Date.now()),
              comment: review.comment || review.review || '',
              verifiedBooking: review.verifiedBooking || false
            }))
            
            console.log(`✅ [Reviews] Loaded ${formattedReviews.length} reviews`)
            setReviews(formattedReviews)
          } else {
            console.log(`❌ [Reviews] Failed to fetch reviews`)
            setReviews([])
          }
        } else {
          console.log('⚠️ [Reviews] No studio found for user')
          setReviews([])
        }
      } catch (error) {
        console.error('❌ [Reviews] Error fetching reviews:', error)
        toast({
          title: "Error Loading Reviews",
          description: "Failed to load review data. Please try again.",
          variant: "destructive"
        })
        setReviews([])
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [user, toast])

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Filter and sort reviews
  const filteredAndSortedReviews = reviews
    .filter((review) => {
      if (filterRating === "all") return true
      const rating = parseInt(filterRating)
      return review.rating === rating
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.date.getTime() - a.date.getTime()
        case "oldest":
          return a.date.getTime() - b.date.getTime()
        case "highest":
          return b.rating - a.rating
        case "lowest":
          return a.rating - b.rating
        default:
          return 0
      }
    })

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  // Count reviews by rating
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 
      : 0
  }))

  if (loading) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Studio Reviews</h1>
        <div className="flex items-center mt-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="ml-2 font-medium">{averageRating.toFixed(1)}</span>
          <span className="ml-1 text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2">
        {filteredAndSortedReviews.length > 0 ? (
          filteredAndSortedReviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={review.artistImage || "/placeholder.svg"} alt={review.artistName} />
                      <AvatarFallback>{getInitials(review.artistName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{review.artistName}</div>
                      <div className="text-sm text-muted-foreground">{review.date.toLocaleDateString()}</div>
                      <div className="flex items-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        {review.verifiedBooking && (
                          <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Verified Booking</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm">{review.comment}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium mb-2">No reviews found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more reviews</p>
          </div>
        )}
      </div>
    </div>
  )
}