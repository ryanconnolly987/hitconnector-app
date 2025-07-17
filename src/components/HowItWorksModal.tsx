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
        <Tabs value={tab} onValueChange={(v) => setTab(v as "artist" | "studio")}>
          <TabsList className="mb-4">
            <TabsTrigger value="artist">For Artists</TabsTrigger>
            <TabsTrigger value="studio">For Studios</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[400px] pr-4">
            <TabsContent value="artist" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Getting Started as an Artist</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <strong>Create Your Profile:</strong> Sign up and build your artist profile with your bio, music samples, and booking preferences.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <strong>Browse Studios:</strong> Use our search and filter tools to find recording studios that match your style, budget, and location preferences.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <strong>Review & Connect:</strong> Check out studio photos, read reviews from other artists, and view available time slots.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <strong>Book Sessions:</strong> Send booking requests with your project details, preferred dates, and any special requirements.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <strong>Collaborate:</strong> Use our messaging system to communicate with studio owners, share ideas, and coordinate session details.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">6</span>
                    <div>
                      <strong>Create & Pay:</strong> Complete your recording sessions and handle payments securely through our platform.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">7</span>
                    <div>
                      <strong>Review & Share:</strong> Leave reviews for studios and share your experience to help other artists in the community.
                    </div>
                  </li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="studio" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Getting Started as a Studio</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <strong>Register Your Studio:</strong> Create your studio profile with detailed information about your space, equipment, and specialties.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <strong>Set Your Rates:</strong> Configure your hourly rates, packages, and availability calendar to match your business needs.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <strong>Upload Media:</strong> Showcase your studio with high-quality photos, equipment lists, and sample recordings from previous sessions.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <strong>Receive Bookings:</strong> Get booking requests from artists and review their profiles and project details before accepting.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <strong>Manage Sessions:</strong> Use our dashboard to track upcoming sessions, communicate with artists, and manage your schedule.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">6</span>
                    <div>
                      <strong>Get Paid:</strong> Receive secure payments through our platform with automated invoicing and payout processing.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">7</span>
                    <div>
                      <strong>Build Reputation:</strong> Earn reviews from artists and grow your studio's presence in the HitConnector community.
                    </div>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 