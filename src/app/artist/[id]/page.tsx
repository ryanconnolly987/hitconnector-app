import { notFound } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"
import ArtistProfileClient from "./ArtistProfileClient"
import type { Artist } from "@/lib/types"

async function getArtistBySlugOrId(identifier: string): Promise<Artist | null> {
  try {
    // First try to get all users and find by slug
    const usersResponse = await fetch(`${API_BASE_URL}/api/users`, {
      cache: 'no-store'
    })
    
    if (usersResponse.ok) {
      const users = await usersResponse.json()
      // Look for artist by slug first
      const artistBySlug = users.find((user: Artist) => 
        user.slug === identifier && user.role === 'rapper'
      )
      if (artistBySlug) {
        return artistBySlug
      }
    }

    // Fallback to ID lookup
    const response = await fetch(`${API_BASE_URL}/api/users/${identifier}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch artist: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching artist profile:', error)
    return null
  }
}

export default async function ArtistProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: identifier } = await params
  const profile = await getArtistBySlugOrId(identifier)
  
  if (!profile) {
    notFound()
  }

  // For now, we'll assume no authentication on server side
  // In a real app, you'd use getServerSession() or similar
  const isOwner = false

  return <ArtistProfileClient profile={profile} isOwner={isOwner} />
} 