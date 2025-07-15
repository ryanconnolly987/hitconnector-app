'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, User, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { MessageInput } from './MessageInput'
import { ConversationHeader } from './ConversationHeader'

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

interface ChatPanelProps {
  conversation: Conversation | null;
  messages: Message[];
  userCache: { [key: string]: UserInfo };
  currentUserId: string;
  onSendMessage: (text: string) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  sending?: boolean;
  onConversationDeleted?: (conversationId: string) => void;
}

export function ChatPanel({
  conversation,
  messages,
  userCache,
  currentUserId,
  onSendMessage,
  onBack,
  loading = false,
  sending = false,
  onConversationDeleted
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on conversation load or when new message arrives
  useEffect(() => {
    if (conversation && messages.length > 0) {
      scrollToBottomIfNearBottom();
    }
  }, [messages, conversation]);

  // Scroll to bottom when conversation first loads
  useEffect(() => {
    if (conversation && messages.length > 0) {
      // Always scroll to bottom when conversation first loads
      scrollToBottom();
    }
  }, [conversation?.id]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToBottomIfNearBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const getOtherParticipant = (): UserInfo | null => {
    if (!conversation) return null;
    
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

  const getSenderInfo = (message: Message): UserInfo | null => {
    // Use senderInfo if available (from new API), fallback to userCache or participantsInfo
    if (message.senderInfo) {
      return message.senderInfo;
    }
    
    if (conversation?.participantsInfo) {
      return conversation.participantsInfo.find(p => p.id === message.senderId) || null;
    }
    
    return userCache[message.senderId] || null;
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    // Always show avatar for incoming messages if it's the last message from that sender
    if (currentMessage.senderId === currentUserId) return false;
    
    if (!nextMessage) return true;
    
    return nextMessage.senderId !== currentMessage.senderId;
  };

  const otherParticipant = getOtherParticipant();

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
          <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Header Skeleton */}
        <div className="p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Messages Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={cn(
              "flex",
              i % 3 === 0 ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[70%] p-3 rounded-lg animate-pulse",
                i % 3 === 0 ? "bg-primary/20" : "bg-muted"
              )}>
                <div className="h-4 bg-muted-foreground/20 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <ConversationHeader
        conversation={conversation}
        otherParticipant={otherParticipant}
        onBack={onBack}
        onConversationDeleted={onConversationDeleted || (() => {})}
      />

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isFromCurrentUser = message.senderId === currentUserId;
              const previousMessage = index > 0 ? messages[index - 1] : undefined;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              const showAvatar = shouldShowAvatar(message, nextMessage);
              const senderInfo = getSenderInfo(message);
              
              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
                        {formatMessageDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  {/* Message */}
                  <div className={cn(
                    "flex mb-2 items-end",
                    isFromCurrentUser ? "justify-end" : "justify-start"
                  )}>
                    {/* Avatar for incoming messages */}
                    {!isFromCurrentUser && (
                      <div className="mr-2 mb-1">
                        {showAvatar ? (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={senderInfo?.profileImage} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {senderInfo?.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-6 h-6" /> // Spacer to maintain alignment
                        )}
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={cn(
                      "max-w-[70%] px-4 py-2 rounded-2xl",
                      isFromCurrentUser 
                        ? "bg-primary text-primary-foreground rounded-br-md" 
                        : "bg-muted text-foreground rounded-bl-md"
                    )}>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <p className={cn(
                        "text-xs mt-1 opacity-70",
                        isFromCurrentUser ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput 
        onSendMessage={onSendMessage}
        disabled={sending}
        placeholder={`Message ${otherParticipant?.name || 'user'}...`}
      />
    </div>
  );
} 