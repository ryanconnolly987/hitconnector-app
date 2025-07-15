import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const BOOKING_REQUESTS_FILE = path.join(process.cwd(), 'data', 'booking-requests.json');

// Helper functions to read/write data
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
  try {
    const dataDir = path.dirname(BOOKINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings }, null, 2));
  } catch (error) {
    console.error('Error saving bookings file:', error);
    throw new Error('Failed to save booking data');
  }
}

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
  try {
    const dataDir = path.dirname(BOOKING_REQUESTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(BOOKING_REQUESTS_FILE, JSON.stringify({ bookingRequests }, null, 2));
  } catch (error) {
    console.error('Error saving booking requests file:', error);
    throw new Error('Failed to save booking request data');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First check confirmed bookings
    const bookings = getBookings();
    const bookingIndex = bookings.findIndex(booking => booking.id === id && booking.userId === userId);

    if (bookingIndex !== -1) {
      // Found in confirmed bookings
      const booking = bookings[bookingIndex];
      
      // Update status to cancelled instead of removing completely
      bookings[bookingIndex] = {
        ...booking,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveBookings(bookings);

      console.log('✅ Booking cancelled:', id);

      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: bookings[bookingIndex]
      });
    }

    // If not found in bookings, check booking requests
    const bookingRequests = getBookingRequests();
    const requestIndex = bookingRequests.findIndex(request => request.id === id && request.userId === userId);

    if (requestIndex !== -1) {
      // Found in booking requests
      const bookingRequest = bookingRequests[requestIndex];
      
      // Update status to cancelled
      bookingRequests[requestIndex] = {
        ...bookingRequest,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveBookingRequests(bookingRequests);

      console.log('✅ Booking request cancelled:', id);

      return NextResponse.json({
        success: true,
        message: 'Booking request cancelled successfully',
        booking: bookingRequests[requestIndex]
      });
    }

    // Booking not found
    return NextResponse.json(
      { error: 'Booking not found or you do not have permission to cancel it' },
      { status: 404 }
    );

  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
} 