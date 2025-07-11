import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { stripe } from '@/lib/stripe';

const BOOKING_REQUESTS_FILE = path.join(process.cwd(), 'data', 'booking-requests.json');
const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');

// Helper functions to read/write data
function getBookingRequests(): any[] {
  try {
    if (fs.existsSync(BOOKING_REQUESTS_FILE)) {
      const data = fs.readFileSync(BOOKING_REQUESTS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.bookingRequests || [];
    }
  } catch (error) {
    console.error('Error reading booking requests file:', error);
  }
  return [];
}

function saveBookingRequests(bookingRequests: any[]): void {
  const dataDir = path.dirname(BOOKING_REQUESTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(BOOKING_REQUESTS_FILE, JSON.stringify({ bookingRequests }, null, 2));
}

function getBookings(): any[] {
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.bookings || [];
    }
  } catch (error) {
    console.error('Error reading bookings file:', error);
  }
  return [];
}

function saveBookings(bookings: any[]): void {
  const dataDir = path.dirname(BOOKINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings }, null, 2));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bookingRequests = getBookingRequests();
    
    const requestIndex = bookingRequests.findIndex(req => req.id === id);
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Booking request not found' },
        { status: 404 }
      );
    }

    const bookingRequest = bookingRequests[requestIndex];
    
    // Check if already confirmed
    if (bookingRequest.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Booking request already confirmed' },
        { status: 400 }
      );
    }

    // Capture the payment if PaymentIntent exists
    if (bookingRequest.paymentIntentId) {
      try {
        console.log('💳 Capturing payment:', bookingRequest.paymentIntentId);
        
        const paymentIntent = await stripe.paymentIntents.capture(bookingRequest.paymentIntentId);
        
        console.log('✅ Payment captured successfully:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        });
        
        // Update payment status
        bookingRequest.paymentStatus = 'captured';
        
      } catch (stripeError) {
        console.error('❌ Error capturing payment:', stripeError);
        return NextResponse.json(
          { error: 'Failed to capture payment' },
          { status: 500 }
        );
      }
    }

    // Update booking request status
    bookingRequest.status = 'confirmed';
    bookingRequest.updatedAt = new Date().toISOString();
    bookingRequest.confirmedAt = new Date().toISOString();

    // Move to confirmed bookings
    const bookings = getBookings();
    const confirmedBooking = {
      ...bookingRequest,
      confirmedAt: new Date().toISOString()
    };
    
    bookings.push(confirmedBooking);

    // Remove from booking requests
    bookingRequests.splice(requestIndex, 1);

    // Save both files
    saveBookingRequests(bookingRequests);
    saveBookings(bookings);

    console.log('✅ Booking confirmed and moved to bookings:', id);

    return NextResponse.json({
      success: true,
      booking: confirmedBooking,
      message: 'Booking confirmed and payment captured successfully'
    });

  } catch (error) {
    console.error('❌ Error confirming booking:', error);
    return NextResponse.json(
      { error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
} 