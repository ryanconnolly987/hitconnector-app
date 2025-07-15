import { notFound } from "next/navigation"
import ArtistProfileClient from "./ArtistProfileClient"
import type { Artist } from "@/lib/types"
import { getCompleteArtistProfileBySlugOrId } from "@/lib/profile-utils"

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

  // Validate identifier format
  if (!identifier || identifier === 'undefined' || identifier === 'null') {
    console.error('Invalid identifier provided:', identifier)
    notFound()
  }
  
  const profile = getCompleteArtistProfileBySlugOrId(identifier)
  
  if (!profile) {
    notFound()
  }

  // For now, we'll assume no authentication on server side
  // In a real app, you'd use getServerSession() or similar
  const isOwner = false

  return <ArtistProfileClient profile={profile} isOwner={isOwner} />
} 