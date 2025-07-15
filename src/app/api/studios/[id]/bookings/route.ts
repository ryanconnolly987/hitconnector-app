import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const BOOKING_REQUESTS_FILE = path.join(process.cwd(), 'data', 'booking-requests.json');

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

// Read booking requests from file
function getBookingRequests(): any[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(BOOKING_REQUESTS_FILE)) {
      fs.writeFileSync(BOOKING_REQUESTS_FILE, JSON.stringify({ bookingRequests: [] }, null, 2));
      return [];
    }
    const data = fs.readFileSync(BOOKING_REQUESTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.bookingRequests || [];
  } catch (error) {
    console.error('Error reading booking requests file:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const { studioId } = await params;
    
    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }

    // Use unified activeBookings approach  
    const { getActiveBookings } = await import('@/lib/bookings/activeBookings');
    const bookings = await getActiveBookings(studioId);
    const now = new Date();
    
    const upcoming = bookings.filter((b: any) => b.endDateTime > now);
    const past = bookings.filter((b: any) => b.endDateTime <= now);
    const pending = bookings.filter((b: any) => b.status === 'pending');

    return NextResponse.json({ pending, upcoming, past }, { status: 200 });
  } catch (error) {
    console.error('GET studio bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 