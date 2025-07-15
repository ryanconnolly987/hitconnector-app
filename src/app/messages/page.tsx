'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { InboxSidebar } from '@/components/messages/InboxSidebar'
import { ChatPanel } from '@/components/messages/ChatPanel'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
  senderInfo?: {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
  };
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
  unreadCount: number;
  participantsInfo?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
  }>;
  other?: {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
  } | null;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

function MessagesPageContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userCache, setUserCache] = useState<{ [key: string]: UserInfo }>({})
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  // Handle URL parameters for direct messaging
  useEffect(() => {
    const recipientId = searchParams.get('recipient')
    
    if (recipientId && user?.id && recipientId !== user.id) {
      createOrFetchConversation(user.id, recipientId)
    }
  }, [searchParams, user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchConversations()
    }
  }, [user?.id])

  const fetchConversations = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/conversations?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        // With the new API, we no longer need to fetch user info separately
        // as participantsInfo is included in the response
        
        // However, we still populate userCache for backward compatibility
        const allParticipants = new Set<string>()
        data.conversations.forEach((conv: Conversation) => {
          if (conv.participantsInfo) {
            conv.participantsInfo.forEach((participant) => {
              if (participant.id !== user.id) {
                allParticipants.add(participant.id)
                // Add to cache
                setUserCache(prev => ({
                  ...prev,
                  [participant.id]: participant
                }))
              }
            })
          } else {
            // Fallback for conversations without participantsInfo
            conv.participants.forEach((id: string) => {
              if (id !== user.id) allParticipants.add(id)
            })
          }
        })
        
        // Only fetch user info for conversations without participantsInfo
        const conversationsNeedingUserInfo = data.conversations.filter((conv: Conversation) => !conv.participantsInfo)
        if (conversationsNeedingUserInfo.length > 0) {
          const participantsNeedingInfo = new Set<string>()
          conversationsNeedingUserInfo.forEach((conv: Conversation) => {
            conv.participants.forEach((id: string) => {
              if (id !== user.id) participantsNeedingInfo.add(id)
            })
          })
          
          if (participantsNeedingInfo.size > 0) {
            await fetchUserInfo(Array.from(participantsNeedingInfo))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInfo = async (userIds: string[]) => {
    const promises = userIds.map(async (userId) => {
      if (userCache[userId]) return userCache[userId]
      
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (response.ok) {
          const userData = await response.json()
          return {
            id: userId,
            name: userData.name || userData.email || 'Unknown User',
            email: userData.email || '',
            role: userData.role || 'user',
            profileImage: userData.profileImage
          }
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error)
      }
      
      return {
        id: userId,
        name: 'Unknown User',
        email: '',
        role: 'user'
      }
    })

    const usersData = await Promise.all(promises)
    const newUserCache = { ...userCache }
    usersData.forEach(userData => {
      if (userData) {
        newUserCache[userData.id] = userData
      }
    })
    setUserCache(newUserCache)
  }

  const createOrFetchConversation = async (senderId: string, receiverId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, receiverId })
      })

      if (response.ok) {
        const data = await response.json()
        
        // The new API returns participantsInfo, so we don't need to fetch user info separately
        if (data.conversation.participantsInfo) {
          data.conversation.participantsInfo.forEach((participant: UserInfo) => {
            setUserCache(prev => ({
              ...prev,
              [participant.id]: participant
            }))
          })
        } else {
          // Fallback for older API response
          await fetchUserInfo([receiverId])
        }
        
        // Update conversations list if this is a new conversation
        setConversations(prev => {
          const exists = prev.find(conv => conv.id === data.conversation.id)
          if (!exists) {
            return [data.conversation, ...prev]
          }
          return prev
        })
        
        // Select this conversation
        setSelectedConversation(data.conversation)
        setShowSidebar(false) // Hide sidebar on mobile when conversation is selected
        
        // Load messages for this conversation
        await loadConversationMessages(data.conversation.id)
      }
    } catch (error) {
      console.error('Error creating/fetching conversation:', error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      })
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    if (!user?.id) return

    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        
        // Update conversation with participantsInfo if received
        if (data.conversation?.participantsInfo) {
          setSelectedConversation(data.conversation)
          
          // Update user cache with participant info
          data.conversation.participantsInfo.forEach((participant: UserInfo) => {
            setUserCache(prev => ({
              ...prev,
              [participant.id]: participant
            }))
          })
        }
        
        // Mark messages as read
        if (selectedConversation?.unreadCount && selectedConversation.unreadCount > 0) {
          await markMessagesAsRead(conversationId)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      if (response.ok) {
        // Update local conversation to clear unread count
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ))
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setShowSidebar(false) // Hide sidebar on mobile
    await loadConversationMessages(conversation.id)
    
    // Mark conversation as read when opened
    if (conversation.unreadCount > 0) {
      await markMessagesAsRead(conversation.id)
    }
  }

  const handleSendMessage = async (text: string, attachment?: { type: 'attachment'; url: string; filename: string }) => {
    if (!selectedConversation || !user?.id || sending) return

    const otherParticipant = selectedConversation.participants.find(id => id !== user.id)
    if (!otherParticipant) return

    setSending(true)
    try {
      const messageData: any = {
        conversationId: selectedConversation.id,
        senderId: user.id,
        receiverId: otherParticipant,
        text
      }

      if (attachment) {
        messageData.type = 'attachment'
        messageData.attachmentUrl = attachment.url
        messageData.attachmentFilename = attachment.filename
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const data = await response.json()
        
        // The new API returns the message with senderInfo
        setMessages(prev => [...prev, data.data])
        
        // Update conversation in list
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                lastMessage: data.data, 
                updatedAt: data.data.timestamp 
              }
            : conv
        ))
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleBack = () => {
    setShowSidebar(true)
    setSelectedConversation(null)
    setMessages([])
  }

  const handleConversationDeleted = (conversationId: string) => {
    // Remove conversation from the list
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    
    // If the deleted conversation was currently selected, go back to conversation list
    if (selectedConversation?.id === conversationId) {
      handleBack()
    }
    
    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed from your inbox"
    })
  }

  const handleBackToDashboard = () => {
    const role = user?.role
    router.push(role === 'studio' ? '/studio-dashboard' : '/dashboard')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-muted-foreground mb-4">You need to be signed in to access messages</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back to Dashboard Button */}
      <div className="p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-20">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b bg-background/95 backdrop-blur sticky top-16 z-10">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-121px)] md:h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'block' : 'hidden'} md:block`}>
          <InboxSidebar
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onConversationSelect={handleConversationSelect}
            userCache={userCache}
            currentUserId={user.id}
            loading={loading}
          />
        </div>

        {/* Chat Panel */}
        <div className={`flex-1 ${!showSidebar ? 'block' : 'hidden'} md:block`}>
          <ChatPanel
            conversation={selectedConversation}
            messages={messages}
            userCache={userCache}
            currentUserId={user.id}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
            loading={loadingMessages}
            sending={sending}
            onConversationDeleted={handleConversationDeleted}
          />
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  )
} 