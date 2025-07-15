import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { artistBriefSelect, type ArtistBrief } from '@/lib/bookings/activeBookings';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');
const BOOKING_REQUESTS_FILE = path.join(process.cwd(), 'data', 'booking-requests.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PROFILES_FILE = path.join(process.cwd(), 'data', 'user-profiles.json');

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // First check confirmed bookings
    const bookings = getBookings();
    let booking = bookings.find(b => b.id === bookingId);

    // If not found in confirmed bookings, check booking requests
    if (!booking) {
      const bookingRequests = getBookingRequests();
      booking = bookingRequests.find(r => r.id === bookingId);
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Enhance booking with artist profile data
    const artistInfo = getUserInfo(booking.userId);
    const enhancedBooking = {
      ...booking,
      artistId: booking.userId,
      artistName: artistInfo?.displayName || booking.userName,
      artistSlug: artistInfo?.slug,
      artistProfilePicture: artistInfo?.avatarUrl  // ABSOLUTELY ensure avatarUrl is present
    };

    return NextResponse.json(enhancedBooking);

  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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