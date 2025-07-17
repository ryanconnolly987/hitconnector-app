import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { 
  title: "Learn More | HitConnector",
  description: "Learn more about HitConnector - your one-stop platform for booking and managing recording sessions."
};

export default function LearnMorePage() {
  return (
    <main className="container mx-auto max-w-3xl py-16 space-y-6">
      <h1 className="text-3xl font-bold">Learn More About HitConnector</h1>
      
      <h2 className="text-xl font-semibold">
        Your One‑Stop Platform for Booking &amp; Managing Recording Sessions
      </h2>
      
      <p className="mt-4">
        HitConnector is revolutionizing the music industry by creating a seamless bridge between talented artists and professional recording studios. Whether you're an up-and-coming rapper looking for the perfect space to lay down your tracks or a studio owner wanting to maximize your booking potential, our platform is designed with you in mind.
      </p>

      <p className="mt-4">
        <strong>For Artists:</strong> Say goodbye to endless phone calls and email chains trying to find available studio time. Our platform lets you browse through a curated selection of professional recording studios in your area, complete with detailed photos, equipment lists, and real reviews from other artists. You can compare prices, check availability in real-time, and book sessions instantly. Our messaging system keeps all communication organized, and our secure payment processing means you can focus on what matters most – your music.
      </p>

      <p className="mt-4">
        <strong>For Studios:</strong> Transform your studio management with our comprehensive dashboard. List your space with professional photos and detailed descriptions, manage your calendar and availability, set your rates and package deals, and connect with serious artists ready to book. Our platform handles payment processing, booking confirmations, and client communication, giving you more time to focus on providing the best possible recording experience.
      </p>

      <p className="mt-4">
        <strong>Why Choose HitConnector?</strong> We understand the music industry because we're part of it. Our platform was built by musicians, for musicians, with features that actually matter to your creative process. From secure payments and professional communication tools to detailed studio profiles and authentic artist reviews, every feature is designed to make your recording experience smooth and professional.
      </p>

      <p className="mt-4">
        Join the growing community of artists and studios who are taking their music careers to the next level with HitConnector. Whether you're recording your first demo or your tenth album, we're here to connect you with the perfect space to bring your vision to life.
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