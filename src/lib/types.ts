export interface ProjectHighlight {
  id: string
  title: string
  description: string
}

export interface Artist {
  id: string
  name: string
  email: string
  slug?: string
  role?: string
  bio?: string
  location?: string
  experience?: string
  genres?: string[]
  socialMedia?: {
    instagram?: string
    twitter?: string
    soundcloud?: string
    spotify?: string
    youtube?: string
    website?: string
  }
  trackUrl?: string
  profileImage?: string
  bannerImage?: string
  projectHighlights?: ProjectHighlight[]
  created_at?: string
} 