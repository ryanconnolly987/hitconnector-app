'use client'

import { useState } from 'react'
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth'
import { buildArtistProfileHref } from '@/lib/url-utils'
import Link from 'next/link'

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  slug?: string;
  type?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: any;
  updatedAt: string;
  unreadCount: number;
  participantsInfo?: Array<UserInfo>;
  other?: UserInfo | null;
}

interface ConversationHeaderProps {
  conversation: Conversation;
  otherParticipant: UserInfo | null;
  onBack?: () => void;
  onConversationDeleted: (conversationId: string) => void;
}

export function ConversationHeader({
  conversation,
  otherParticipant,
  onBack,
  onConversationDeleted
}: ConversationHeaderProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const deleteConversation = async () => {
    if (!user?.id || deleting) return

    try {
      setDeleting(true)
      
      const response = await fetch(`/api/conversations/${conversation.id}?userId=${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Conversation deleted successfully",
        })
        
        // Notify parent component about deletion
        onConversationDeleted(conversation.id)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete conversation",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {/* Avatar and name as clickable link to profile */}
        {otherParticipant && (
          otherParticipant.type === 'studio' && otherParticipant.slug
            ? `/studios/${otherParticipant.slug}`
            : buildArtistProfileHref(otherParticipant)
        ) ? (
          <Link
            href={
              otherParticipant.type === 'studio' && otherParticipant.slug
                ? `/studios/${otherParticipant.slug}`
                : buildArtistProfileHref(otherParticipant)!
            }
            className="flex items-center space-x-3 hover:underline"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {otherParticipant?.name || 'Unknown User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {otherParticipant?.role === 'studio' ? 'Recording Studio' : 'Artist'}
              </p>
            </div>
          </Link>
        ) : (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.profileImage} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {otherParticipant?.name || 'Unknown User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {otherParticipant?.role === 'studio' ? 'Recording Studio' : 'Artist'}
              </p>
            </div>
          </>
        )}
        
        {/* Three dots menu */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" disabled={deleting}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            <Button
              variant="ghost"
              onClick={deleteConversation}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Conversation'}
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
} 