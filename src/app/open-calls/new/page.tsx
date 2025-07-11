"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '@/lib/config'
import { ArrowLeft, Megaphone, MapPin, DollarSign, Calendar, Mail } from 'lucide-react'
import Link from 'next/link'

const COMMON_ROLES = [
  "Looking for mixing engineer",
  "Need a vocalist",
  "Seeking drummer",
  "Looking for producer",
  "Need guitarist",
  "Seeking bassist",
  "Looking for keyboard player",
  "Need songwriter",
  "Seeking sound engineer",
  "Looking for session musician",
  "Need mastering engineer",
  "Seeking collaborator",
  "Other"
]

const GENRES = [
  "Hip Hop", "R&B", "Pop", "Rock", "Country", "Electronic", "Jazz", "Classical", 
  "Blues", "Folk", "Reggae", "Latin", "World", "Alternative", "Indie", "Metal", "Other"
]

export default function NewOpenCallPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    role: '',
    customRole: '',
    description: '',
    genre: '',
    location: '',
    budget: '',
    deadline: '',
    contactEmail: user?.email || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post an open call.",
        variant: "destructive"
      })
      return
    }

    const finalRole = formData.role === 'Other' ? formData.customRole : formData.role
    
    if (!finalRole.trim() || !formData.description.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in the role and description fields.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/open-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postedById: user.id,
          postedByType: 'user', // For now, assuming all posts are by artists
          role: finalRole,
          description: formData.description,
          genre: formData.genre || undefined,
          location: formData.location || undefined,
          budget: formData.budget || undefined,
          deadline: formData.deadline || undefined,
          contactEmail: formData.contactEmail
        })
      })

      if (response.ok) {
        toast({
          title: "Open Call Posted!",
          description: "Your open call has been published successfully.",
        })
        router.push('/open-calls')
      } else {
        // Handle API errors
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast({
          title: "Error Creating Open Call",
          description: errorData.error || "Failed to create open call. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating open call:', error)
      toast({
        title: "Network Error",
        description: "Failed to connect to the server. Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to post an open call.</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Post New Open Call</h1>
        </div>
        <p className="text-muted-foreground">
          Find collaborators for your next music project.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">What are you looking for? *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.role === 'Other' && (
                <Input
                  placeholder="Describe the role you're looking for"
                  value={formData.customRole}
                  onChange={(e) => handleInputChange('customRole', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project, what you're looking for, and any specific requirements..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select 
                value={formData.genre} 
                onValueChange={(value) => handleInputChange('genre', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select genre (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="h-4 w-4 inline mr-1" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., Los Angeles, CA or Remote"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Budget
              </Label>
              <Input
                id="budget"
                placeholder="e.g., $500-1000, Negotiable, Rev Share"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">
                <Calendar className="h-4 w-4 inline mr-1" />
                Deadline
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                <Mail className="h-4 w-4 inline mr-1" />
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="your.email@example.com"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Interested artists will be able to contact you at this email.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Post Open Call
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 