'use client'

import { useState, KeyboardEvent } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled || sending) return

    setSending(true)
    try {
      await onSendMessage(trimmedMessage)
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-end space-x-2">
        {/* Additional buttons (future features) */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="mb-1 opacity-50 cursor-not-allowed"
          disabled
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            className={cn(
              "min-h-[44px] max-h-32 resize-none pr-12",
              "border-muted focus:border-primary transition-colors"
            )}
            rows={1}
          />
          
          {/* Emoji button (future feature) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 bottom-1 opacity-50 cursor-not-allowed"
            disabled
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || sending}
          size="icon"
          className="mb-1"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Character limit indicator (optional) */}
      {message.length > 900 && (
        <div className="mt-2 text-right">
          <span className={cn(
            "text-xs",
            message.length > 1000 ? "text-destructive" : "text-muted-foreground"
          )}>
            {message.length}/1000
          </span>
        </div>
      )}
    </div>
  )
} 