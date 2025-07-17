"use client"

import { Star } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface Studio {
  id: string
  name: string
  profileImage?: string
  location: string
  rating: number
  hourlyRate: number
}

interface StudiosSectionProps {
  studios: Studio[]
  loading: boolean
}

export default function StudiosSection({ studios, loading }: StudiosSectionProps) {
  return (
    <section className="py-24 text-center">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Some of Our Studios</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Followed by artists across HitConnector
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="h-8 bg-muted animate-pulse rounded w-full" />
                </CardFooter>
              </Card>
            ))
          ) : studios.length > 0 ? (
            studios.map((studio) => (
              <StudioCard
                key={studio.id}
                name={studio.name}
                image={studio.profileImage || "/placeholder.svg?height=300&width=400"}
                city={studio.location}
                rating={studio.rating}
                price={studio.hourlyRate}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="mt-20 text-lg text-gray-500">Studios will appear here soon!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface StudioCardProps {
  name: string
  image: string
  city: string
  rating: number
  price: number
}

function StudioCard({ name, image, city, rating, price }: StudioCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">{city}</p>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="ml-1 text-sm font-medium">{rating}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-sm font-medium">
          <span className="font-bold">${price}</span> / hour
        </p>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
} 