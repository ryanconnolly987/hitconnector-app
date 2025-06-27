"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, MessageSquare, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

// Define the review type
interface Review {
  id: string
  artistName: string
  artistImage: string
  rating: number
  date: Date
  comment: string
  verifiedBooking: boolean
  response?: string
}

export default function StudioReviewsPage() {
  // Mock reviews data
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      artistName: "Marcus Johnson",
      artistImage: "/placeholder.svg?height=40&width=40",
      rating: 5,
      date: new Date("2025-04-28"),
      comment:
        "Amazing studio with top-notch equipment. Michael was incredibly helpful and made the recording process smooth. The acoustics in Studio A are perfect for my band's sound. Will definitely be booking again soon!",
      verifiedBooking: true,
    },
    {
      id: "2",
      artistName: "Alicia Reynolds",
      artistImage: "/placeholder.svg?height=40&width=40",
      rating: 5,
      date: new Date("2025-04-15"),
      comment:
        "I've recorded at many studios in LA, and Soundwave is definitely one of the best. Great engineers, comfortable environment, and the equipment is all high quality. Sarah's mixing skills are exceptional.",
      verifiedBooking: true,
      response:
        "Thank you for the kind words, Alicia! We loved working with you and can't wait to have you back for your next project.",
    },
    {
      id: "3",
      artistName: "DJ Maximus",
      artistImage: "/placeholder.svg?height=40&width=40",
      rating: 4,
      date: new Date("2025-03-30"),
      comment:
        "Solid studio with a great vibe. Sarah's mixing skills are exceptional. Only reason for 4 stars is that parking can be a bit limited during peak hours, but the recording experience itself was fantastic.",
      verifiedBooking: true,
    },
    {
      id: "4",
      artistName: "Lyrical Genius",
      artistImage: "/placeholder.svg?height=40&width=40",
      rating: 5,
      date: new Date("2025-03-22"),
      comment:
        "The studio exceeded my expectations. The sound isolation is incredible, and the staff was professional and accommodating. I was able to record my entire EP in just two sessions. Highly recommend!",
      verifiedBooking: true,
    },
    {
      id: "5",
      artistName: "Beat Master",
      artistImage: "/placeholder.svg?height=40&width=40",
      rating: 3,
      date: new Date("2025-03-15"),
      comment:
        "Good equipment and knowledgeable staff, but the session felt a bit rushed. Would have appreciated more time to get the perfect sound. The mixing was excellent though.",
      verifiedBooking: false,
    },
    {
      id: "6",
      artistName: "Vocal Queen",
      artistImage: "/placeholder.svg?height=40&width=40",
      rating: 5,
      date: new Date("2025-03-10"),
      comment:
        "As a vocalist, I'm very particular about the microphones and acoustics. This studio had everything I needed and more. The vocal booth was spacious and the engineer knew exactly how to capture my voice. Perfect experience!",
      verifiedBooking: true,
    },
    {
      id: "7",
      artistName: "Guitar Hero",
      artistImage: "/placeholder.svg?height=40&width=40",
      rating: 4,
      date: new Date("2025-03-05"),
      comment:
        "Great selection of amps and guitars. The engineer had a good ear for guitar tones and helped me dial in the perfect sound. Would definitely come back for my next recording.",
      verifiedBooking: true,
    },
  ])

  // State for filters
  const [sortBy, setSortBy] = useState<string>("recent")
  const [filterRating, setFilterRating] = useState<string>("all")

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Filter and sort reviews
  const filteredAndSortedReviews = [...reviews]
    .filter((review) => {
      if (filterRating === "all") return true
      return review.rating === Number.parseInt(filterRating, 10)
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return b.date.getTime() - a.date.getTime()
      } else if (sortBy === "highest") {
        return b.rating - a.rating || b.date.getTime() - a.date.getTime()
      } else if (sortBy === "lowest") {
        return a.rating - b.rating || b.date.getTime() - a.date.getTime()
      }
      return 0
    })

  // Calculate average rating
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0

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
              <SelectGroup>
                <SelectLabel>Sort by</SelectLabel>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filter by rating</SelectLabel>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectGroup>
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
                      <div className="text-sm text-muted-foreground">{format(review.date, "MMMM d, yyyy")}</div>
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
                            <CheckCircle2 className="h-3 w-3" />
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

                {review.response && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Studio Response</div>
                        <p className="text-sm mt-1">{review.response}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!review.response && (
                  <button className="text-sm text-primary hover:underline mt-4 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>Reply to this review</span>
                  </button>
                )}
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