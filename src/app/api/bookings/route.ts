import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { artistBriefSelect, type ArtistBrief } from '@/lib/bookings/activeBookings';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PROFILES_FILE = path.join(process.cwd(), 'data', 'user-profiles.json');
const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(BOOKINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Helper function to get user info consistent with artistBriefSelect
function getUserInfo(userId: string): ArtistBrief | null {
  try {
    let user = null;
    let profile = null;

    // Get basic user info
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(usersData);
      user = users.find((u: any) => u.id === userId);
    }

    // Get profile info for avatar
    if (fs.existsSync(PROFILES_FILE)) {
      const profilesData = fs.readFileSync(PROFILES_FILE, 'utf8');
      const profiles = JSON.parse(profilesData);
      profile = profiles.find((p: any) => p.id === userId);
    }
    
    // Return data consistent with artistBriefSelect format
    if (user || profile) {
      return {
        id: userId,
        displayName: user?.name || profile?.name || 'Unknown Artist',
        slug: user?.slug || profile?.slug || null,
        avatarUrl: profile?.profileImage || null  // ABSOLUTELY ensure avatarUrl is present
      };
    }
  } catch (error) {
    console.error('Error getting user info:', error);
  }
  return null;
}

// Helper function to get studio information
function getStudioInfo(studioId: string): { id: string; name: string; slug: string; avatarUrl: string | null } | null {
  try {
    if (fs.existsSync(STUDIOS_FILE)) {
      const studiosData = fs.readFileSync(STUDIOS_FILE, 'utf8');
      const studioDataObj = JSON.parse(studiosData);
      const studios = studioDataObj.studios || [];
      
      const studio = studios.find((s: any) => s.id === studioId);
      if (studio) {
        return {
          id: studio.id,
          name: studio.name || 'Unknown Studio',
          slug: studio.slug || studio.id,
          avatarUrl: studio.profileImage || null
        };
      }
    }
  } catch (error) {
    console.error('Error getting studio info:', error);
  }
  return null;
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
      
      // Enhance bookings with studio information for artist dashboard
      const enhancedBookings = filteredBookings.map(booking => {
        const studioInfo = getStudioInfo(booking.studioId);
        return {
          ...booking,
          studio: studioInfo ? {
            id: studioInfo.id,
            name: studioInfo.name,
            slug: studioInfo.slug,
            avatarUrl: studioInfo.avatarUrl
          } : {
            id: booking.studioId,
            name: booking.studioName || 'Unknown Studio',
            slug: booking.studioId,
            avatarUrl: null
          }
        };
      });
      
      return NextResponse.json({ bookings: enhancedBookings }, { status: 200 });
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
          artistName: artistInfo?.displayName || booking.userName,
          artistSlug: artistInfo?.slug,
          artistProfilePicture: artistInfo?.avatarUrl  // ABSOLUTELY ensure avatarUrl is present
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