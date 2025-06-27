"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import {
  Star,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Music,
  Headphones,
  Share2,
  Heart,
  MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StudioPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Mock data for the studio
  const studio = {
    id: "soundwave-studios",
    name: "Soundwave Studios",
    city: "Los Angeles, CA",
    rating: 4.9,
    reviewCount: 42,
    description:
      "Soundwave Studios is a premier recording facility in the heart of Los Angeles. Our studio offers state-of-the-art equipment, acoustically treated rooms, and experienced engineers to help you create your next hit. With over 15 years in the industry, we've worked with both major label artists and independent musicians to produce chart-topping tracks across all genres.",
    longDescription:
      "Founded in 2008, Soundwave Studios has become one of LA's most respected recording facilities. Our mission is to provide artists with an inspiring creative environment and technical excellence to bring their musical vision to life. We pride ourselves on our personalized approach, working closely with each client to understand their unique sound and goals.\n\nOur facility features three fully-equipped studios, each with its own control room and isolation booths. We've carefully designed every space for optimal acoustics and comfort, allowing for long sessions without fatigue. Whether you're recording vocals, a full band, or orchestral arrangements, our versatile spaces can accommodate your needs.",
    images: [
      "/placeholder.svg?height=600&width=1200",
      "/placeholder.svg?height=600&width=1200",
      "/placeholder.svg?height=600&width=1200",
      "/placeholder.svg?height=600&width=1200",
      "/placeholder.svg?height=600&width=1200",
    ],
    staff: [
      {
        name: "Michael Rodriguez",
        role: "Lead Engineer",
        image: "/placeholder.svg?height=200&width=200",
        bio: "With over 15 years of experience and multiple Grammy nominations, Michael specializes in hip-hop and R&B production.",
      },
      {
        name: "Sarah Johnson",
        role: "Mixing Engineer",
        image: "/placeholder.svg?height=200&width=200",
        bio: "Sarah has worked with top artists in the industry and brings a unique ear for detail to every project.",
      },
      {
        name: "David Chen",
        role: "Producer",
        image: "/placeholder.svg?height=200&width=200",
        bio: "David's production credits include several platinum records across multiple genres.",
      },
    ],
    pricing: [
      {
        room: "Studio A",
        hourlyRate: 125,
        description: "Large recording space with isolation booth, perfect for full bands",
      },
      {
        room: "Studio B",
        hourlyRate: 95,
        description: "Mid-sized studio ideal for vocals and small ensembles",
      },
      {
        room: "Studio C",
        hourlyRate: 75,
        description: "Compact studio perfect for vocal recording and production",
      },
    ],
    equipment: [
      "Pro Tools HDX System",
      "SSL AWS 948 Console",
      "Neumann U87 Microphones",
      "Vintage Neve 1073 Preamps",
      "Universal Audio Apollo Interfaces",
      "Yamaha Grand Piano",
      "Various Vintage Guitars and Amps",
      "Roland V-Drums Electronic Kit",
    ],
    amenities: ["Free Parking", "Lounge Area", "Kitchen", "WiFi", "24/7 Access"],
    reviews: [
      {
        id: 1,
        user: "Marcus Johnson",
        userImage: "/placeholder.svg?height=40&width=40",
        rating: 5,
        date: "April 28, 2025",
        comment:
          "Amazing studio with top-notch equipment. Michael was incredibly helpful and made the recording process smooth. The acoustics in Studio A are perfect for my band's sound.",
      },
      {
        id: 2,
        user: "Alicia Reynolds",
        userImage: "/placeholder.svg?height=40&width=40",
        rating: 5,
        date: "April 15, 2025",
        comment:
          "I've recorded at many studios in LA, and Soundwave is definitely one of the best. Great engineers, comfortable environment, and the equipment is all high quality.",
      },
      {
        id: 3,
        user: "DJ Maximus",
        userImage: "/placeholder.svg?height=40&width=40",
        rating: 4,
        date: "March 30, 2025",
        comment:
          "Solid studio with a great vibe. Sarah's mixing skills are exceptional. Only reason for 4 stars is that parking can be a bit limited during peak hours.",
      },
    ],
    availableTimeSlots: {
      morning: ["9:00 AM - 12:00 PM"],
      afternoon: ["1:00 PM - 4:00 PM", "4:00 PM - 7:00 PM"],
      evening: ["7:00 PM - 10:00 PM"],
    },
  }

  // Handle image navigation
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % studio.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + studio.images.length) % studio.images.length)
  }

  // Generate time slots for booking
  const timeSlots = [
    { id: "morning1", time: "9:00 AM - 12:00 PM", available: true },
    { id: "afternoon1", time: "1:00 PM - 4:00 PM", available: true },
    { id: "afternoon2", time: "4:00 PM - 7:00 PM", available: true },
    { id: "evening1", time: "7:00 PM - 10:00 PM", available: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <Image
          src={studio.images[currentImageIndex] || "/placeholder.svg"}
          alt={studio.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm" onClick={prevImage}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm" onClick={nextImage}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Link href="/" className="absolute top-4 left-4">
          <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Search
          </Button>
        </Link>
      </div>

      <div className="container max-w-7xl px-4 py-8">
        {/* Studio Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{studio.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{studio.city}</span>
              <div className="flex items-center ml-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(studio.rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-1 text-sm font-medium">{studio.rating}</span>
                <span className="text-sm text-muted-foreground ml-1">({studio.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm">
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <section>
              <h2 className="text-2xl font-bold mb-4">About This Studio</h2>
              <p className="text-muted-foreground mb-4">{studio.description}</p>
              <p className="text-muted-foreground whitespace-pre-line">{studio.longDescription}</p>
            </section>

            {/* Gallery Section */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Studio Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {studio.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square overflow-hidden rounded-md cursor-pointer ${
                      index === currentImageIndex ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Studio image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Staff Section */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Meet Our Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {studio.staff.map((person, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={person.image || "/placeholder.svg"} alt={person.name} />
                          <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold">{person.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{person.role}</p>
                        <p className="text-sm">{person.bio}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Equipment Section */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Equipment & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Music className="mr-2 h-5 w-5" /> Equipment
                  </h3>
                  <ul className="space-y-2">
                    {studio.equipment.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Headphones className="mr-2 h-5 w-5" /> Amenities
                  </h3>
                  <ul className="space-y-2">
                    {studio.amenities.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Reviews</h2>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Write a Review
                </Button>
              </div>
              <div className="space-y-6">
                {studio.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.userImage || "/placeholder.svg"} alt={review.user} />
                        <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{review.user}</div>
                        <div className="text-sm text-muted-foreground">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Reviews
              </Button>
            </section>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Book This Studio</h3>

                {/* Pricing Section */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Pricing</h4>
                  <div className="space-y-2">
                    {studio.pricing.map((option, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{option.room}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        <div className="font-bold">${option.hourlyRate}/hr</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Date Selection */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Select Date</h4>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="border rounded-md p-3"
                    disabled={(date) => date < new Date()}
                  />
                </div>

                {/* Room Selection */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Select Room</h4>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {studio.pricing.map((option, index) => (
                        <SelectItem key={index} value={option.room}>
                          {option.room} - ${option.hourlyRate}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Slot Selection */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Available Time Slots</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                        className="justify-start"
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.id)}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Booking Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book This Studio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Your Booking</DialogTitle>
                      <DialogDescription>
                        You're about to book {studio.name} for{" "}
                        {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Studio:</span>
                        <span>{studio.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Date:</span>
                        <span>{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Not selected"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Time:</span>
                        <span>
                          {selectedTimeSlot
                            ? timeSlots.find((slot) => slot.id === selectedTimeSlot)?.time
                            : "Not selected"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Room:</span>
                        <span>Studio A</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Rate:</span>
                        <span>$125/hour</span>
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        <span>Total:</span>
                        <span>$375.00</span>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full">
                        Confirm Booking
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="text-xs text-center text-muted-foreground mt-4">
                  You won't be charged until the studio confirms your booking
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}