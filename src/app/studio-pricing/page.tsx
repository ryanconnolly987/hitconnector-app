"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { DollarSign, Clock, Save } from "lucide-react"

// Define the time blocks
const timeBlocks = ["Morning (8AM-12PM)", "Afternoon (12PM-5PM)", "Evening (5PM-10PM)"]

// Define the days of the week
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// Define the studio rooms
const studioRooms = [
  {
    id: "studio-a",
    name: "Studio A",
    description: "Large recording space with isolation booth, perfect for full bands",
    hourlyRate: 125,
  },
  {
    id: "studio-b",
    name: "Studio B",
    description: "Mid-sized studio ideal for vocals and small ensembles",
    hourlyRate: 95,
  },
  {
    id: "studio-c",
    name: "Studio C",
    description: "Compact studio perfect for vocal recording and production",
    hourlyRate: 75,
  },
]

export default function StudioPricingPage() {
  // State for pricing
  const [pricing, setPricing] = useState(
    studioRooms.reduce(
      (acc, studio) => {
        acc[studio.id] = studio.hourlyRate
        return acc
      },
      {} as Record<string, number>,
    ),
  )

  // State for availability
  // Initialize with all time blocks available
  const [availability, setAvailability] = useState(
    studioRooms.reduce(
      (acc, studio) => {
        acc[studio.id] = {}
        daysOfWeek.forEach((day) => {
          acc[studio.id][day] = {}
          timeBlocks.forEach((block) => {
            acc[studio.id][day][block] = true
          })
        })
        return acc
      },
      {} as Record<string, Record<string, Record<string, boolean>>>,
    ),
  )

  // Handle price change
  const handlePriceChange = (studioId: string, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "")
    setPricing((prev) => ({
      ...prev,
      [studioId]: numericValue ? Number.parseInt(numericValue, 10) : 0,
    }))
  }

  // Handle availability toggle
  const handleAvailabilityToggle = (studioId: string, day: string, block: string) => {
    setAvailability((prev) => ({
      ...prev,
      [studioId]: {
        ...prev[studioId],
        [day]: {
          ...prev[studioId][day],
          [block]: !prev[studioId][day][block],
        },
      },
    }))
  }

  // Handle save pricing
  const handleSavePricing = (studioId: string) => {
    console.log(`Saving pricing for ${studioId}:`, pricing[studioId])
    // In a real app, you would send this data to your API
  }

  // Handle update availability
  const handleUpdateAvailability = (studioId: string) => {
    console.log(`Updating availability for ${studioId}:`, availability[studioId])
    // In a real app, you would send this data to your API
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Studio Pricing & Availability</h1>
        <p className="text-muted-foreground">
          Set your hourly rates and manage when your studios are available for booking
        </p>
      </div>

      <Tabs defaultValue="studio-a" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="studio-a">Studio A</TabsTrigger>
          <TabsTrigger value="studio-b">Studio B</TabsTrigger>
          <TabsTrigger value="studio-c">Studio C</TabsTrigger>
        </TabsList>

        {studioRooms.map((studio) => (
          <TabsContent key={studio.id} value={studio.id}>
            <div className="grid gap-6">
              {/* Pricing Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Hourly Rate
                  </CardTitle>
                  <CardDescription>{studio.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`price-${studio.id}`}>Price per Hour ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`price-${studio.id}`}
                          value={pricing[studio.id]}
                          onChange={(e) => handlePriceChange(studio.id, e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleSavePricing(studio.id)} className="ml-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Pricing
                  </Button>
                </CardFooter>
              </Card>

              {/* Availability Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Weekly Availability
                  </CardTitle>
                  <CardDescription>Set which time blocks are available for booking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left font-medium p-2 border-b"></th>
                          {timeBlocks.map((block) => (
                            <th key={block} className="text-left font-medium p-2 border-b">
                              {block}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {daysOfWeek.map((day) => (
                          <tr key={day}>
                            <td className="p-2 border-b font-medium">{day}</td>
                            {timeBlocks.map((block) => (
                              <td key={`${day}-${block}`} className="p-2 border-b">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`${studio.id}-${day}-${block}`}
                                    checked={availability[studio.id][day][block]}
                                    onCheckedChange={() => handleAvailabilityToggle(studio.id, day, block)}
                                  />
                                  <Label
                                    htmlFor={`${studio.id}-${day}-${block}`}
                                    className="text-sm cursor-pointer select-none"
                                  >
                                    {availability[studio.id][day][block] ? "Available" : "Unavailable"}
                                  </Label>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleUpdateAvailability(studio.id)} className="ml-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Update Availability
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button variant="outline" className="mr-2">
          Cancel
        </Button>
        <Button>Save All Changes</Button>
      </div>
    </div>
  )
}