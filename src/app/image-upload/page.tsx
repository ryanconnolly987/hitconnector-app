"use client"

import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { Upload, X, AlertCircle, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the file type for our uploaded images
interface UploadedFile {
  id: string
  file: File
  preview: string
}

export default function ImageUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Maximum file size in bytes (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  // Allowed file types
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]

  // Handle file validation
  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File "${file.name}" exceeds the maximum size of 5MB`)
      return false
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`File "${file.name}" is not a supported format (.jpg/.png only)`)
      return false
    }

    return true
  }

  // Process files after validation
  const processFiles = (fileList: FileList) => {
    setError(null)

    const newFiles: UploadedFile[] = []

    Array.from(fileList).forEach((file) => {
      if (validateFile(file)) {
        const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        newFiles.push({
          id,
          file,
          preview: URL.createObjectURL(file),
        })
      }
    })

    if (newFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  // Handle drag events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  // Handle file removal
  const handleRemoveFile = (id: string) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file.id !== id)
      return updatedFiles
    })
  }

  // Handle click on drop zone
  const handleDropZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle save changes
  const handleSaveChanges = () => {
    // In a real app, you would upload the files to your server here
    console.log(
      "Files to upload:",
      files.map((f) => f.file),
    )
    // Show success message or handle errors
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleDropZoneClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".jpg,.jpeg,.png"
              multiple
              className="hidden"
              aria-label="Upload images"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">Drag & drop images here</p>
                <p className="text-sm text-muted-foreground">or click to browse your files</p>
                <p className="text-xs text-muted-foreground">Supports: JPG, JPEG, PNG (Max 5MB per file)</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Image Preview Gallery */}
          {files.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Uploaded Images ({files.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="group relative aspect-square rounded-md overflow-hidden border">
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt={file.file.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile(file.id)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white truncate">
                      {file.file.name}
                    </div>
                  </div>
                ))}

                {/* Add more images tile */}
                <div
                  className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={handleDropZoneClick}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Add More</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={files.length === 0} className="ml-auto">
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}