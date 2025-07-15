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
    
    // Compute monthly revenue
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const revenue = bookings
      .filter((b: any) => b.startDateTime >= monthStart && b.startDateTime <= monthEnd)
      .reduce((sum: number, b: any) => sum + b.totalCost, 0);
    
    return NextResponse.json({ pending, upcoming, past, revenue }, { status: 200 });
  } catch (error) {
    console.error('GET studio dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 