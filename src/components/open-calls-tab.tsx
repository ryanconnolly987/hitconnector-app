"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/config'
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Mail,
  User,
  Building2,
  Clock,
  Send,
  Plus,
  Megaphone,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OpenCall {
  id: string
  postedById: string
  postedByType: 'user' | 'studio'
  postedByName: string
  postedByImage: string
  role: string
  description: string
  genre?: string
  location?: string
  budget?: string
  deadline?: string
  contactEmail: string
  status: string
  createdAt: string
  applicants: Array<{
    userId: string
    userName: string
    userEmail: string
    userImage: string
    message: string
    appliedAt: string
  }>
}

interface OpenCallsTabProps {
  userType: 'artist' | 'studio'
  userId: string
  studioId?: string
}

export default function OpenCallsTab({ userType, userId, studioId }: OpenCallsTabProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [openCalls, setOpenCalls] = useState<OpenCall[]>([])
  const [filteredCalls, setFilteredCalls] = useState<OpenCall[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')
  const [selectedCall, setSelectedCall] = useState<OpenCall | null>(null)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  
  // Create Open Call form state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    role: '',
    description: '',
    genre: '',
    location: '',
    budget: '',
    deadline: ''
  })

  useEffect(() => {
    fetchOpenCalls()
  }, [])

  useEffect(() => {
    filterCalls()
  }, [openCalls, searchTerm, roleFilter, genreFilter])

  const fetchOpenCalls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/open-calls`)
      const data = await response.json()
      if (response.ok) {
        setOpenCalls(data.openCalls || [])
      } else {
        console.error('Failed to fetch open calls:', data.error)
      }
    } catch (error) {
      console.error('Error fetching open calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCalls = () => {
    let filtered = [...openCalls]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.postedByName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(call =>
        call.role.toLowerCase().includes(roleFilter.toLowerCase())
      )
    }

    // Genre filter
    if (genreFilter !== 'all') {
      filtered = filtered.filter(call =>
        call.genre?.toLowerCase() === genreFilter.toLowerCase()
      )
    }

    setFilteredCalls(filtered)
  }

  const handleCreateOpenCall = async () => {
    if (!createForm.role || !createForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the role and description fields.",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      // Automatically determine postedById and postedByType from auth context
      const actualPostedById = userType === 'studio' ? studioId : userId
      const actualPostedByType = userType === 'studio' ? 'studio' : 'user'

      if (!actualPostedById) {
        toast({
          title: "Authentication Error",
          description: "Unable to identify user. Please try logging in again.",
          variant: "destructive"
        })
        setIsCreating(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/open-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postedById: actualPostedById,
          postedByType: actualPostedByType,
          role: createForm.role,
          description: createForm.description,
          genre: createForm.genre || undefined,
          location: createForm.location || undefined,
          budget: createForm.budget || undefined,
          deadline: createForm.deadline || undefined,
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Open Call Posted!",
          description: "Your open call has been published successfully.",
        })
        setShowCreateDialog(false)
        setCreateForm({
          role: '',
          description: '',
          genre: '',
          location: '',
          budget: '',
          deadline: ''
        })
        fetchOpenCalls() // Refresh the list
      } else {
        toast({
          title: "Failed to Post",
          description: data.error || "Failed to post open call. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error posting open call:', error)
      toast({
        title: "Error",
        description: "Failed to post open call. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleApply = async (callId: string) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply to open calls.",
        variant: "destructive"
      })
      return
    }

    setIsApplying(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/open-calls/${callId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          message: applicationMessage
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "Your application has been sent successfully.",
        })
        setSelectedCall(null)
        setApplicationMessage('')
        fetchOpenCalls() // Refresh to show updated applicant count
      } else {
        toast({
          title: "Application Failed",
          description: data.error || "Failed to submit application. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error applying to open call:', error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApplying(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const getTimeAgo = (dateString: string) => {
    try {
      const now = new Date()
      const posted = new Date(dateString)
      const diffMs = now.getTime() - posted.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffDays > 0) return `${diffDays}d ago`
      if (diffHours > 0) return `${diffHours}h ago`
      return 'Just now'
    } catch {
      return 'Recently'
    }
  }

  const getUniqueGenres = () => {
    const genres = openCalls.map(call => call.genre).filter(Boolean)
    return [...new Set(genres)] as string[]
  }

  const getUniqueRoles = () => {
    const roles = openCalls.map(call => call.role.toLowerCase()).filter(Boolean)
    return [...new Set(roles)]
  }

  // Generate profile link based on poster type
  const getProfileLink = (call: OpenCall) => {
    if (call.postedByType === 'studio') {
      return `/studio/${call.postedById}`
    } else {
      return `/artist/${call.postedById}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button (only for studios) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Open Calls</h2>
          <p className="text-muted-foreground">
            {userType === 'studio' 
              ? 'Post and manage your open calls for collaborations'
              : 'Discover and apply to exciting collaboration opportunities'
            }
          </p>
        </div>
        
        {userType === 'studio' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Post Open Call
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Open Call</DialogTitle>
                <DialogDescription>
                  Post a new collaboration opportunity for artists
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role">Role/Position *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Vocalist, Guitarist, Producer"
                    value={createForm.role}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you're looking for..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    placeholder="e.g., Hip-Hop, Rock, Pop"
                    value={createForm.genre}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, genre: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Los Angeles, CA"
                    value={createForm.location}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    placeholder="e.g., $500-1000, Negotiable"
                    value={createForm.budget}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, budget: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOpenCall} disabled={isCreating}>
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post Open Call
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search open calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {getUniqueRoles().map(role => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {getUniqueGenres().map(genre => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing {filteredCalls.length} of {openCalls.length} open calls
        </p>
      </div>

      {/* Open Calls List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="text-center py-8">
            <CardContent>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Megaphone className="h-8 w-8 text-muted-foreground animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Loading open calls...</h3>
                  <p className="text-muted-foreground">Please wait while we fetch the latest opportunities.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredCalls.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Megaphone className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No open calls found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || roleFilter !== 'all' || genreFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : userType === 'studio' 
                        ? 'Be the first to post an open call!'
                        : 'Check back later for new opportunities.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) :
          filteredCalls.map((call) => (
            <Card key={call.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={call.postedByImage} alt={call.postedByName} />
                      <AvatarFallback>
                        {call.postedByType === 'studio' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{call.postedByName}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {call.postedByType === 'studio' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        <span className="capitalize">{call.postedByType}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(call.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {call.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{call.role}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {call.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {call.genre && (
                    <Badge variant="secondary" className="text-xs">
                      {call.genre}
                    </Badge>
                  )}
                  {call.location && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {call.location}
                    </Badge>
                  )}
                  {call.budget && (
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {call.budget}
                    </Badge>
                  )}
                  {call.deadline && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {formatDate(call.deadline)}
                    </Badge>
                  )}
                </div>

                {call.applicants && call.applicants.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{call.applicants.length} applicant{call.applicants.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {userType === 'artist' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedCall(call)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Apply
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Apply to Open Call</DialogTitle>
                        </DialogHeader>
                        {selectedCall && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="font-medium">{selectedCall.role}</h4>
                              <p className="text-sm text-muted-foreground">
                                Posted by {selectedCall.postedByName}
                              </p>
                            </div>
                            <div>
                              <label htmlFor="application-message" className="text-sm font-medium">
                                Application Message (Optional)
                              </label>
                              <Textarea
                                id="application-message"
                                placeholder="Tell them why you're perfect for this opportunity..."
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                rows={4}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedCall(null)
                                  setApplicationMessage('')
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => handleApply(selectedCall.id)}
                                disabled={isApplying}
                                className="flex-1"
                              >
                                {isApplying ? 'Applying...' : 'Submit Application'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={getProfileLink(call)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  )
} 