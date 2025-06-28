"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Star, User, MessageSquare, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // Simulate loading and show that reviews functionality is coming soon
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/studio-dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Studio Reviews</h1>
              <p className="text-muted-foreground">Loading your studio reviews...</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
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

        {/* Coming Soon Message */}
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Star className="h-10 w-10 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Reviews Coming Soon</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're working on implementing a comprehensive review system where artists can rate and review their studio experiences.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium">Star Ratings</h3>
                <p className="text-sm text-muted-foreground">5-star rating system for detailed feedback</p>
              </div>
              
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium">Written Reviews</h3>
                <p className="text-sm text-muted-foreground">Detailed comments and feedback from artists</p>
              </div>
              
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium">Analytics</h3>
                <p className="text-sm text-muted-foreground">Track your studio's performance and ratings</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                In the meantime, focus on providing excellent service to your artists!
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild>
                  <Link href="/studio-dashboard">
                    Back to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/studio-dashboard/bookings">
                    View Bookings
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 