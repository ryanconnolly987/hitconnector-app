import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');

// Helper function to read bookings
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

// Helper function to save bookings
function saveBookings(bookings: any[]): void {
  try {
    const data = { bookings };
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving bookings file:', error);
    throw error;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const bookings = getBookings();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = bookings[bookingIndex];

    // Check if booking can be cancelled
    if (booking.status === 'cancelled' || booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'completed' || booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed booking' },
        { status: 400 }
      );
    }

    // Update booking status
    bookings[bookingIndex] = {
      ...booking,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save updated bookings
    saveBookings(bookings);

    console.log(`✅ [Cancel Booking] Booking ${bookingId} cancelled successfully`);

    // TODO: In production, this would also handle Stripe refunds
    // if (booking.paymentIntentId && booking.paymentStatus === 'captured') {
    //   await stripe.refunds.create({
    //     payment_intent: booking.paymentIntentId,
    //   });
    // }

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: bookings[bookingIndex]
    });

  } catch (error) {
    console.error('❌ [Cancel Booking] Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 