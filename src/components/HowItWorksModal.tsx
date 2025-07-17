"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HowItWorksModal({
  open, onOpenChange
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [tab, setTab] = useState<"artist" | "studio">("artist");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>How It Works</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="artist">For Artists</TabsTrigger>
            <TabsTrigger value="studio">For Studios</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[400px] pr-4">
            <TabsContent value="artist" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">For Artists & Rappers</h3>
                <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
                  <li><strong>Discover Studios:</strong> Browse through verified recording studios in your area with detailed profiles, equipment lists, and real reviews from other artists.</li>
                  <li><strong>View Detailed Profiles:</strong> Check out studio photos, equipment, hourly rates, available time slots, and read testimonials from previous clients.</li>
                  <li><strong>Book Sessions:</strong> Send booking requests directly to studios with your preferred dates, times, and session details. Studios respond quickly to confirm availability.</li>
                  <li><strong>Secure Payments:</strong> Pay safely through our platform with transparent pricing. No hidden fees or surprise charges.</li>
                  <li><strong>Connect & Network:</strong> Follow your favorite studios, stay updated on their latest news, and build relationships in the music community.</li>
                  <li><strong>Track Your Sessions:</strong> Manage all your bookings in one place with calendar integration and booking history.</li>
                  <li><strong>Leave Reviews:</strong> Share your experience and help other artists discover great studios by leaving honest reviews and ratings.</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="studio" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">For Recording Studios</h3>
                <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
                  <li><strong>Create Your Profile:</strong> Build a comprehensive studio profile with photos, equipment details, pricing, and availability to attract the right clients.</li>
                  <li><strong>Manage Bookings:</strong> Receive and respond to booking requests through our streamlined dashboard. Accept or decline requests with one click.</li>
                  <li><strong>Set Your Schedule:</strong> Control your availability with our calendar system. Block off maintenance time, set different rates for peak hours, and manage multiple rooms.</li>
                  <li><strong>Secure Payment Processing:</strong> Get paid automatically when sessions are completed. Our payment system handles billing, invoicing, and transfers.</li>
                  <li><strong>Build Your Reputation:</strong> Collect reviews and ratings from artists to build trust and attract more bookings. Showcase your best work and client testimonials.</li>
                  <li><strong>Track Performance:</strong> Access detailed analytics about your bookings, revenue, and popular time slots to optimize your business.</li>
                  <li><strong>Connect with Artists:</strong> Build lasting relationships with returning clients and discover new talent in your area.</li>
                </ul>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 