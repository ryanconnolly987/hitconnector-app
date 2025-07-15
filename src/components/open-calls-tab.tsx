"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { CalendarDays, Clock, DollarSign, MapPin, Plus, Search, Filter, User, Send, Eye } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '@/lib/config'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface OpenCall {
  id: string
  role: string
  description: string
  genre: string
  createdBy: string
  userType: string
  posterName: string
  posterImage?: string
  timestamp: string
  dateNeeded?: string
  applicants?: Applicant[]
  studio?: {
    slug: string
    profile: {
      name: string
      avatar: string
    }
  }
}

interface Applicant {
  userId: string
  userName: string
  userEmail: string
  userImage: string
  userRole: string
  message: string
  appliedAt: string
}

interface OpenCallWithApplications {
  id: string
  role: string
  genre: string
  description: string
  userType: string
  posterName: string
  timestamp: string
  applicants: Applicant[]
  applicantCount: number
}

interface OpenCallsTabProps {
  userType: string
  userId: string
  studioId?: string
}

export default function OpenCallsTab({ userType, userId, studioId }: OpenCallsTabProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [openCalls, setOpenCalls] = useState<OpenCall[]>([])
  const [filteredCalls, setFilteredCalls] = useState<OpenCall[]>([])
  const [openCallsWithApplications, setOpenCallsWithApplications] = useState<OpenCallWithApplications[]>([])
  const [loading, setLoading] = useState(true)
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')
  const [selectedCall, setSelectedCall] = useState<OpenCall | null>(null)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [activeTab, setActiveTab] = useState('browse')
  
  // Create Open Call form state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    role: '',
    description: '',
    genre: '',
    location: '',
    budget: '',
    deadline: '',
    dateNeeded: ''
  })

  useEffect(() => {
    fetchOpenCalls()
  }, [])

  useEffect(() => {
    filterCalls()
  }, [openCalls, searchTerm, roleFilter, genreFilter])

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications()
    }
  }, [activeTab, userId])

  const fetchOpenCalls = async () => {
    try {
      console.log("Fetching from:", `${API_BASE_URL}/api/open-calls`)
      const response = await fetch(`${API_BASE_URL}/api/open-calls`)
      
      if (response.ok) {
        const data = await response.json()
        // API returns array directly, not wrapped in openCalls property
        setOpenCalls(Array.isArray(data) ? data : [])
      } else {
        // Handle case where endpoint doesn't exist (404) or other errors
        console.log('Open calls endpoint not available, using empty data')
        setOpenCalls([])
      }
    } catch (error) {
      // Handle network errors or missing endpoint gracefully
      console.log('Open calls feature not available yet')
      setOpenCalls([])
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    setApplicationsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/open-calls/applications?userId=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        setOpenCallsWithApplications(data.openCallsWithApplications || [])
      } else {
        console.log('Applications endpoint not available')
        setOpenCallsWithApplications([])
      }
    } catch (error) {
      console.log('Applications feature not available yet')
      setOpenCallsWithApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  const filterCalls = () => {
    const filtered = openCalls.filter(call => {
      const matchesSearch = call.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.posterName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || call.role.toLowerCase() === roleFilter.toLowerCase()
      const matchesGenre = genreFilter === 'all' || call.genre.toLowerCase() === genreFilter.toLowerCase()
      
      return matchesSearch && matchesRole && matchesGenre
    })
    
    setFilteredCalls(filtered)
  }

  const handleCreateOpenCall = async () => {
    if (!createForm.role || !createForm.description || !createForm.genre || !createForm.dateNeeded) {
      toast({
        title: "Missing Information",
        description: "Please fill in role, description, genre, and date needed fields.",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/open-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy: userType === 'studio' ? (studioId || userId) : userId,
          role: createForm.role,
          genre: createForm.genre,
          description: createForm.description,
          userType,
          dateNeeded: createForm.dateNeeded
        })
      })

      if (response.ok) {
        const newCall = await response.json()
        setOpenCalls([newCall, ...openCalls])
        setShowCreateDialog(false)
        setCreateForm({ role: '', description: '', genre: '', location: '', budget: '', deadline: '', dateNeeded: '' })
        toast({
          title: "Open Call Posted",
          description: "Your open call has been posted successfully."
        })
      } else {
        throw new Error('Failed to create open call')
      }
    } catch (error) {
      console.error('Error creating open call:', error)
      toast({
        title: "Error",
        description: "Failed to post open call. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleApplyToCall = async () => {
    if (!selectedCall || !user?.id) return

    setIsApplying(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/open-calls/${selectedCall.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          message: applicationMessage
        })
      })

      if (response.ok) {
        toast({
          title: "Application Sent",
          description: "Your application has been submitted successfully."
        })
        setSelectedCall(null)
        setApplicationMessage('')
      } else {
        const error = await response.json()
        toast({
          title: "Application Failed",
          description: error.error || "Failed to submit application.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error applying to call:', error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Open Calls</TabsTrigger>
          <TabsTrigger value="applications">Applications ({openCallsWithApplications.reduce((sum, call) => sum + call.applicantCount, 0)})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Header with Search, Filters, and Post Open Call CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search open calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="rapper">Rapper</SelectItem>
                  <SelectItem value="producer">Producer</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="vocalist">Vocalist</SelectItem>
                  <SelectItem value="songwriter">Songwriter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="r&b">R&B</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="reggae">Reggae</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Post Open Call CTA - only show for studio users */}
            {user?.role === 'studio' && (
              <div className="flex justify-end items-center gap-2">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <Plus className="mr-2 h-4 w-4" />
                      Post Open Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Post Open Call</DialogTitle>
                      <DialogDescription>
                        Create a new open call to find talented artists for your projects.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role">Role/Position</Label>
                        <Input
                          id="role"
                          placeholder="e.g., Rapper, Vocalist, Producer"
                          value={createForm.role}
                          onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="genre">Genre</Label>
                        <Select value={createForm.genre} onValueChange={(value) => setCreateForm({...createForm, genre: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                            <SelectItem value="r&b">R&B</SelectItem>
                            <SelectItem value="pop">Pop</SelectItem>
                            <SelectItem value="rock">Rock</SelectItem>
                            <SelectItem value="jazz">Jazz</SelectItem>
                            <SelectItem value="electronic">Electronic</SelectItem>
                            <SelectItem value="country">Country</SelectItem>
                            <SelectItem value="reggae">Reggae</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what you're looking for..."
                          value={createForm.description}
                          onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateNeeded">Date Needed By</Label>
                        <Input
                          id="dateNeeded"
                          type="date"
                          value={createForm.dateNeeded}
                          onChange={(e) => setCreateForm({...createForm, dateNeeded: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateOpenCall} disabled={isCreating}>
                        {isCreating ? 'Posting...' : 'Post Open Call'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Open Calls Grid */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCalls.length > 0 ? (
              filteredCalls.map((call) => (
                <Card key={call.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {call.studio ? (
                          <Link href={`/studio/${call.studio.slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={call.studio.profile.avatar || ""} alt={call.studio.profile.name || "Studio"} />
                              <AvatarFallback>
                                {call.studio.profile.name?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{call.role}</CardTitle>
                              <p className="text-sm text-muted-foreground">by {call.studio.profile.name}</p>
                            </div>
                          </Link>
                        ) : (
                          <>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={call.posterImage || ""} alt={call.posterName || "User"} />
                              <AvatarFallback>
                                {call.posterName?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{call.role}</CardTitle>
                              <p className="text-sm text-muted-foreground">by {call.posterName || "Unknown User"}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <Badge variant="secondary">{call.genre}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm line-clamp-3">{call.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(call.timestamp).toLocaleDateString()}</span>
                      </div>
                      {call.dateNeeded && (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3 w-3" />
                          <span>Needed by {new Date(call.dateNeeded).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {call.createdBy !== user?.id && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedCall(call)}
                      >
                        Apply Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium">No open calls found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Applications to My Open Calls</h3>
            <Badge variant="outline">
              {openCallsWithApplications.reduce((sum, call) => sum + call.applicantCount, 0)} total applications
            </Badge>
          </div>

          {applicationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : openCallsWithApplications.length > 0 ? (
            <div className="space-y-6">
              {openCallsWithApplications.map((call) => (
                <Card key={call.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{call.role}</CardTitle>
                        <CardDescription>{call.genre} • {call.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {call.applicantCount} {call.applicantCount === 1 ? 'applicant' : 'applicants'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Applications:</div>
                      <div className="space-y-3">
                        {call.applicants.map((applicant, index) => (
                          <div key={`${applicant.userId}-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={applicant.userImage || ""} alt={applicant.userName || "User"} />
                              <AvatarFallback>
                                {applicant.userName?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{applicant.userName || "Unknown User"}</p>
                                <Badge variant="outline" className="text-xs">
                                  {applicant.userRole || "artist"}
                                </Badge>
                              </div>
                              {applicant.message && (
                                <p className="text-sm text-muted-foreground mt-1">{applicant.message}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Applied on {new Date(applicant.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No applications yet</h3>
              <p className="text-muted-foreground">Applications to your open calls will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Application Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply to Open Call</DialogTitle>
            <DialogDescription>
              Send your application for this {selectedCall?.role} position.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <p className="text-sm font-medium">{selectedCall?.role}</p>
            </div>
            <div className="space-y-2">
              <Label>Genre</Label>
              <p className="text-sm">{selectedCall?.genre}</p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground">{selectedCall?.description}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="application-message">Your Message (Optional)</Label>
              <Textarea
                id="application-message"
                placeholder="Tell them why you're perfect for this role..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCall(null)}>
              Cancel
            </Button>
            <Button onClick={handleApplyToCall} disabled={isApplying}>
              {isApplying ? 'Applying...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 