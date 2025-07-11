import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

interface FollowStatus {
  isFollowing: boolean
  followersCount: number
  followingCount: number
}

interface FollowData {
  id: string
  name: string
  type: 'user' | 'studio'
  profileImage?: string
  location?: string
  rating?: number
}

export function useFollow(targetId: string) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    followersCount: 0,
    followingCount: 0
  })
  const [loading, setLoading] = useState(false)

  // Fetch current follow status
  const fetchFollowStatus = useCallback(async () => {
    if (!user?.id || !targetId) return

    try {
      const response = await fetch(
        `/api/users/${user.id}/follow-status/${targetId}`
      )
      if (response.ok) {
        const data = await response.json()
        setFollowStatus({
          isFollowing: data.isFollowing,
          followersCount: data.followersCount,
          followingCount: data.followingCount
        })
      }
    } catch (error) {
      console.error('Failed to fetch follow status:', error)
    }
  }, [user?.id, targetId])

  // Toggle follow/unfollow
  const toggleFollow = useCallback(async () => {
    if (!user?.id || !targetId || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: user.id,
          followedId: targetId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFollowStatus({
          isFollowing: data.isFollowing,
          followersCount: data.followersCount,
          followingCount: data.followingCount
        })

        toast({
          title: data.action === 'followed' ? 'Following!' : 'Unfollowed',
          description: data.action === 'followed' 
            ? 'You are now following this profile.' 
            : 'You have unfollowed this profile.',
          variant: 'default'
        })
      } else {
        throw new Error('Failed to update follow status')
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      toast({
        title: 'Error',
        description: 'Failed to update follow status. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, targetId, loading, toast])

  // Load follow status on mount
  useEffect(() => {
    fetchFollowStatus()
  }, [fetchFollowStatus])

  return {
    isFollowing: followStatus.isFollowing,
    followersCount: followStatus.followersCount,
    followingCount: followStatus.followingCount,
    loading,
    toggleFollow,
    canFollow: user && user.id !== targetId
  }
}

export function useFollowing() {
  const { user } = useAuth()
  const [following, setFollowing] = useState<FollowData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchFollowing = async () => {
      try {
        const response = await fetch(`/api/follow/following/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setFollowing(data.following || [])
        }
      } catch (error) {
        console.error('Error fetching following:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowing()
  }, [user?.id])

  return { following, loading }
}

export function useFollowers(userId?: string) {
  const [followers, setFollowers] = useState<FollowData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/users/${userId}/followers`)
        if (response.ok) {
          const data = await response.json()
          setFollowers(data.followers || [])
        }
      } catch (error) {
        console.error('Failed to fetch followers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowers()
  }, [userId])

  return { followers, loading }
} 