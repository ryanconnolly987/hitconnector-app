"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth'
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Heart,
  Mail,
  User,
  Building2,
  Clock,
  Send
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

export default function OpenCallsPage() {
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

  useEffect(() => {
    fetchOpenCalls()
  }, [])

  useEffect(() => {
    filterCalls()
  }, [openCalls, searchTerm, roleFilter, genreFilter])

  const fetchOpenCalls = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/open-calls')
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

  const handleApply = async (callId: string) => {
    if (!user || !user.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply to open calls.",
        variant: "destructive"
      })
      return
    }

    setIsApplying(true)
    try {
      const response = await fetch(`http://localhost:3002/api/open-calls/${callId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          message: applicationMessage
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "Your application has been sent to the poster.",
        })
        setApplicationMessage('')
        setSelectedCall(null)
        fetchOpenCalls() // Refresh to show updated applicant count
      } else {
        toast({
          title: "Application Failed",
          description: data.error || "Failed to submit application.",
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(dateString)
  }

  const getUniqueGenres = () => {
    const genres = openCalls
      .map(call => call.genre)
      .filter((genre): genre is string => genre !== undefined && genre.trim() !== '')
    return [...new Set(genres)]
  }

  const getUniqueRoles = () => {
    const roles = openCalls.map(call => {
      const role = call.role.toLowerCase()
      if (role.includes('producer')) return 'producer'
      if (role.includes('engineer') || role.includes('mixing') || role.includes('mastering')) return 'engineer'
      if (role.includes('vocalist') || role.includes('singer')) return 'vocalist'
      if (role.includes('musician') || role.includes('guitar') || role.includes('bass') || role.includes('drums')) return 'musician'
      if (role.includes('feature') || role.includes('collaboration')) return 'collaboration'
      return 'other'
    })
    return [...new Set(roles)]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Open Call Bulletin</h1>
          <p className="text-muted-foreground">
            Discover collaboration opportunities and connect with fellow creators
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
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
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCalls.length} of {openCalls.length} open calls
          </p>
        </div>

        {/* Open Calls List */}
        <div className="space-y-6">
          {filteredCalls.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No open calls found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || roleFilter !== 'all' || genreFilter !== 'all'
                        ? 'Try adjusting your filters to see more results.'
                        : 'Be the first to post an open call!'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCalls.map((call) => (
              <Card key={call.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={call.postedByImage} alt={call.postedByName} />
                        <AvatarFallback>
                          {call.postedByType === 'studio' ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-foreground hover:underline cursor-pointer">
                            {call.postedByName}
                          </h3>
                          <Badge variant={call.postedByType === 'studio' ? 'default' : 'secondary'}>
                            {call.postedByType === 'studio' ? 'Studio' : 'Artist'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeAgo(call.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {call.genre && (
                        <Badge variant="outline">{call.genre}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      {call.role}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {call.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {call.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {call.location}
                      </div>
                    )}
                    {call.budget && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {call.budget}
                      </div>
                    )}
                    {call.deadline && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Deadline: {formatDate(call.deadline)}
                      </div>
                    )}
                    {call.applicants.length > 0 && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {call.applicants.length} applicant{call.applicants.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      {call.contactEmail && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${call.contactEmail}`}>
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </a>
                        </Button>
                      )}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedCall(call)}
                          disabled={!user || !user.id || call.postedById === user.id}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          I'm Interested
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply to "{call.role}"</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={call.postedByImage} alt={call.postedByName} />
                              <AvatarFallback>
                                {call.postedByType === 'studio' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{call.postedByName}</p>
                              <p className="text-sm text-muted-foreground">{call.role}</p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Application Message (Optional)
                            </label>
                            <Textarea
                              placeholder="Tell them why you're interested and what you can bring to the project..."
                              value={applicationMessage}
                              onChange={(e) => setApplicationMessage(e.target.value)}
                              rows={4}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedCall(null)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => selectedCall && handleApply(selectedCall.id)}
                              disabled={isApplying}
                            >
                              {isApplying ? (
                                <>
                                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Submit Application
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 