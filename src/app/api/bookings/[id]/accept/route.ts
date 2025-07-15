import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');

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
  const dataDir = path.dirname(BOOKINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings }, null, 2));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const bookings = getBookings();
    const bookingIndex = bookings.findIndex(booking => booking.id === id);
    
    if (bookingIndex === -1) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = bookings[bookingIndex];
    
    // Check if booking is in PENDING status
    if (booking.status !== 'pending' && booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Booking request has already been processed' },
        { status: 400 }
      );
    }

    // Update booking status from PENDING to CONFIRMED
    bookings[bookingIndex] = {
      ...booking,
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveBookings(bookings);

    console.log('✅ Booking accepted:', id);

    return NextResponse.json({
      success: true,
      booking: bookings[bookingIndex],
      message: 'Booking accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 