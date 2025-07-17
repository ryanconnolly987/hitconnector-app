import { notFound, redirect } from "next/navigation"
import { API_BASE_URL } from "@/lib/config"

async function getStudioBySlug(slug: string) {
  try {
    // For server-side rendering, we need to construct a proper URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-domain.com'
      : 'http://localhost:3000'
    
    const url = `${baseUrl}/api/studios/${slug}`
    
    const response = await fetch(url, {
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
    console.error('Error fetching studio by slug:', error)
    return null
  }
}

export default async function StudiosSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const studio = await getStudioBySlug(slug)
  
  if (!studio) {
    notFound()
  }

  // Redirect to the proper studio ID route
  redirect(`/studio/${studio.id}`)
} 