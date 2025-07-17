"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CTASection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Ready to create your next hit?
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Join thousands of artists who have found their perfect recording space through HitConnector.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/learn-more">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 