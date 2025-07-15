"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Upload, Plus, X, Star, MapPin, Phone, Mail, Globe, Clock, DollarSign, Pencil, Trash2, Music, Calendar, CheckCircle, AlertCircle, Loader2, Users, Wifi, Car, Coffee, Mic, Headphones, Monitor } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"

// Debug logging to verify the API URL being used
console.log('🔍 [Config] API_BASE_URL loaded:', API_BASE_URL)
console.log('🔍 [Config] Environment variable NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL)

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MusicPlayerInput, MusicPlayer } from "@/components/ui/music-player"

// Types for staff members
interface StaffMember {
  id: string
  name: string
  role: string
  bio: string
  image: string
}

// Types for room
interface Room {
  id: string
  name: string
  description: string
  hourlyRate: number
  capacity: number
  equipment: string[]
  images: string[]
}

// Utility function to clean up old localStorage data
const cleanupOldStorageData = () => {
  try {
    // Remove old large data that could cause quota issues
    const keysToRemove = [
      'studioProfile',
      'studioProfileData',
      'studioRoomsData', 
      'studioStaffData'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Clean up any orphaned studio data (without user prefix)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && (key.includes('studio') || key.includes('Studio')) && !key.includes('_')) {
        localStorage.removeItem(key)
      }
    }
  } catch (error) {
    console.warn('Error cleaning up old storage data:', error)
  }
}

function StudioProfileContent() {
  const { toast } = useToast()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  
  // Get tab from URL params, default to "basic"
  const urlTab = searchParams.get('tab')
  
  // Map URL tab names to actual tab values
  const getTabValue = (urlTab: string | null) => {
    switch (urlTab) {
      case 'photos': return 'media'
      case 'availability': return 'availability'
      case 'staff': return 'staff'
      default: return 'basic'
    }
  }
  
  const [activeTab, setActiveTab] = useState(getTabValue(urlTab))

  // Default studio data - now starts blank for new studios
  const defaultStudioData = {
    name: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    profileImage: "",
    coverImage: "",
    description: "",
    hourlyRate: 0,
    amenities: [] as string[],
    genres: [] as string[],
    galleryImages: [] as string[],
    isAvailable: false,
    operatingHours: {
      monday: { open: "", close: "", closed: true },
      tuesday: { open: "", close: "", closed: true },
      wednesday: { open: "", close: "", closed: true },
      thursday: { open: "", close: "", closed: true },
      friday: { open: "", close: "", closed: true },
      saturday: { open: "", close: "", closed: true },
      sunday: { open: "", close: "", closed: true },
    },
    trackUrl: "",
    equipment: [] as string[],
    rooms: [] as Room[],
    staff: [] as StaffMember[]
  }

  const [studioData, setStudioData] = useState({
    name: "",
    location: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    profileImage: "",
    coverImage: "",
    description: "",
    hourlyRate: 0,
    amenities: [] as string[],
    genres: [] as string[],
    galleryImages: [] as string[],
    isAvailable: false,
    operatingHours: {
      monday: { open: "", close: "", closed: true },
      tuesday: { open: "", close: "", closed: true },
      wednesday: { open: "", close: "", closed: true },
      thursday: { open: "", close: "", closed: true },
      friday: { open: "", close: "", closed: true },
      saturday: { open: "", close: "", closed: true },
      sunday: { open: "", close: "", closed: true },
    },
    trackUrl: "",
    equipment: [] as string[],
    rooms: [] as Room[],
    staff: [] as StaffMember[]
  })

  // Default rooms data - now starts empty for new studios
  const defaultRooms: Room[] = []

  const [rooms, setRooms] = useState<Room[]>(defaultRooms)

  // Default staff data - now starts empty for new studios
  const defaultStaff: StaffMember[] = []

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(defaultStaff)

  // Dialog states
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [isEditingRoom, setIsEditingRoom] = useState(false)
  const [isEditingStaff, setIsEditingStaff] = useState(false)

  // Current editing states
  const [currentRoom, setCurrentRoom] = useState<Room>({
    id: "",
    name: "",
    description: "",
    hourlyRate: 0,
    capacity: 0,
    equipment: [],
    images: []
  })

  const [currentStaff, setCurrentStaff] = useState<StaffMember>({
    id: "",
    name: "",
    role: "",
    bio: "",
    image: "",
  })

  // Load saved data on component mount
  useEffect(() => {
    if (!user) return // Don't load data if no user is logged in
    
    // Clean up old localStorage data first
    cleanupOldStorageData()
    
    const loadStudioData = async () => {
      try {
        console.time('loadProfileData'); // start performance timing
        // Debug the exact URL being constructed
        const fullUrl = `${API_BASE_URL}/api/studios`
        console.log('🔍 [Load] Full URL being constructed:', fullUrl)
        console.log('🔍 [Load] API_BASE_URL value:', API_BASE_URL)
        console.log('🔍 [Load] typeof API_BASE_URL:', typeof API_BASE_URL)
        
        // First try to load from API (primary source) - using backend API URL
        const response = await fetch(fullUrl, {
          // Add timeout and caching headers for better performance
          signal: AbortSignal.timeout(10000), // 10 second timeout
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const userStudios = data.studios?.filter((studio: any) => studio.owner === (user.email || user.id))
          
          if (userStudios && userStudios.length > 0) {
            const studio = userStudios[0] // Get the first studio for this user
            
            // Set the studio ID for future updates
            setStudioId(studio.id)
            
            // Map API data back to form structure
            setStudioData({
              name: studio.name || "",
              location: studio.location || "",
              address: studio.address || "",
              phone: studio.phone || "",
              email: studio.email || "",
              website: studio.website || "",
              profileImage: studio.profileImage || "",
              coverImage: studio.coverImage || "",
              description: studio.description || "",
              hourlyRate: studio.hourlyRate || 0,
              amenities: studio.amenities || [],
              genres: studio.specialties || [],
              galleryImages: studio.gallery || [],
              isAvailable: studio.isAvailable !== undefined ? studio.isAvailable : true,
              operatingHours: studio.operatingHours || {
                monday: { open: "", close: "", closed: false },
                tuesday: { open: "", close: "", closed: false },
                wednesday: { open: "", close: "", closed: false },
                thursday: { open: "", close: "", closed: false },
                friday: { open: "", close: "", closed: false },
                saturday: { open: "", close: "", closed: false },
                sunday: { open: "", close: "", closed: false }
              },
              trackUrl: studio.trackUrl || "",
              equipment: studio.equipment || [],
              rooms: studio.rooms || [],
              staff: studio.staff || []
            })
            
            if (studio.rooms) {
              setRooms(studio.rooms)
            }
            
            if (studio.staff) {
              setStaffMembers(studio.staff)
            }
            
            console.log('✅ Studio data loaded from API:', studio.name)
            console.timeEnd('loadProfileData'); // end performance timing
            return // Successfully loaded from API
          }
        }
      } catch (apiError) {
        console.warn('Failed to load from API, trying localStorage:', apiError)
      }
      
      // Fallback to localStorage if API fails or no data found
      // For localStorage fallback, we don't have a studio ID yet (will be created on save)
      setStudioId(null)
      
      try {
        const userKey = user.email || user.id
        const savedStudioData = localStorage.getItem(`studioProfileData_${userKey}`)
        const savedRoomsData = localStorage.getItem(`studioRoomsData_${userKey}`)
        const savedStaffData = localStorage.getItem(`studioStaffData_${userKey}`)
        
        if (savedStudioData) {
          const parsedStudioData = JSON.parse(savedStudioData)
          // Merge with defaults to ensure all properties exist
          setStudioData({ ...defaultStudioData, ...parsedStudioData })
          console.log('Studio data loaded from localStorage')
        } else {
          // If no saved data for this user, reset to defaults (blank)
          setStudioData(defaultStudioData)
        }
        
        if (savedRoomsData) {
          const parsedRoomsData = JSON.parse(savedRoomsData)
          setRooms(parsedRoomsData)
          // Also update studioData.rooms
          setStudioData(prev => ({
            ...prev,
            rooms: parsedRoomsData
          }))
        } else {
          // If no saved data for this user, reset to defaults (empty)
          setRooms(defaultRooms)
          setStudioData(prev => ({
            ...prev,
            rooms: defaultRooms
          }))
        }
        
        if (savedStaffData) {
          const parsedStaffData = JSON.parse(savedStaffData)
          // Since minimal data doesn't include images, we need to handle that
          const staffWithDefaults = parsedStaffData.map((member: any) => ({
            ...member,
            image: member.image || ""
          }))
          setStaffMembers(staffWithDefaults)
          // Also update studioData.staff
          setStudioData(prev => ({
            ...prev,
            staff: staffWithDefaults
          }))
        } else {
          // If no saved data for this user, reset to defaults (empty)
          setStaffMembers(defaultStaff)
          setStudioData(prev => ({
            ...prev,
            staff: defaultStaff
          }))
        }
        console.timeEnd('loadProfileData'); // end performance timing
      } catch (error) {
        console.error('Error loading saved data:', error)
        console.timeEnd('loadProfileData'); // end performance timing
        toast({
          title: "Error",
          description: "Failed to load saved data",
          variant: "destructive",
        })
      }
    }
    
    loadStudioData()
  }, [user]) // added proper dependency array to prevent rerender loop

  const [newAmenity, setNewAmenity] = useState("")
  const [newGenre, setNewGenre] = useState("")
  const [newEquipment, setNewEquipment] = useState("")

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover' | 'gallery') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      console.log(`📸 [Upload] Starting ${type} image upload:`, {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      })
      
      // Check file size (limit to 5MB to prevent quota issues)
      if (file.size > 5 * 1024 * 1024) {
        console.warn(`⚠️ [Upload] File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive"
        })
        return
      }
      
      // Convert to base64 data URL with compression
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        
        // Create image element for compression
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Calculate new dimensions (max 1200px width)
          const maxWidth = 1200
          const maxHeight = 1200
          let { width, height } = img
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height)
          const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.8) // 80% quality
          
          console.log(`✅ [Upload] Image processed:`, {
            type,
            originalSize: `${(file.size / 1024).toFixed(1)}KB`,
            compressedSize: `${(compressedImageUrl.length * 0.75 / 1024).toFixed(1)}KB`, // Rough estimate
            dimensions: `${width}x${height}`
          })
          
          if (type === 'profile') {
            setStudioData(prev => ({ ...prev, profileImage: compressedImageUrl }))
            console.log('📸 [Upload] Profile image updated in state')
          } else if (type === 'cover') {
            setStudioData(prev => ({ ...prev, coverImage: compressedImageUrl }))
            console.log('📸 [Upload] Cover image updated in state')
          } else if (type === 'gallery') {
            setStudioData(prev => ({ 
              ...prev, 
              galleryImages: [...prev.galleryImages, compressedImageUrl] 
            }))
            console.log('📸 [Upload] Gallery image added to state')
          }
          
          toast({
            title: "Image uploaded",
            description: "Image has been uploaded and optimized successfully. Remember to save your changes!",
            variant: "default"
          })
        }
        img.src = imageUrl
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStaffImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Check file size (limit to 5MB to prevent quota issues)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive"
        })
        return
      }
      
      // Convert to base64 data URL with compression
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        
        // Create image element for compression
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Calculate new dimensions (max 800px for staff photos)
          const maxWidth = 800
          const maxHeight = 800
          let { width, height } = img
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height)
          const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.8) // 80% quality
          
          setCurrentStaff(prev => ({ ...prev, image: compressedImageUrl }))
          
          toast({
            title: "Image uploaded",
            description: "Staff image has been uploaded and optimized successfully.",
            variant: "default"
          })
        }
        img.src = imageUrl
      }
      reader.readAsDataURL(file)
    }
  }

  const removeGalleryImage = (index: number) => {
    setStudioData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }))
  }

  // Room management functions
  const handleAddRoom = () => {
    setIsEditingRoom(false)
    setCurrentRoom({
      id: "",
      name: "",
      description: "",
      hourlyRate: 0,
      capacity: 0,
      equipment: [],
      images: []
    })
    setIsRoomDialogOpen(true)
  }

  const handleEditRoom = (room: Room) => {
    setIsEditingRoom(true)
    setCurrentRoom(room)
    setIsRoomDialogOpen(true)
  }

  const handleRoomSubmit = () => {
    if (currentRoom.name && currentRoom.hourlyRate) {
      const newRoom = {
        ...currentRoom,
        id: currentRoom.id || `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      }
      
      if (isEditingRoom && currentRoom.id && rooms.find(r => r.id === currentRoom.id)) {
        // Update existing room
        setRooms(prev => prev.map(room =>
          room.id === currentRoom.id ? newRoom : room
        ))
        // Also update studioData.rooms
        setStudioData(prev => ({
          ...prev,
          rooms: prev.rooms.map(room =>
            room.id === currentRoom.id ? newRoom : room
          )
        }))
      } else {
        // Add new room
        setRooms(prev => [...prev, newRoom])
        // Also update studioData.rooms
        setStudioData(prev => ({
          ...prev,
          rooms: [...prev.rooms, newRoom]
        }))
      }
      
      setIsEditingRoom(false)
      setIsRoomDialogOpen(false)
      
      toast({
        title: "Success",
        description: isEditingRoom ? "Room updated successfully" : "Room added successfully",
        variant: "default"
      })
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in the room name and hourly rate.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId))
    // Also update studioData.rooms
    setStudioData(prev => ({
      ...prev,
      rooms: prev.rooms.filter(room => room.id !== roomId)
    }))
    
    toast({
      title: "Room deleted",
      description: "Room has been removed successfully",
      variant: "default"
    })
  }

  const addEquipmentToRoom = () => {
    if (newEquipment.trim() && !currentRoom.equipment.includes(newEquipment.trim())) {
      setCurrentRoom(prev => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()]
      }))
      setNewEquipment("")
    }
  }

  const removeEquipmentFromRoom = (equipment: string) => {
    setCurrentRoom(prev => ({
      ...prev,
      equipment: prev.equipment.filter(e => e !== equipment)
    }))
  }

  // Staff management functions
  const handleAddStaff = () => {
    setIsEditingStaff(false)
    setCurrentStaff({
      id: "",
      name: "",
      role: "",
      bio: "",
      image: "",
    })
    setIsStaffDialogOpen(true)
  }

  const handleEditStaff = (staff: StaffMember) => {
    setIsEditingStaff(true)
    setCurrentStaff(staff)
    setIsStaffDialogOpen(true)
  }

  const handleStaffSubmit = () => {
    if (currentStaff.name && currentStaff.role) {
      const newStaff = {
        ...currentStaff,
        id: currentStaff.id || `staff-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      }
      
      if (isEditingStaff && currentStaff.id && staffMembers.find(s => s.id === currentStaff.id)) {
        // Update existing staff
        setStaffMembers(prev => prev.map(staff =>
          staff.id === currentStaff.id ? newStaff : staff
        ))
        // Also update studioData.staff
        setStudioData(prev => ({
          ...prev,
          staff: prev.staff.map(staff =>
            staff.id === currentStaff.id ? newStaff : staff
          )
        }))
      } else {
        // Add new staff
        setStaffMembers(prev => [...prev, newStaff])
        // Also update studioData.staff
        setStudioData(prev => ({
          ...prev,
          staff: [...prev.staff, newStaff]
        }))
      }
      
      setIsEditingStaff(false)
      setIsStaffDialogOpen(false)
      
      toast({
        title: "Success",
        description: isEditingStaff ? "Staff member updated successfully" : "Staff member added successfully",
        variant: "default"
      })
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in the staff member's name and role.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteStaff = (staffId: string) => {
    setStaffMembers(prev => prev.filter(staff => staff.id !== staffId))
    // Also update studioData.staff
    setStudioData(prev => ({
      ...prev,
      staff: prev.staff.filter(staff => staff.id !== staffId)
    }))
    
    toast({
      title: "Staff member deleted",
      description: "Staff member has been removed successfully",
      variant: "default"
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Original functions
  const addAmenity = () => {
    if (newAmenity.trim() && !studioData.amenities.includes(newAmenity.trim())) {
      setStudioData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }))
      setNewAmenity("")
    }
  }

  const removeAmenity = (amenity: string) => {
    setStudioData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }))
  }

  const addGenre = () => {
    if (newGenre.trim() && !studioData.genres.includes(newGenre.trim())) {
      setStudioData(prev => ({
        ...prev,
        genres: [...prev.genres, newGenre.trim()]
      }))
      setNewGenre("")
    }
  }

  const removeGenre = (genre: string) => {
    setStudioData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }))
  }

  const updateOperatingHours = (day: string, field: string, value: string | boolean) => {
    setStudioData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [field]: value
        }
      }
    }))
  }

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [studioId, setStudioId] = useState<string | null>(null)

  const handleSave = async () => {
    try {
      setSaveStatus('saving')
      console.time('saveStudioProfile'); // start performance timing
      console.log('💾 [Save] Starting studio profile save process')
      
      // Validate required fields
      if (!studioData.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Studio name is required",
          variant: "destructive",
        })
        setSaveStatus('error')
        return
      }
      
      // Prepare complete studio data for API
      const studioApiData = {
        name: studioData.name,
        location: studioData.location,
        address: studioData.address,
        phone: studioData.phone,
        email: studioData.email,
        website: studioData.website,
        profileImage: studioData.profileImage,
        coverImage: studioData.coverImage,
        description: studioData.description,
        hourlyRate: Number(studioData.hourlyRate),
        amenities: studioData.amenities,
        specialties: studioData.genres,
        images: [studioData.profileImage, studioData.coverImage, ...studioData.galleryImages].filter(Boolean),
        gallery: studioData.galleryImages,
        equipment: studioData.equipment,
        rooms: studioData.rooms.map(room => ({
          id: room.id,
          name: room.name,
          description: room.description,
          hourlyRate: room.hourlyRate,
          capacity: room.capacity,
          images: room.images || [],
          equipment: room.equipment || []
        })),
        operatingHours: studioData.operatingHours,
        isAvailable: studioData.isAvailable,
        trackUrl: studioData.trackUrl,
        staff: studioData.staff.map(member => ({
          id: member.id,
          name: member.name,
          role: member.role,
          bio: member.bio,
          image: member.image
        })),
        owner: user?.email || user?.id
      }
      
      console.log('📤 [Save] Sending studio data to API:', {
        name: studioApiData.name,
        roomsCount: studioApiData.rooms.length,
        staffCount: studioApiData.staff.length,
        galleryCount: studioApiData.gallery.length,
        isUpdate: !!studioId
      })
      
      // Enhanced fetch function with retry logic
      const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2) => {
        let lastError: Error | null = null
        
        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
          // Create a new AbortController for each attempt
          const controller = new AbortController()
          let timeoutId: NodeJS.Timeout | null = null
          
          try {
            console.log(`🔄 [Save] Attempt ${attempt}/${maxRetries + 1} for ${options.method} request`)
            console.log(`[DEBUG] Saving studio to:`, url) // added URL logging for debugging
            
            // Set up timeout that will abort the request if it takes too long
            timeoutId = setTimeout(() => {
              console.warn(`⏰ [Save] Request timed out after 20s, aborting...`)
              controller.abort()
            }, 20000) // 20 second timeout
            
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
              headers: {
                ...options.headers,
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              }
            })
            
            // Request succeeded, return the response
            return response
            
          } catch (error) {
            lastError = error as Error
            console.warn(`⚠️ [Save] Attempt ${attempt} failed:`, error)
            
            // Don't retry on the last attempt
            if (attempt <= maxRetries) {
              const delay = Math.min(1000 * attempt, 3000) // Progressive delay: 1s, 2s, 3s
              console.log(`⏳ [Save] Retrying in ${delay}ms...`)
              await new Promise(resolve => setTimeout(resolve, delay))
            }
          } finally {
            // Always clear the timeout to prevent "signal is aborted without reason" error
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
          }
        }
        
        throw lastError || new Error('All retry attempts failed')
      }
      
      // Determine if this is an update or create
      let response;
      if (studioId) {
        // Update existing studio using PUT
        console.log(`🔄 [Save] Updating existing studio: ${studioId}`)
        response = await fetchWithRetry(`${API_BASE_URL}/api/studios/${studioId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studioApiData)
        })
      } else {
        // Create new studio using POST
        console.log('➕ [Save] Creating new studio')
        const saveUrl = `${API_BASE_URL}/api/studios`
        console.log('🔍 [Save] Full URL being constructed:', saveUrl)
        console.log('🔍 [Save] API_BASE_URL value:', API_BASE_URL)
        console.log('🔍 [Save] typeof API_BASE_URL:', typeof API_BASE_URL)
        
        response = await fetchWithRetry(saveUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studioApiData)
        })
      }
      
      if (response.ok) {
        const savedStudio = await response.json()
        
        // Update studio ID if it was a new studio
        if (!studioId && savedStudio.id) {
          setStudioId(savedStudio.id)
        }
        
        console.log('✅ [Save] Studio saved successfully:', savedStudio.id)
        
        // Only save minimal essential data to localStorage (no images to avoid quota issues)
        try {
          const userKey = user?.email || user?.id
          const minimalStudioData = {
            name: studioData.name,
            location: studioData.location,
            address: studioData.address,
            phone: studioData.phone,
            email: studioData.email,
            website: studioData.website,
            description: studioData.description,
            hourlyRate: studioData.hourlyRate,
            amenities: studioData.amenities,
            genres: studioData.genres,
            operatingHours: studioData.operatingHours
          }
          
          const minimalRoomsData = studioData.rooms.map(room => ({
            id: room.id,
            name: room.name,
            description: room.description,
            hourlyRate: room.hourlyRate,
            capacity: room.capacity,
            equipment: room.equipment
          }))
          
          const minimalStaffData = studioData.staff.map(member => ({
            id: member.id,
            name: member.name,
            role: member.role,
            bio: member.bio
          }))
          
          localStorage.setItem(`studioProfileData_${userKey}`, JSON.stringify(minimalStudioData))
          localStorage.setItem(`studioRoomsData_${userKey}`, JSON.stringify(minimalRoomsData))
          localStorage.setItem(`studioStaffData_${userKey}`, JSON.stringify(minimalStaffData))
          
          // Clean up any old full data
          localStorage.removeItem('studioProfile')
          console.log('💾 [Save] Minimal data saved to localStorage as backup')
        } catch (storageError) {
          console.warn('⚠️ [Save] LocalStorage quota exceeded, skipping local backup:', storageError)
          // Continue without localStorage backup since API save was successful
        }
        
        setSaveStatus('saved')
        toast({
          title: "Profile Saved Successfully! 🎉",
          description: `Your studio profile has been updated.`,
          variant: "default",
        })
        
        console.log('🎯 [Save] Save process completed successfully')
      } else {
        let errorMessage = `Failed to save studio profile to server (${response.status})`
        try {
        const errorData = await response.text()
          if (errorData) {
            errorMessage += `: ${errorData.substring(0, 100)}`
          }
        } catch (parseError) {
          console.warn('⚠️ [Save] Could not parse error response')
        }
        
        console.error('❌ [Save] Failed to save studio to API:', response.status, response.statusText)
        setSaveStatus('error')
        toast({
          title: "Save Failed",
          description: `${errorMessage}. Please try again.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💥 [Save] Error saving studio:', error)
      setSaveStatus('error')
      
      // Provide more specific error messages based on error type
      let errorDescription = "An unexpected error occurred while saving."
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorDescription = "Network connection failed. Please check your internet connection and try again."
      } else if (error instanceof Error && error.name === 'AbortError') {
        errorDescription = "The request timed out. Please try again."
      } else if (error instanceof Error && error.message.includes('Failed to fetch')) {
        errorDescription = "Unable to connect to the server. Please check if the backend is running and try again."
      }
      
      toast({
        title: "Save Error",
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      console.timeEnd('saveStudioProfile'); // end performance timing
      setSaveStatus('idle') // Reset to default state
    }
  }

  const testImagePersistence = async () => {
    console.log('🧪 [Test] Testing image persistence...')
    try {
      const response = await fetch(`${API_BASE_URL}/api/studios`)
      if (response.ok) {
        const data = await response.json()
        const userStudios = data.studios?.filter((studio: any) => 
          studio.owner === user?.email || studio.owner === user?.id
        )
        
        if (userStudios && userStudios.length > 0) {
          const studio = userStudios[0]
          console.log('🔍 [Test] Current studio data in API:', {
            name: studio.name,
            profileImage: studio.profileImage ? `${studio.profileImage.substring(0, 50)}...` : 'Not set',
            coverImage: studio.coverImage ? `${studio.coverImage.substring(0, 50)}...` : 'Not set',
            galleryCount: studio.gallery?.length || 0
          })
          
          toast({
            title: "Image Persistence Test",
            description: `Profile: ${studio.profileImage ? '✅ Saved' : '❌ Missing'}, Cover: ${studio.coverImage ? '✅ Saved' : '❌ Missing'}, Gallery: ${studio.gallery?.length || 0} images`,
            variant: "default",
          })
        }
      }
    } catch (error) {
      console.error('❌ [Test] Error testing persistence:', error)
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/studio-dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Studio Profile</h1>
            <p className="text-muted-foreground">Manage your studio information and settings</p>
          </div>
          <div className="ml-auto flex gap-2">
            {/* Test button for debugging */}
            {process.env.NODE_ENV === 'development' && (
              <Button variant="ghost" size="sm" onClick={testImagePersistence}>
                Test Images
              </Button>
            )}
            
            <Button variant="outline" asChild>
              <Link href="/studio-profile">View Public Profile</Link>
            </Button>
            
            {saveStatus === 'saved' && (
              <Button variant="secondary" asChild>
                <Link href="/studio-profile">View Updated Profile</Link>
              </Button>
            )}
            
            <Button 
              onClick={handleSave} 
              disabled={saveStatus === 'saving'}
              className={saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="rooms">Rooms & Equipment</TabsTrigger>
            <TabsTrigger value="staff">Studio Staff</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="media">Photos & Media</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your studio's basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Studio Name</Label>
                  <Input
                    id="name"
                    value={studioData.name}
                    onChange={(e) => setStudioData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={studioData.description}
                    onChange={(e) => setStudioData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your studio, equipment, and services..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={studioData.address}
                      onChange={(e) => setStudioData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={studioData.phone}
                      onChange={(e) => setStudioData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={studioData.email}
                      onChange={(e) => setStudioData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={studioData.website}
                      onChange={(e) => setStudioData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trackUrl" className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Music Sample URL
                  </Label>
                  <MusicPlayerInput
                    value={studioData.trackUrl}
                    onChange={(value) => setStudioData(prev => ({ ...prev, trackUrl: value }))}
                    placeholder="Paste a YouTube, SoundCloud, or MP3 link to showcase your studio's sound..."
                  />
                  {studioData.trackUrl && (
                    <div className="mt-3">
                      <MusicPlayer trackUrl={studioData.trackUrl} />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Amenities</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add amenity..."
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                      />
                      <Button onClick={addAmenity}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {studioData.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                          {amenity}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeAmenity(amenity)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Music Genres</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add genre..."
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addGenre()}
                      />
                      <Button onClick={addGenre}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {studioData.genres.map((genre) => (
                        <Badge key={genre} variant="outline" className="flex items-center gap-1">
                          {genre}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeGenre(genre)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Rooms & Equipment</CardTitle>
                  <CardDescription>Manage your studio rooms and equipment</CardDescription>
                </div>
                <Button onClick={handleAddRoom}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {studioData.rooms.map((room) => (
                  <Card key={room.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditRoom(room)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Room</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {room.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRoom(room.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Room Name</Label>
                          <Input 
                            value={room.name} 
                            onChange={(e) => {
                              const updatedRooms = studioData.rooms.map(r => 
                                r.id === room.id ? { ...r, name: e.target.value } : r
                              )
                              setStudioData(prev => ({ ...prev, rooms: updatedRooms }))
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hourly Rate ($)</Label>
                          <Input 
                            type="number" 
                            value={room.hourlyRate} 
                            onChange={(e) => {
                              const updatedRooms = studioData.rooms.map(r => 
                                r.id === room.id ? { ...r, hourlyRate: parseInt(e.target.value) || 0 } : r
                              )
                              setStudioData(prev => ({ ...prev, rooms: updatedRooms }))
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity</Label>
                          <Input 
                            type="number" 
                            value={room.capacity} 
                            onChange={(e) => {
                              const updatedRooms = studioData.rooms.map(r => 
                                r.id === room.id ? { ...r, capacity: parseInt(e.target.value) || 0 } : r
                              )
                              setStudioData(prev => ({ ...prev, rooms: updatedRooms }))
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          value={room.description} 
                          rows={2} 
                          onChange={(e) => {
                            const updatedRooms = studioData.rooms.map(r => 
                              r.id === room.id ? { ...r, description: e.target.value } : r
                            )
                            setStudioData(prev => ({ ...prev, rooms: updatedRooms }))
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Equipment</Label>
                        <div className="flex flex-wrap gap-2">
                          {room.equipment.map((item) => (
                            <Badge key={item} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Studio Staff</CardTitle>
                  <CardDescription>Manage your studio team members</CardDescription>
                </div>
                <Button onClick={handleAddStaff}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {studioData.staff.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-medium mb-2">No staff members yet</h3>
                    <p className="text-muted-foreground mb-4">Add your first team member to showcase on your studio profile</p>
                    <Button onClick={handleAddStaff}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff Member
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {studioData.staff.map((staff) => (
                      <Card key={staff.id} className="overflow-hidden">
                        <div className="aspect-square relative">
                          <Avatar className="h-full w-full rounded-none">
                            <AvatarImage src={staff.image || "/placeholder.svg"} alt={staff.name} className="object-cover" />
                            <AvatarFallback className="text-4xl rounded-none h-full">{getInitials(staff.name)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg">{staff.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{staff.role}</p>
                          <p className="text-sm">{staff.bio}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between p-6 pt-0">
                          <Button variant="outline" size="sm" onClick={() => handleEditStaff(staff)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {staff.name}'s profile. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>Set your studio's availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={studioData.isAvailable}
                    onCheckedChange={(checked) => setStudioData(prev => ({ ...prev, isAvailable: checked }))}
                  />
                  <Label>Studio is currently accepting bookings</Label>
                </div>

                <div className="space-y-4">
                  {Object.entries(studioData.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24 capitalize font-medium">{day}</div>
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => updateOperatingHours(day, 'closed', !checked)}
                      />
                      {!hours.closed && (
                        <>
                          <Select value={hours.open} onValueChange={(value) => updateOperatingHours(day, 'open', value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0') + ':00'
                                return (
                                  <SelectItem key={hour} value={hour}>
                                    {hour}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <span>to</span>
                          <Select value={hours.close} onValueChange={(value) => updateOperatingHours(day, 'close', value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0') + ':00'
                                return (
                                  <SelectItem key={hour} value={hour}>
                                    {hour}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      {hours.closed && (
                        <span className="text-muted-foreground">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Photos & Media</CardTitle>
                <CardDescription>Upload photos of your studio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Profile Image</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={studioData.profileImage} />
                        <AvatarFallback>{studioData.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Label htmlFor="profile-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-3 py-2 rounded-md transition-colors">
                          <Upload className="h-4 w-4" />
                          <span>Upload New Image</span>
                        </div>
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'profile')}
                        />
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label>Cover Image</Label>
                    <div className="mt-2">
                      <Label htmlFor="cover-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/20 transition-colors">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop your cover image
                          </p>
                        </div>
                        <input
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'cover')}
                        />
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label>Studio Gallery</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {(studioData.galleryImages || []).map((image, index) => (
                        <div key={index} className="relative border-2 border-muted-foreground/25 rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`Studio Gallery Image ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeGalleryImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center min-h-[96px]">
                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById('gallery-upload')?.click()}>
                          Add Image
                        </Button>
                        <input
                          id="gallery-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'gallery')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Room Dialog */}
        <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
              <DialogDescription>
                {isEditingRoom ? "Update room details" : "Add a new room to your studio"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    value={currentRoom.name}
                    onChange={(e) => setCurrentRoom(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Studio A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-rate">Hourly Rate ($)</Label>
                  <Input
                    id="room-rate"
                    type="number"
                    value={currentRoom.hourlyRate}
                    onChange={(e) => setCurrentRoom(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-capacity">Capacity</Label>
                <Input
                  id="room-capacity"
                  type="number"
                  value={currentRoom.capacity}
                  onChange={(e) => setCurrentRoom(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-description">Description</Label>
                <Textarea
                  id="room-description"
                  value={currentRoom.description}
                  onChange={(e) => setCurrentRoom(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Equipment</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add equipment..."
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEquipmentToRoom()}
                  />
                  <Button onClick={addEquipmentToRoom}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentRoom.equipment.map((item) => (
                    <Badge key={item} variant="outline" className="flex items-center gap-1">
                      {item}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeEquipmentFromRoom(item)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRoomSubmit}>
                {isEditingRoom ? "Save Changes" : "Add Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Staff Dialog */}
        <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
              <DialogDescription>
                {isEditingStaff ? "Update staff member information" : "Add a new team member to your studio"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4 mb-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentStaff.image || "/placeholder.svg"} alt={currentStaff.name} />
                  <AvatarFallback>{currentStaff.name ? getInitials(currentStaff.name) : "?"}</AvatarFallback>
                </Avatar>
                <Label htmlFor="staff-image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-3 py-2 rounded-md transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </div>
                  <input
                    id="staff-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleStaffImageUpload}
                  />
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-name">Name</Label>
                <Input
                  id="staff-name"
                  value={currentStaff.name}
                  onChange={(e) => setCurrentStaff(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter staff member's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role</Label>
                <Input
                  id="staff-role"
                  value={currentStaff.role}
                  onChange={(e) => setCurrentStaff(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Enter staff member's role"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-bio">Bio</Label>
                <Textarea
                  id="staff-bio"
                  value={currentStaff.bio}
                  onChange={(e) => setCurrentStaff(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Enter a short bio"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStaffSubmit}>
                {isEditingStaff ? "Save Changes" : "Add Staff Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function StudioProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudioProfileContent />
    </Suspense>
  )
} 