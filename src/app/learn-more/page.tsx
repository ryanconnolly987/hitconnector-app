import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Learn More | HitConnector" };

export default function LearnMorePage() {
  return (
    <main className="container mx-auto max-w-3xl py-16 space-y-6">
      <h1 className="text-3xl font-bold">Learn More About HitConnector</h1>
      <h2 className="text-xl font-semibold">
        Your One‑Stop Platform for Booking &amp; Managing Recording Sessions
      </h2>
      
      <p className="mt-4 text-muted-foreground">
        HitConnector is revolutionizing how artists and recording studios connect. Whether you're an emerging rapper looking for the perfect space to record your next track, or a professional recording studio seeking to maximize your bookings, our platform bridges the gap between talent and opportunity.
      </p>
      
      <p className="mt-4 text-muted-foreground">
        For artists, discovering and booking studio time has never been easier. Browse through verified studios in your area, compare rates and equipment, read real reviews from other artists, and book sessions directly through our secure platform. No more endless phone calls or uncertainty about availability – everything you need is at your fingertips.
      </p>
      
      <p className="mt-4 text-muted-foreground">
        For recording studios, HitConnector provides a comprehensive management solution that streamlines your operations. Create detailed profiles showcasing your equipment and expertise, manage bookings through our intuitive dashboard, process payments securely, and build lasting relationships with artists in your community.
      </p>
      
      <p className="mt-4 text-muted-foreground">
        Our platform features secure payment processing, detailed studio profiles with photos and equipment lists, real-time availability calendars, review and rating systems, and powerful networking tools that help both artists and studios grow their businesses.
      </p>
      
      <p className="mt-4 text-muted-foreground">
        Join thousands of artists and studios who are already using HitConnector to create amazing music together. Sign up today and experience the future of studio booking.
      </p>
      
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
} 