"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Star, User, Calendar, Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Review {
  id: number
  artistName: string
  rating: number
  comment: string
  date: string
  artistImage: string
  roomName?: string
  verified?: boolean
}

export default function StudioReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  // Mock reviews data
  const mockReviews: Review[] = [
    {
      id: 1,
      artistName: "Marcus Johnson",
      rating: 5,
      comment: "Amazing studio with top-notch equipment. The engineers are incredibly talented and helped bring my vision to life. Highly recommend for any serious recording project!",
      date: "2023-12-15",
      artistImage: "/placeholder.svg?height=40&width=40",
      roomName: "Studio A",
      verified: true
    },
    {
      id: 2,
      artistName: "Alicia Reynolds",
      rating: 5,
      comment: "Professional setup and great atmosphere. Perfect for recording vocals and the mixing quality is outstanding. The staff was very accommodating and helpful throughout the entire session.",
      date: "2023-12-10",
      artistImage: "/placeholder.svg?height=40&width=40",
      roomName: "Studio B",
      verified: true
    },
    {
      id: 3,
      artistName: "DJ Maximus",
      rating: 4,
      comment: "Great studio with excellent equipment. The booking process was smooth and the staff was very accommodating. Would definitely book again for future projects.",
      date: "2023-12-05",
      artistImage: "/placeholder.svg?height=40&width=40",
      roomName: "Studio A",
      verified: false
    },
    {
      id: 4,
      artistName: "Sarah Mitchell",
      rating: 5,
      comment: "Exceptional service and pristine sound quality. The acoustic treatment is perfect and the equipment selection is top tier. Couldn't be happier with the results!",
      date: "2023-11-28",
      artistImage: "/placeholder.svg?height=40&width=40",
      roomName: "Studio B",
      verified: true
    },
    {
      id: 5,
      artistName: "Carlos Rivera",
      rating: 4,
      comment: "Solid studio with good vibes. Equipment is modern and well-maintained. The engineers know what they're doing and helped me achieve the sound I was looking for.",
      date: "2023-11-20",
      artistImage: "/placeholder.svg?height=40&width=40",
      roomName: "Studio A",
      verified: true
    },
    {
      id: 6,
      artistName: "Emma Thompson",
      rating: 5,
      comment: "World-class facility! The attention to detail is incredible and the team goes above and beyond. This is where magic happens. Thank you for making my album sound amazing!",
      date: "2023-11-15",
      artistImage: "/placeholder.svg?height=40&width=40",
      roomName: "Studio B",
      verified: true
    }
  ]

  useEffect(() => {
    setReviews(mockReviews)
    setFilteredReviews(mockReviews)
  }, [])

  useEffect(() => {
    let filtered = [...reviews]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply rating filter
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter)
      filtered = filtered.filter(review => review.rating === rating)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "highest":
          return b.rating - a.rating
        case "lowest":
          return a.rating - b.rating
        default:
          return 0
      }
    })

    setFilteredReviews(filtered)
  }, [reviews, searchTerm, ratingFilter, sortBy])

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0"

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++
    })
    return distribution
  }

  const ratingDistribution = getRatingDistribution()

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/studio-dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Studio Reviews</h1>
            <p className="text-muted-foreground">Manage and view your studio reviews</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating}</div>
              <p className="text-xs text-muted-foreground">out of 5.0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ratingDistribution[5]}</div>
              <p className="text-xs text-muted-foreground">
                {reviews.length > 0 ? Math.round((ratingDistribution[5] / reviews.length) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Reviews</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reviews.filter(r => r.verified).length}
              </div>
              <p className="text-xs text-muted-foreground">verified bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution]
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rating" />
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Rating</SelectItem>
                  <SelectItem value="lowest">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map(review => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.artistImage} alt={review.artistName} />
                      <AvatarFallback>{review.artistName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{review.artistName}</h4>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                            {review.roomName && (
                              <span className="text-sm text-muted-foreground">
                                • {review.roomName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(review.date)}
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        "{review.comment}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || ratingFilter !== "all" 
                      ? "Try adjusting your filters to see more reviews."
                      : "Reviews from your clients will appear here."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 