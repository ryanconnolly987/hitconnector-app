import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { stripe, calculateTotalWithFee, dollarsToCents } from '@/lib/stripe';
import { findUserById } from '@/lib/user-store';

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json'); // Updated to use unified bookings file
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const PROFILES_FILE = path.join(process.cwd(), 'data', 'user-profiles.json');

interface BookingRequest {
  id: string;
  studioId: string;
  studioName: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  hourlyRate: number;
  totalCost: number;
  baseAmount: number;
  companyFee: number;
  totalAmount: number;
  message: string;
  staffId?: string | null;
  staffName?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED'; // Updated to use unified status
  paymentIntentId?: string;
  paymentStatus?: 'authorized' | 'captured' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// Helper functions to read/write unified bookings data
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

// Helper functions for user data
function getUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.users || [];
    }
  } catch (error) {
    console.error('Error reading users file:', error);
  }
  return [];
}

function getProfiles(): any[] {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.profiles || [];
    }
  } catch (error) {
    console.error('Error reading profiles file:', error);
  }
  return [];
}

function getUserData(userId: string): any {
  const users = getUsers();
  const profiles = getProfiles();

  const user = users.find((u: any) => u.id === userId);
  const profile = profiles.find((p: any) => p.userId === userId);

  if (profile) {
    return {
      id: userId,
      name: profile.name || user?.name || 'Unknown',
      email: user?.email || 'unknown@example.com',
      profileImage: profile.profileImage,
      slug: profile.slug
    };
  }

  if (user) {
    return {
      id: userId,
      name: user.name || 'Unknown',
      email: user.email || 'unknown@example.com',
      profileImage: null,
      slug: null
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    const userId = searchParams.get('userId');

    const bookings = getBookings();

    if (studioId) {
      // Return pending booking requests for studio dashboard
      const pendingBookings = bookings.filter(booking => 
        booking.studioId === studioId && 
        (booking.status === 'pending' || booking.status === 'PENDING')
      );

      // Enhance with artist data
      const enhancedBookings = pendingBookings.map(booking => {
        const userData = getUserData(booking.userId);
        return {
          ...booking,
          artistId: booking.userId,
          artistName: userData?.name || booking.userName,
          artistSlug: userData?.slug,
          artistProfilePicture: userData?.profileImage
        };
      });

      return NextResponse.json({ bookingRequests: enhancedBookings });
    }

    if (userId) {
      // Return user's booking requests
      const userBookings = bookings.filter(booking => booking.userId === userId);
      return NextResponse.json({ bookingRequests: userBookings });
    }

    // Return all booking requests
    return NextResponse.json({ bookingRequests: bookings });

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    
    console.log('📝 Creating booking request:', bookingData);
    
    // Validate required fields
    const requiredFields = ['studioId', 'roomId', 'userId', 'date', 'startTime', 'endTime'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Get user for Stripe customer ID
    const user = findUserById(bookingData.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User does not have a Stripe customer ID' },
        { status: 400 }
      );
    }

    // Get user's default payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      return NextResponse.json(
        { error: 'No payment method found for user' },
        { status: 400 }
      );
    }

    const defaultPaymentMethod = paymentMethods.data[0];

    // Calculate amounts with company fee
    const baseAmount = dollarsToCents(bookingData.totalCost);
    const amounts = calculateTotalWithFee(baseAmount);

    // Create PaymentIntent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amounts.totalAmount,
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: defaultPaymentMethod.id,
      capture_method: 'manual',
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/booking-complete`,
      metadata: {
        userId: bookingData.userId,
        studioId: bookingData.studioId,
        roomId: bookingData.roomId,
        baseAmount: amounts.baseAmount.toString(),
        companyFee: amounts.companyFee.toString(),
        totalAmount: amounts.totalAmount.toString()
      }
    });

    // Create booking with PENDING status in unified bookings file
    const bookingRequest: BookingRequest = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studioId: bookingData.studioId,
      studioName: bookingData.studioName,
      roomId: bookingData.roomId,
      roomName: bookingData.roomName,
      userId: bookingData.userId,
      userName: bookingData.userName,
      userEmail: bookingData.userEmail,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      duration: bookingData.duration,
      hourlyRate: bookingData.hourlyRate,
      totalCost: bookingData.totalCost,
      baseAmount: amounts.baseAmount / 100, // Convert back to dollars for storage
      companyFee: amounts.companyFee / 100,
      totalAmount: amounts.totalAmount / 100,
      message: bookingData.message || '',
      staffId: bookingData.staffId || null,
      staffName: bookingData.staffName || null,
      status: 'PENDING', // Ensure new bookings start with PENDING status
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'authorized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to unified bookings file
    const bookings = getBookings();
    bookings.push(bookingRequest);
    saveBookings(bookings);

    console.log('💳 PaymentIntent created:', paymentIntent.id);
    console.log('✅ Booking request created:', bookingRequest.id);

    return NextResponse.json({
      success: true,
      bookingRequest: bookingRequest,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Error creating booking request:', error);
    return NextResponse.json(
      { error: 'Failed to create booking request' },
      { status: 500 }
    );
  }
} 