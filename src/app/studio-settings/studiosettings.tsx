"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Camera, Save } from "lucide-react"

export default function StudioSettingsPage() {
  // Mock data for the studio owner
  const [studioOwner, setStudioOwner] = useState({
    name: "Soundwave Studios",
    email: "contact@soundwavestudios.com",
    avatar: "/placeholder.svg?height=100&width=100",
  })

  // State for form values
  const [profileForm, setProfileForm] = useState({
    name: studioOwner.name,
    email: studioOwner.email,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    bookingConfirmations: true,
    reviewNotifications: true,
    marketingEmails: false,
    appNotifications: true,
  })

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle notification checkbox changes
  const handleNotificationChange = (id: string, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [id]: checked }))
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would send this data to your API
    console.log("Profile data:", profileForm)
    console.log("Password data:", passwordForm)
    console.log("Notification preferences:", notifications)
    // Show success message or handle errors
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your studio account preferences and settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your studio profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={studioOwner.avatar || "/placeholder.svg"} alt={studioOwner.name} />
                    <AvatarFallback>{studioOwner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-2 -bottom-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                      <Camera className="h-4 w-4" />
                      <span className="sr-only">Upload avatar</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-medium">{studioOwner.name}</h3>
                  <p className="text-sm text-muted-foreground">{studioOwner.email}</p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Studio Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your studio name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your new password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm your new password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Change Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailAlerts"
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => handleNotificationChange("emailAlerts", checked as boolean)}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="emailAlerts" className="font-medium">
                      Email Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about important account updates
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bookingConfirmations"
                    checked={notifications.bookingConfirmations}
                    onCheckedChange={(checked) => handleNotificationChange("bookingConfirmations", checked as boolean)}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="bookingConfirmations" className="font-medium">
                      Booking Confirmations
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when artists book your studio</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reviewNotifications"
                    checked={notifications.reviewNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("reviewNotifications", checked as boolean)}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="reviewNotifications" className="font-medium">
                      Studio Review Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone leaves a review for your studio
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketingEmails"
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => handleNotificationChange("marketingEmails", checked as boolean)}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="marketingEmails" className="font-medium">
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and promotional offers
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appNotifications"
                    checked={notifications.appNotifications}
                    onCheckedChange={(checked) => handleNotificationChange("appNotifications", checked as boolean)}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="appNotifications" className="font-medium">
                      In-App Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications within the HitConnector application
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}