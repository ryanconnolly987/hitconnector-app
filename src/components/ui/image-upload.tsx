"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X, Image } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface ImageUploadProps {
  label: string
  currentImage?: string
  onImageUpload: (imageUrl: string) => void
  userId: string
  type: 'banner' | 'avatar'
  aspectRatio?: string
  placeholder?: string
  maxSizeMB?: number
}

export function ImageUpload({
  label,
  currentImage,
  onImageUpload,
  userId,
  type,
  aspectRatio = type === 'banner' ? 'aspect-[16/9]' : 'aspect-square',
  placeholder,
  maxSizeMB = 5
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)
      setError(null)

      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string

        try {
          const endpoint = type === 'banner' ? '/api/upload/banner' : '/api/upload/avatar'
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              userId: userId
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Upload failed')
          }

          const result = await response.json()
          onImageUpload(result.imageUrl)
          
        } catch (error) {
          console.error('Upload error:', error)
          setError(error instanceof Error ? error.message : 'Upload failed')
          setPreview(currentImage || null)
        } finally {
          setUploading(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('File processing error:', error)
      setError('Failed to process file')
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onImageUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Preview Area */}
      <div className={`relative w-full ${aspectRatio} border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50`}>
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!uploading && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={triggerFileSelect}
                  className="h-8 w-8 p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={removeImage}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">Uploading...</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/75 transition-colors"
            onClick={triggerFileSelect}
          >
            <Image className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center px-4">
              {placeholder || `Click to upload ${type} image`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxSizeMB}MB • JPG, PNG, GIF
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Upload Button (alternative to click area) */}
      {!preview && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : `Upload ${label}`}
        </Button>
      )}

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
} 