'use client'

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Send, Search, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "next/navigation"

interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  timestamp: string
  read: boolean
}

interface Conversation {
  id: string
  participants: string[]
  lastMessage?: Message
  messageCount: number
  messages?: Message[]
}

interface UserInfo {
  id: string
  name: string
  profileImage?: string
  type: 'artist' | 'studio'
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userCache, setUserCache] = useState<{ [key: string]: UserInfo }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      fetchConversations()
    }
  }, [user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  // Handle URL parameters for direct conversation
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    const recipientId = searchParams.get('recipient')

    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        setSelectedConversation(conversation)
        fetchConversationMessages(conversationId)
      }
    } else if (recipientId && conversations.length > 0) {
      // Look for existing conversation with this recipient
      const existingConversation = conversations.find(c => 
        c.participants.includes(recipientId)
      )
      if (existingConversation) {
        setSelectedConversation(existingConversation)
        fetchConversationMessages(existingConversation.id)
      } else {
        // Create a temporary conversation object for new conversation
        fetchUserInfo([recipientId]).then(() => {
          const tempConversation: Conversation = {
            id: 'new',
            participants: [user?.id || '', recipientId],
            messages: [],
            messageCount: 0
          }
          setSelectedConversation(tempConversation)
        })
      }
    }
  }, [searchParams, conversations, user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        // Fetch user info for all participants
        const allParticipants = new Set<string>()
        data.conversations.forEach((conv: Conversation) => {
          conv.participants.forEach(id => allParticipants.add(id))
        })
        
        await fetchUserInfo(Array.from(allParticipants))
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInfo = async (userIds: string[]) => {
    try {
      const promises = userIds.map(async (id) => {
        if (userCache[id] || id === user?.id) return null
        
        // Try fetching as artist first, then studio
        try {
          const artistResponse = await fetch(`${API_BASE_URL}/api/users/${id}`)
          if (artistResponse.ok) {
            const artistData = await artistResponse.json()
            return { id, ...artistData, type: 'artist' as const }
          }
        } catch {}
        
        try {
          const studioResponse = await fetch(`${API_BASE_URL}/api/studios/${id}`)
          if (studioResponse.ok) {
            const studioData = await studioResponse.json()
            return { id, name: studioData.name, profileImage: studioData.profileImage, type: 'studio' as const }
          }
        } catch {}
        
        return { id, name: 'Unknown User', type: 'artist' as const }
      })
      
      const results = await Promise.all(promises)
      const newUserCache = { ...userCache }
      
      results.forEach(result => {
        if (result) {
          newUserCache[result.id] = result
        }
      })
      
      setUserCache(newUserCache)
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages?userId=${user?.id}&conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversation)
      }
    } catch (error) {
      console.error('Error fetching conversation messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const otherParticipant = selectedConversation.participants.find(id => id !== user?.id)
      
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user?.id,
          recipientId: otherParticipant,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add message to current conversation
        if (selectedConversation) {
          const updatedConversation = {
            ...selectedConversation,
            id: data.conversationId, // Update ID if it was a new conversation
            messages: [...(selectedConversation.messages || []), data.messageData]
          }
          setSelectedConversation(updatedConversation)
        }
        
        setNewMessage("")
        // Refresh conversations list to update last message
        fetchConversations()
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        })
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getOtherParticipant = (conversation: Conversation): UserInfo | null => {
    const otherParticipantId = conversation.participants.find(id => id !== user?.id)
    return otherParticipantId ? userCache[otherParticipantId] || null : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-background">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r bg-background flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation by messaging someone from their profile
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation)
                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation)
                        fetchConversationMessages(conversation.id)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherParticipant?.profileImage} />
                          <AvatarFallback>
                            {otherParticipant?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">
                              {otherParticipant?.name || 'Unknown User'}
                            </h3>
                            {conversation.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {otherParticipant?.type && (
                              <Badge variant="outline" className="text-xs">
                                {otherParticipant.type}
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-background">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={getOtherParticipant(selectedConversation)?.profileImage} />
                      <AvatarFallback>
                        {getOtherParticipant(selectedConversation)?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {getOtherParticipant(selectedConversation)?.name || 'Unknown User'}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {getOtherParticipant(selectedConversation)?.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {selectedConversation.messages?.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium">Start the conversation</h3>
                        <p className="text-sm text-muted-foreground">
                          Send your first message to {getOtherParticipant(selectedConversation)?.name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 