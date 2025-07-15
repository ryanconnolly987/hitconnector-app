import { notFound } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"
import ArtistProfileClient from "./ArtistProfileClient"
import type { Artist } from "@/lib/types"

async function getArtistBySlugOrId(identifier: string): Promise<Artist | null> {
  try {
    // Validate identifier first
    if (!identifier || identifier === 'undefined' || identifier === 'null') {
      console.error('Invalid identifier provided:', identifier)
      return null
    }

    // First try to get all users and find by slug
    const usersUrl = `${API_BASE_URL}/api/users`
    console.log('Fetching users from:', usersUrl)
    
    const usersResponse = await fetch(usersUrl, {
      cache: 'no-store'
    })
    
    if (usersResponse.ok) {
      let users
      try {
        users = await usersResponse.json()
      } catch (parseError) {
        console.error('Failed to parse users JSON:', parseError)
        users = []
      }
      
      // Look for artist by slug first (ensure users is an array)
      if (Array.isArray(users)) {
        const artistBySlug = users.find((user: Artist) => 
          user.slug === identifier && user.role === 'rapper'
        )
        if (artistBySlug) {
          return artistBySlug
        }
      }
    }

    // Fallback to ID lookup
    const userUrl = `${API_BASE_URL}/api/users/${identifier}`
    console.log('Fetching user from:', userUrl)
    
    const response = await fetch(userUrl, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch artist: ${response.status} ${response.statusText}`)
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch artist: ${response.status}`)
    }
    
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error('Failed to parse artist JSON:', parseError)
      throw new Error('Error parsing artist data')
    }
    
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
  
  // Validate params
  if (!identifier) {
    console.error('Artist ID missing in route params')
    notFound()
  }
  
  const profile = await getArtistBySlugOrId(identifier)
  
  if (!profile) {
    notFound()
  }

  // For now, we'll assume no authentication on server side
  // In a real app, you'd use getServerSession() or similar
  const isOwner = false

  return <ArtistProfileClient profile={profile} isOwner={isOwner} />
} 