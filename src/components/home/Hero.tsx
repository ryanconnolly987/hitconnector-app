"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Hero() {
  const [search, setSearch] = useState('')

  return (
    <section className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="mx-auto max-w-4xl text-6xl font-black">
        Find Your Perfect Studio Today
      </h1>
      <p className="mt-6 max-w-2xl text-xl text-gray-500">
        Connect with top recording studios in your area and start creating your next hit.
      </p>
      <div className="mt-10 flex w-full max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter your city to find nearby studios"
            className="pl-8 h-12 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button 
            className="absolute right-1 top-1 h-10 rounded-full px-4"
          >
            Search
          </Button>
        </div>
      </div>
    </section>
  )
} 