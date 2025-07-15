import { NextRequest, NextResponse } from 'next/server';
import { getActiveBookings } from '@/lib/bookings/activeBookings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    
    if (!studioId) {
      return NextResponse.json(
        { error: 'Studio ID is required' },
        { status: 400 }
      );
    }
    
    // Use unified activeBookings approach
    const bookings = await getActiveBookings(studioId);
    const now = new Date();
    
    const upcoming = bookings.filter((b: any) => b.endDateTime > now);
    const past = bookings.filter((b: any) => b.endDateTime <= now);
    const pending = bookings.filter((b: any) => b.status === 'pending');
    
    return NextResponse.json({ pending, upcoming, past }, { status: 200 });
  } catch (error) {
    console.error('GET studio dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 