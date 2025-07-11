"use client"

import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '@/lib/config'

interface MessageButtonProps {
  targetId: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  className?: string
}

export function MessageButton({ 
  targetId, 
  variant = 'outline',
  size = 'default',
  showIcon = true,
  className = ''
}: MessageButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleMessage = async () => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send messages",
        variant: "destructive"
      })
      return
    }

    if (user.id === targetId) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot send messages to yourself",
        variant: "destructive"
      })
      return
    }

    try {
      // Check if conversation already exists
      const response = await fetch(`${API_BASE_URL}/api/messages?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const existingConversation = data.conversations.find((conv: any) => 
          conv.participants.includes(targetId)
        )

        if (existingConversation) {
          // Navigate to existing conversation
          router.push(`/messages?conversation=${existingConversation.id}`)
        } else {
          // Navigate to messages page - it will create a new conversation when first message is sent
          router.push(`/messages?recipient=${targetId}`)
        }
      } else {
        // Navigate to messages page anyway
        router.push(`/messages?recipient=${targetId}`)
      }
    } catch (error) {
      console.error('Error checking conversations:', error)
      // Navigate to messages page anyway
      router.push(`/messages?recipient=${targetId}`)
    }
  }

  if (!user || user.id === targetId) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleMessage}
      className={className}
    >
      {showIcon && (
        <MessageSquare className="mr-2 h-4 w-4" />
      )}
      Message
    </Button>
  )
} 