"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import HowItWorksModal from "@/components/HowItWorksModal"

export default function SiteHeader() {
  const [openModal, setOpenModal] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold -ml-px">
            HitConnector
          </Link>
          <nav className="flex items-center gap-8">
            <button
              onClick={() => setOpenModal(true)}
              className="nav-link"
            >
              How It Works
            </button>
            <Link href="/login" className="nav-link">
              Log In
            </Link>
            <Link href="/signup" className="btn-primary px-5 py-2">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
      <HowItWorksModal open={openModal} onOpenChange={setOpenModal} />
    </>
  )
} 