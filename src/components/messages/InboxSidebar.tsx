'use client'

import { useState, useEffect } from 'react'
import { Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

interface InboxSidebarProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  userCache: { [key: string]: UserInfo };
  currentUserId: string;
  loading?: boolean;
}

export function InboxSidebar({
  conversations,
  selectedConversationId,
  onConversationSelect,
  userCache,
  currentUserId,
  loading = false
}: InboxSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    // Use participantsInfo if available, fallback to userCache
    const otherParticipant = conversation.participantsInfo 
      ? conversation.participantsInfo.find(p => p.id !== currentUserId)
      : (() => {
          const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
          return otherParticipantId ? userCache[otherParticipantId] : null;
        })();
    
    if (!otherParticipant) return false;
    
    return otherParticipant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherParticipant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: Conversation): UserInfo | null => {
    // Use the explicit 'other' field if available (from updated API)
    if (conversation.other) {
      return conversation.other;
    }
    
    // Use participantsInfo if available (from new API), fallback to userCache
    if (conversation.participantsInfo) {
      return conversation.participantsInfo.find(p => p.id !== currentUserId) || null;
    }
    
    const otherParticipantId = conversation.participants.find(id => id !== currentUserId);
    return otherParticipantId ? userCache[otherParticipantId] : null;
  };

  const getLastMessagePreview = (message: Message | undefined): string => {
    if (!message) return "No messages yet";
    
    // Truncate long messages
    const maxLength = 50;
    const text = message.text;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="w-80 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search conversations..." className="pl-10" disabled />
          </div>
        </div>
        <div className="flex-1 p-2">
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="text-xs mt-1">
              {searchQuery ? 'Try a different search term' : 'Start a conversation by messaging someone'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isSelected = conversation.id === selectedConversationId;
              
              if (!otherParticipant) return null;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    isSelected && "bg-primary/10 border border-primary/20"
                  )}
                >
                  {/* Avatar - Instagram style */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherParticipant.profileImage} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator could go here */}
                  </div>
                  
                  {/* Content - Instagram style layout */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={cn(
                        "font-medium truncate text-sm",
                        conversation.unreadCount > 0 ? "text-foreground" : "text-foreground"
                      )}>
                        {otherParticipant.name}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-xs truncate",
                        conversation.unreadCount > 0 
                          ? "text-foreground font-medium" 
                          : "text-muted-foreground"
                      )}>
                        {conversation.lastMessage?.senderId === currentUserId && "You: "}
                        {getLastMessagePreview(conversation.lastMessage)}
                      </p>
                      
                      {/* Unread indicator - Instagram style blue dot */}
                      {conversation.unreadCount > 0 && (
                        <div className="flex-shrink-0 ml-2">
                          {conversation.unreadCount === 1 ? (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          ) : (
                            <Badge variant="default" className="h-5 min-w-[20px] rounded-full px-1.5 text-xs flex items-center justify-center">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 