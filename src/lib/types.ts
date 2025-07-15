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
  avatarUrl?: string | null  // Preferred field for avatar images
  bannerImage?: string
  projectHighlights?: ProjectHighlight[]
  created_at?: string
}

export interface Booking {
  id: string
  studioId: string
  studioName: string
  roomId: string
  roomName: string
  userId: string
  userName: string
  userEmail: string
  date: string
  startTime: string
  endTime: string
  duration: number
  hourlyRate: number
  totalCost: number
  message: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
  createdAt: string
  // Enhanced artist fields for studio dashboard
  artistId?: string
  artistName?: string
  artistSlug?: string
  artistProfilePicture?: string | null
  // Engineer preference
  staffId?: string | null
  staffName?: string | null
  engineer?: {
    displayName: string
  }
} 