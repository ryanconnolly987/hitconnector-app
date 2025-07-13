import { notFound } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"
import StudioProfileClient from "./StudioProfileClient"

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
  trackUrl?: string
  slug?: string
  rooms?: Array<{
    id: string
    name: string
    description: string
    hourlyRate: number
    capacity: number
    images: string[]
    equipment: string[]
  }>
  operatingHours?: {
    [key: string]: { open: string; close: string; closed: boolean }
  }
  staff?: Array<{
    id: string
    name: string
    role: string
    experience: string
    profileImage: string
  }>
  reviews?: Array<{
    id: string
    artistName: string
    artistImage: string
    rating: number
    comment: string
    date: string
  }>
  createdAt: string
  owner: string
  availability?: {
    [key: string]: { start: string; end: string }
  }
  followersCount?: number
}

async function getStudioBySlugOrId(identifier: string): Promise<Studio | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/studios/${identifier}`, {
      cache: 'no-store' // Ensure fresh data
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch studio: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching studio profile:', error)
    return null
  }
}

export default async function StudioProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: identifier } = await params
  const studio = await getStudioBySlugOrId(identifier)
  
  if (!studio) {
    notFound()
  }

  return <StudioProfileClient studio={studio} studioId={studio.id} />
} 