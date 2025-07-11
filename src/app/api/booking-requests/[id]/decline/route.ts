import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { stripe } from '@/lib/stripe';

const BOOKING_REQUESTS_FILE = path.join(process.cwd(), 'data', 'booking-requests.json');

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { reason } = await request.json();
    
    const bookingRequests = getBookingRequests();
    const requestIndex = bookingRequests.findIndex(req => req.id === id);
    
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Booking request not found' },
        { status: 404 }
      );
    }

    const bookingRequest = bookingRequests[requestIndex];
    
    // Check if already processed
    if (bookingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking request has already been processed' },
        { status: 400 }
      );
    }

    // Cancel the PaymentIntent if it exists
    if (bookingRequest.paymentIntentId) {
      try {
        console.log('❌ Canceling payment intent:', bookingRequest.paymentIntentId);
        
        await stripe.paymentIntents.cancel(bookingRequest.paymentIntentId);
        
        console.log('✅ Payment intent canceled successfully');
        
        // Update payment status
        bookingRequest.paymentStatus = 'canceled';
        
      } catch (stripeError) {
        console.error('⚠️ Error canceling payment intent:', stripeError);
        // Continue with decline even if cancellation fails
        // The payment intent will eventually expire
      }
    }

    // Update booking request status
    bookingRequests[requestIndex] = {
      ...bookingRequest,
      status: 'rejected',
      rejectionReason: reason || 'No reason provided',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveBookingRequests(bookingRequests);

    console.log('❌ Booking declined:', id);

    return NextResponse.json({
      success: true,
      bookingRequest: bookingRequests[requestIndex],
      message: 'Booking request declined successfully'
    });

  } catch (error) {
    console.error('❌ Error declining booking:', error);
    return NextResponse.json(
      { error: 'Failed to decline booking' },
      { status: 500 }
    );
  }
} 