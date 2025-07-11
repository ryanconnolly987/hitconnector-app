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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all bookings for this user
    const allBookings = getBookings();
    
    // Filter bookings for this user that have been confirmed and payment captured
    const userTransactions = allBookings
      .filter((booking: any) => 
        booking.userId === userId && 
        booking.status === 'confirmed' &&
        booking.paymentStatus === 'captured'
      )
      .map((booking: any) => ({
        id: booking.id,
        studioName: booking.studioName,
        amount: booking.totalAmount || booking.totalCost,
        date: booking.date,
        createdAt: booking.confirmedAt || booking.createdAt,
        description: `Studio session at ${booking.studioName} - ${booking.roomName}`,
        paymentMethodLast4: '4242' // In production, this would come from Stripe
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      transactions: userTransactions,
      total: userTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)
    });

  } catch (error) {
    console.error('Error fetching billing transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 