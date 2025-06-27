"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Upload } from "lucide-react"

// Define the staff member type
interface StaffMember {
  id: string
  name: string
  role: string
  bio: string
  image: string
}

export default function StudioStaffPage() {
  // Initial staff data
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: "1",
      name: "Michael Rodriguez",
      role: "Lead Engineer",
      bio: "With over 15 years of experience and multiple Grammy nominations, Michael specializes in hip-hop and R&B production.",
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      role: "Mixing Engineer",
      bio: "Sarah has worked with top artists in the industry and brings a unique ear for detail to every project.",
      image: "/placeholder.svg?height=200&width=200",
    },
    {
      id: "3",
      name: "David Chen",
      role: "Producer",
      bio: "David's production credits include several platinum records across multiple genres.",
      image: "/placeholder.svg?height=200&width=200",
    },
  ])

  // State for the form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentStaff, setCurrentStaff] = useState<StaffMember>({
    id: "",
    name: "",
    role: "",
    bio: "",
    image: "",
  })

  // Handle opening the dialog for adding a new staff member
  const handleAddNew = () => {
    setIsEditing(false)
    setCurrentStaff({
      id: "",
      name: "",
      role: "",
      bio: "",
      image: "",
    })
    setIsDialogOpen(true)
  }

  // Handle opening the dialog for editing a staff member
  const handleEdit = (staff: StaffMember) => {
    setIsEditing(true)
    setCurrentStaff(staff)
    setIsDialogOpen(true)
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentStaff((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)
      setCurrentStaff((prev) => ({
        ...prev,
        image: imageUrl,
      }))
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    if (isEditing) {
      // Update existing staff member
      setStaffMembers((prev) => prev.map((staff) => (staff.id === currentStaff.id ? { ...currentStaff } : staff)))
    } else {
      // Add new staff member
      const newStaff = {
        ...currentStaff,
        id: `staff-${Date.now()}`,
      }
      setStaffMembers((prev) => [...prev, newStaff])
    }
    setIsDialogOpen(false)
  }

  // Handle staff deletion
  const handleDelete = (id: string) => {
    setStaffMembers((prev) => prev.filter((staff) => staff.id !== id))
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Studio Staff</h1>
          <p className="text-muted-foreground">Manage your studio team members and their bios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the information for this staff member."
                  : "Add details about your new team member."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4 mb-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentStaff.image || "/placeholder.svg"} alt={currentStaff.name} />
                  <AvatarFallback>{currentStaff.name ? getInitials(currentStaff.name) : "?"}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-3 py-2 rounded-md transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Upload Photo</span>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </Label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentStaff.name}
                  onChange={handleInputChange}
                  placeholder="Enter staff member's name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  name="role"
                  value={currentStaff.role}
                  onChange={handleInputChange}
                  placeholder="Enter staff member's role"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={currentStaff.bio}
                  onChange={handleInputChange}
                  placeholder="Enter a short bio"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>{isEditing ? "Save Changes" : "Add Staff Member"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {staffMembers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium mb-2">No staff members yet</h3>
          <p className="text-muted-foreground mb-4">Add your first team member to showcase on your studio profile</p>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Staff
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {staffMembers.map((staff) => (
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
                <Button variant="outline" size="sm" onClick={() => handleEdit(staff)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
                        onClick={() => handleDelete(staff.id)}
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
    </div>
  )
}