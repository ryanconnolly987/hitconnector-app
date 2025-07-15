import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(BOOKINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read bookings from file
function getBookings(): any[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings: [] }, null, 2));
      return [];
    }
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.bookings || [];
  } catch (error) {
    console.error('Error reading bookings file:', error);
    return [];
  }
}

// Write bookings to file
function saveBookings(bookings: any[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings }, null, 2));
  } catch (error) {
    console.error('Error saving bookings file:', error);
    throw new Error('Failed to save booking data');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    const userId = searchParams.get('userId');
    
    const bookings = getBookings();
    
    // Filter by studioId or userId if provided
    let filteredBookings = bookings;
    if (studioId) {
      filteredBookings = filteredBookings.filter(booking => booking.studioId === studioId);
    }
    if (userId) {
      // For artists, only show confirmed bookings (not pending, cancelled, or rejected)
      filteredBookings = filteredBookings.filter(booking => 
        booking.userId === userId && 
        (booking.status === 'confirmed' || booking.status === 'completed')
      );
    }
    
    return NextResponse.json({ bookings: filteredBookings }, { status: 200 });
  } catch (error) {
    console.error('GET bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get existing bookings
    const bookings = getBookings();
    
    // Generate booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create booking
    const newBooking = {
      id: bookingId,
      ...body,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };
    
    // Add to bookings list
    bookings.push(newBooking);
    saveBookings(bookings);
    
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('POST bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 