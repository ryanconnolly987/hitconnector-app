'use client'

import { ExternalLink, Download, FileText, Image, Music, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Message {
  id: string;
  text: string;
  type?: 'text' | 'attachment';
  attachmentUrl?: string;
  attachmentFilename?: string;
  timestamp: string;
}

interface MessageBubbleProps {
  message: Message;
  isFromCurrentUser: boolean;
}

function getFileIcon(filename: string, url: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const audioTypes = ['mp3', 'wav', 'mpeg']
  const videoTypes = ['mp4', 'mov']
  
  if (imageTypes.includes(extension)) return <Image className="h-4 w-4" />
  if (audioTypes.includes(extension)) return <Music className="h-4 w-4" />
  if (videoTypes.includes(extension)) return <Video className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

function renderAttachment(message: Message) {
  if (!message.attachmentUrl || !message.attachmentFilename) return null
  
  const extension = message.attachmentFilename.split('.').pop()?.toLowerCase() || ''
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  
  return (
    <div className="max-w-xs">
      {imageTypes.includes(extension) ? (
        <div className="relative">
          <img
            src={message.attachmentUrl}
            alt={message.attachmentFilename}
            className="rounded-lg max-w-full h-auto max-h-64 object-cover"
          />
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <ExternalLink className="h-3 w-3 text-white" />
          </a>
        </div>
      ) : (
        <div className="border rounded-lg p-3 bg-background/50">
          <div className="flex items-center gap-2 mb-2">
            {getFileIcon(message.attachmentFilename, message.attachmentUrl)}
            <span className="text-sm font-medium truncate flex-1">
              {message.attachmentFilename}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href={message.attachmentUrl}
                download={message.attachmentFilename}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MessageBubble({ message, isFromCurrentUser }: MessageBubbleProps) {
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn(
      "max-w-[70%] px-4 py-2 rounded-2xl",
      isFromCurrentUser 
        ? "bg-primary text-primary-foreground rounded-br-md" 
        : "bg-muted text-foreground rounded-bl-md"
    )}>
      {message.type === 'attachment' ? (
        <div className="space-y-2">
          {renderAttachment(message)}
          {message.text && message.text !== "📎 Attachment" && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.text}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.text}
        </p>
      )}
      <p className={cn(
        "text-xs mt-1 opacity-70",
        isFromCurrentUser ? "text-primary-foreground" : "text-muted-foreground"
      )}>
        {formatMessageTime(message.timestamp)}
      </p>
    </div>
  )
} 