"use client"

import { useState, useEffect } from 'react'
import { Music, ExternalLink, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MusicPlayerProps {
  trackUrl?: string
  className?: string
}

// URL validation patterns
const URL_PATTERNS = {
  youtube: /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/,
  soundcloud: /^https?:\/\/(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+(?:\?.*)?$/,
  mp3: /^https?:\/\/.*\.mp3(?:\?.*)?$/i,
  mp4: /^https?:\/\/.*\.mp4(?:\?.*)?$/i,
  wav: /^https?:\/\/.*\.wav(?:\?.*)?$/i,
  m4a: /^https?:\/\/.*\.m4a(?:\?.*)?$/i
}

function getUrlType(url: string): 'youtube' | 'soundcloud' | 'audio' | 'invalid' {
  if (!url) return 'invalid'
  
  if (URL_PATTERNS.youtube.test(url)) return 'youtube'
  if (URL_PATTERNS.soundcloud.test(url)) return 'soundcloud'
  if (URL_PATTERNS.mp3.test(url) || URL_PATTERNS.mp4.test(url) || 
      URL_PATTERNS.wav.test(url) || URL_PATTERNS.m4a.test(url)) return 'audio'
  
  return 'invalid'
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(URL_PATTERNS.youtube)
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`
  }
  return null
}

function getSoundCloudEmbedUrl(url: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`
}

export function MusicPlayer({ trackUrl, className = '' }: MusicPlayerProps) {
  const [urlType, setUrlType] = useState<'youtube' | 'soundcloud' | 'audio' | 'invalid'>('invalid')
  const [embedUrl, setEmbedUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!trackUrl) {
      setUrlType('invalid')
      setEmbedUrl('')
      setError('')
      return
    }

    setIsLoading(true)
    setError('')

    const type = getUrlType(trackUrl)
    setUrlType(type)

    switch (type) {
      case 'youtube':
        const youtubeUrl = getYouTubeEmbedUrl(trackUrl)
        if (youtubeUrl) {
          setEmbedUrl(youtubeUrl)
        } else {
          setError('Invalid YouTube URL format')
        }
        break
      
      case 'soundcloud':
        setEmbedUrl(getSoundCloudEmbedUrl(trackUrl))
        break
      
      case 'audio':
        setEmbedUrl(trackUrl)
        break
      
      case 'invalid':
        setError('Please enter a valid YouTube, SoundCloud, or direct audio file URL')
        break
    }

    setIsLoading(false)
  }, [trackUrl])

  if (!trackUrl) {
    return (
      <div className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center ${className}`}>
        <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No music track added yet
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add a YouTube, SoundCloud, or direct audio file URL to showcase your music
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className={`border border-muted rounded-lg p-8 text-center ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mx-auto mb-2"></div>
          <div className="h-8 bg-muted rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Featured Track</span>
        </div>
        <a
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open Original
        </a>
      </div>

      {urlType === 'youtube' && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-lg"
          />
        </div>
      )}

      {urlType === 'soundcloud' && (
        <div className="w-full">
          <iframe
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={embedUrl}
            className="rounded-lg"
          />
        </div>
      )}

      {urlType === 'audio' && (
        <div className="w-full">
          <audio
            controls
            className="w-full h-12 rounded-lg bg-muted"
            preload="metadata"
          >
            <source src={embedUrl} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  )
}

export function MusicPlayerInput({ 
  value, 
  onChange, 
  placeholder = "Paste your YouTube, SoundCloud, or direct audio file URL...",
  className = ''
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [localValue, setLocalValue] = useState(value)
  const [urlType, setUrlType] = useState<'youtube' | 'soundcloud' | 'audio' | 'invalid'>('invalid')

  useEffect(() => {
    setLocalValue(value)
    if (value) {
      setUrlType(getUrlType(value))
    } else {
      setUrlType('invalid')
    }
  }, [value])

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    onChange(newValue)
    
    if (newValue) {
      setUrlType(getUrlType(newValue))
    } else {
      setUrlType('invalid')
    }
  }

  const getStatusColor = () => {
    if (!localValue) return 'border-muted-foreground/25'
    switch (urlType) {
      case 'youtube':
      case 'soundcloud':
      case 'audio':
        return 'border-green-500'
      case 'invalid':
        return 'border-red-500'
      default:
        return 'border-muted-foreground/25'
    }
  }

  const getStatusText = () => {
    if (!localValue) return ''
    switch (urlType) {
      case 'youtube':
        return '✓ Valid YouTube URL'
      case 'soundcloud':
        return '✓ Valid SoundCloud URL'
      case 'audio':
        return '✓ Valid audio file URL'
      case 'invalid':
        return '✗ Invalid URL format'
      default:
        return ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          type="url"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${getStatusColor()}`}
        />
        {localValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Music className={`h-4 w-4 ${urlType === 'invalid' ? 'text-red-500' : 'text-green-500'}`} />
          </div>
        )}
      </div>
      
      {localValue && (
        <p className={`text-xs ${urlType === 'invalid' ? 'text-red-600' : 'text-green-600'}`}>
          {getStatusText()}
        </p>
      )}
      
      {!localValue && (
        <p className="text-xs text-muted-foreground">
          Supported formats: YouTube videos, SoundCloud tracks, direct links to MP3/MP4/WAV/M4A files
        </p>
      )}
    </div>
  )
} 