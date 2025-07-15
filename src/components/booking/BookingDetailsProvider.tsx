"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BookingDetailsContextType {
  open: (bookingId: string) => void
  close: () => void
  isOpen: boolean
  bookingId: string | null
}

const BookingDetailsContext = createContext<BookingDetailsContextType | undefined>(undefined)

export function BookingDetailsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const open = (id: string) => {
    setBookingId(id)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setBookingId(null)
  }

  return (
    <BookingDetailsContext.Provider value={{ open, close, isOpen, bookingId }}>
      {children}
    </BookingDetailsContext.Provider>
  )
}

export function useBookingDetails() {
  const context = useContext(BookingDetailsContext)
  if (context === undefined) {
    throw new Error('useBookingDetails must be used within a BookingDetailsProvider')
  }
  return context
} 