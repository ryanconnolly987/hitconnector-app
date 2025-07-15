'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Paperclip, Smile, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface MessageInputProps {
  onSendMessage: (text: string, attachment?: { type: 'attachment'; url: string; filename: string }) => Promise<void>;
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
  const [uploading, setUploading] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const handleSend = async (attachment?: { type: 'attachment'; url: string; filename: string }) => {
    const trimmedMessage = message.trim()
    if ((!trimmedMessage && !attachment) || disabled || sending) return

    setSending(true)
    try {
      await onSendMessage(trimmedMessage || "📎 Attachment", attachment)
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    const emojiText = emoji.native
    const textarea = textareaRef.current
    
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emojiText + message.slice(end)
      setMessage(newMessage)
      
      // Set cursor position after the emoji
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emojiText.length, start + emojiText.length)
      }, 0)
    } else {
      setMessage(prev => prev + emojiText)
    }
    
    setEmojiOpen(false)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/attachment', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        await handleSend({
          type: 'attachment',
          url: data.url,
          filename: file.name
        })
      } else {
        throw new Error('Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSendClick = () => {
    handleSend()
  }

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-end space-x-2">
        {/* File upload button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="mb-1"
          disabled={disabled || uploading || sending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        />
        
        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
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
          
          {/* Emoji picker */}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 bottom-1"
                disabled={disabled || sending}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-80 p-0">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Send button */}
        <Button
          onClick={handleSendClick}
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