"use client"

import { Button } from '@/components/ui/button'
import { useFollow } from '@/hooks/use-follow'
import { UserPlus, UserCheck, Users } from 'lucide-react'

interface FollowButtonProps {
  targetId: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  className?: string
}

interface FollowStatsProps {
  targetId: string
  className?: string
}

export function FollowButton({ 
  targetId, 
  variant = 'default',
  size = 'default',
  showIcon = true,
  className = ''
}: FollowButtonProps) {
  const { isFollowing, loading, toggleFollow, canFollow } = useFollow(targetId)

  if (!canFollow) {
    return null
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={toggleFollow}
      disabled={loading}
      className={className}
    >
      {showIcon && (
        isFollowing ? (
          <UserCheck className="mr-2 h-4 w-4" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )
      )}
      {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}

export function FollowStats({ targetId, className = '' }: FollowStatsProps) {
  const { followersCount, followingCount } = useFollow(targetId)

  return (
    <div className={`flex items-center gap-4 text-sm text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span>{followersCount} followers</span>
      </div>
      <div className="flex items-center gap-1">
        <span>{followingCount} following</span>
      </div>
    </div>
  )
} 