"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface MessageButtonProps {
  recipientId: string
  recipientName?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
  children?: React.ReactNode
}

export function MessageButton({
  recipientId,
  recipientName,
  variant = "default",
  size = "default",
  className,
  children
}: MessageButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send messages.",
        variant: "destructive"
      })
      return
    }

    if (user.id === recipientId) {
      toast({
        title: "Invalid Action",
        description: "You cannot send a message to yourself.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Navigate to messages page with recipient parameter
      router.push(`/messages?recipient=${recipientId}`)
    } catch (error) {
      console.error('Error navigating to messages:', error)
      toast({
        title: "Error",
        description: "Failed to open messages. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {children || (
        <>
          <MessageSquare className="h-4 w-4 mr-2" />
          Message{recipientName ? ` ${recipientName}` : ''}
        </>
      )}
    </Button>
  )
} 