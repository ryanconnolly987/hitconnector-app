"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton, FollowStats } from "@/components/ui/follow-button"
import { Star, MapPin, Calendar, Music, Globe, Instagram, Twitter, ExternalLink, User, Headphones, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MusicPlayer } from "@/components/ui/music-player"
import { MessageButton } from "@/components/ui/message-button"
import type { Artist } from "@/lib/types"

export default function ArtistProfileClient({ 
  profile, 
  isOwner,
  backHref
}: { 
  profile: Artist
  isOwner: boolean
  backHref?: string
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArtistProfile = async () => {
      try {
        setLoading(true)
        // This useEffect is now redundant as data is fetched in the parent async function
        // but keeping it for consistency with the original client-side logic
        // For now, we'll just set loading to false as data is already fetched
        setLoading(false)
      } catch (error) {
        console.error('Error fetching artist profile:', error)
        setError('Failed to load artist profile')
        toast({
          title: "Error",
          description: "Failed to load artist profile",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (profile) {
      fetchArtistProfile()
    }
  }, [profile, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading artist profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <User className="h-5 w-5" />
              Artist Not Found
            </CardTitle>
            <CardDescription>
              {error || "The artist profile you're looking for doesn't exist."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/find-studios">Discover Artists</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return "Recently joined"
    try {
      const date = new Date(dateString)
      return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    } catch {
      return "Recently joined"
    }
  }

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />
      case 'twitter': return <Twitter className="h-4 w-4" />
      case 'website': return <Globe className="h-4 w-4" />
      default: return <ExternalLink className="h-4 w-4" />
    }
  }

  const getSocialUrl = (platform: string, handle: string) => {
    if (handle.startsWith('http')) return handle
    
    switch (platform.toLowerCase()) {
      case 'instagram': return `https://instagram.com/${handle.replace('@', '')}`
      case 'twitter': return `https://twitter.com/${handle.replace('@', '')}`
      case 'soundcloud': return `https://soundcloud.com/${handle}`
      case 'spotify': return handle.includes('spotify.com') ? handle : `https://open.spotify.com/search/${encodeURIComponent(handle)}`
      case 'youtube': return handle.includes('youtube.com') ? handle : `https://youtube.com/search?q=${encodeURIComponent(handle)}`
      default: return handle
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
        {profile.bannerImage ? (
          <img
            src={profile.bannerImage}
            alt={`${profile.name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Back Button */}
        {backHref && (
          <Link
            href={backHref}
            className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-sm font-medium shadow hover:bg-white z-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <div className="container max-w-6xl mx-auto px-4 -mt-20 relative">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage src={profile.profileImage} alt={profile.name} />
            <AvatarFallback className="text-2xl">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 bg-background rounded-lg p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  {profile.role && (
                    <Badge variant="secondary" className="capitalize">
                      {profile.role}
                    </Badge>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatMemberSince(profile.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FollowStats targetId={profile.id} />
                {user?.id !== profile.id && (
                  <>
                    <FollowButton targetId={profile.id} />
                    <MessageButton recipientId={profile.id} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {profile.bio || "No bio provided yet."}
                </p>
              </CardContent>
            </Card>

            {/* Music Sample */}
            {profile.trackUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Music Sample
                  </CardTitle>
                  <CardDescription>
                    Listen to {profile.name}'s latest work
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MusicPlayer trackUrl={profile.trackUrl} />
                </CardContent>
              </Card>
            )}

            {/* Project Highlights */}
            {profile.projectHighlights && profile.projectHighlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Project Highlights
                  </CardTitle>
                  <CardDescription>
                    Featured work and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-1">
                    {profile.projectHighlights.map((project) => (
                      <Card key={project.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                          <p className="text-muted-foreground">{project.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.experience && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Experience Level
                    </h4>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {profile.experience}
                    </Badge>
                  </div>
                )}

                {profile.genres && profile.genres.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Genres
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.genres.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            {profile.socialMedia && Object.keys(profile.socialMedia).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Connect</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(profile.socialMedia).map(([platform, handle]) => {
                      if (!handle) return null
                      return (
                        <a
                          key={platform}
                          href={getSocialUrl(platform, handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                        >
                          {getSocialIcon(platform)}
                          <span className="text-sm capitalize">
                            {platform}: {handle}
                          </span>
                        </a>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href={`mailto:${profile.email}`}>
                    Send Message
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 