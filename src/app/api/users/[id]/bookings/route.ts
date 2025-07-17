import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const STUDIOS_FILE = path.join(process.cwd(), 'data', 'studios.json');

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
    console.error('❌ [User Bookings] Error getting studio info:', error);
  }
  return null;
}

// Read bookings from file
function getBookings(): any[] {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.bookings || [];
  } catch (error) {
    console.error('❌ [User Bookings] Error reading bookings file:', error);
    return [];
  }
}

// GET /api/users/[id]/bookings - Get bookings for artist with studio information  
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    console.log(`🔍 [User Bookings] Fetching bookings for user: ${userId}`);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all bookings for this artist - only confirmed/completed bookings
    const allBookings = getBookings();
    const artistBookings = allBookings.filter(booking => 
      booking.userId === userId && 
      (booking.status === 'CONFIRMED' || booking.status === 'confirmed' || 
       booking.status === 'COMPLETED' || booking.status === 'completed')
    );

    console.log(`✅ [User Bookings] Found ${artistBookings.length} confirmed bookings for user ${userId}`);

    // Enhance bookings with studio information
    const enhancedBookings = artistBookings.map(booking => {
      const studioInfo = getStudioInfo(booking.studioId);
      
      // Parse the date and time for easier frontend handling
      const bookingDate = booking.date;
      const startTime = booking.startTime;
      const endTime = booking.endTime;
      
      return {
        id: booking.id,
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
        },
        date: bookingDate,
        start: startTime,
        end: endTime,
        startTime: startTime, // Keep both for backward compatibility
        endTime: endTime,
        status: booking.status.toLowerCase() === 'completed' ? 'confirmed' : 'confirmed' // Normalize status for frontend
      };
    });

    // Sort by date (newest first)
    const sortedBookings = enhancedBookings.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ bookings: sortedBookings });

  } catch (error) {
    console.error('❌ [User Bookings] Error fetching artist bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 