import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PROFILES_FILE = path.join(process.cwd(), 'data', 'user-profiles.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(BOOKINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Helper function to get user info with profile data including avatar
function getUserInfo(userId: string): { id: string; name: string; email: string; role: string; profileImage?: string; slug?: string } | null {
  try {
    // Get basic user info
    let users: any[] = [];
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(usersData);
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    // Get profile info for avatar
    let profiles: any[] = [];
    if (fs.existsSync(PROFILES_FILE)) {
      const profilesData = fs.readFileSync(PROFILES_FILE, 'utf8');
      profiles = JSON.parse(profilesData);
    }
    
    const profile = profiles.find(p => p.id === userId);
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: profile?.profileImage,
      slug: user.slug
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
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
    
    if (studioId) {
      // Studio booking requests - use unified activeBookings approach
      const { getActiveBookings } = await import('@/lib/bookings/activeBookings');
      const bookings = await getActiveBookings(studioId);
      const now = new Date();
      
      // Filter by status using normalized status values
      const pending = bookings.filter((b: any) => b.status === 'PENDING');
      const upcoming = bookings.filter((b: any) => b.status === 'CONFIRMED' && b.endDateTime > now);
      const past = bookings.filter((b: any) => b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && b.endDateTime <= now));
      
      // Compute monthly revenue for studio dashboard requests
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const revenue = bookings
        .filter((b: any) => b.startDateTime >= monthStart && b.startDateTime <= monthEnd)
        .reduce((sum: number, b: any) => sum + b.totalCost, 0);
      
      return NextResponse.json({ pending, upcoming, past, revenue }, { status: 200 });
    }

    if (userId) {
      // Artist view - only show confirmed bookings (not pending, cancelled, or rejected)
      const bookings = getBookings();
      const filteredBookings = bookings.filter(booking => 
        booking.userId === userId && 
        (booking.status === 'CONFIRMED' || booking.status === 'confirmed' || 
         booking.status === 'COMPLETED' || booking.status === 'completed')
      );
      
      return NextResponse.json({ bookings: filteredBookings }, { status: 200 });
    } else {
      // Fallback for general requests - return all bookings without CANCELED filter
      const bookings = getBookings();
      
      // Enhance bookings with artist profile data
      const enhancedBookings = bookings.map(booking => {
        const artistInfo = getUserInfo(booking.userId);
        return {
          ...booking,
          // Add artist profile data while preserving existing fields
          artistId: booking.userId,
          artistName: artistInfo?.name || booking.userName,
          artistSlug: artistInfo?.slug,
          artistProfilePicture: artistInfo?.profileImage
        };
      });
      
      return NextResponse.json({ bookings: enhancedBookings }, { status: 200 });
    }
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