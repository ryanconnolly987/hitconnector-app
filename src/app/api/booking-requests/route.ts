import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findUserById } from '@/lib/user-store';
import { artistBriefSelect, type ArtistBrief } from '@/lib/bookings/activeBookings';

// Import Stripe functions with error handling
let stripe: any = null;
let calculateTotalWithFee: any = null;
let dollarsToCents: any = null;

try {
  const stripeModule = require('@/lib/stripe');
  stripe = stripeModule.stripe;
  calculateTotalWithFee = stripeModule.calculateTotalWithFee;
  dollarsToCents = stripeModule.dollarsToCents;
} catch (error) {
  console.error('❌ [Booking-Requests] Stripe configuration error:', error);
  // Don't throw here - handle in the actual API call
}

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

// Helper function to get user data with profile information
function getUserData(userId: string): any {
  try {
    // Read users file
    const usersData = fs.readFileSync(USERS_FILE, 'utf8');
    const usersJson = JSON.parse(usersData);
    const user = usersJson.users?.find((u: any) => u.id === userId);
    
    if (!user) return null;
    
    // Read profiles file
    const profilesData = fs.readFileSync(PROFILES_FILE, 'utf8');
    const profilesJson = JSON.parse(profilesData);
    const profile = profilesJson.profiles?.find((p: any) => p.id === userId); // FIXED: Use correct lookup
    
    return {
      ...user,
      displayName: profile?.displayName || user.name,
      slug: profile?.slug,
      avatarUrl: profile?.avatarUrl
    };
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📥 [Booking-Requests] GET request received');
    
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
          artistName: userData?.displayName || booking.userName,
          artistSlug: userData?.slug,
          artistProfilePicture: userData?.avatarUrl  // ABSOLUTELY ensure avatarUrl is present
        };
      });

      console.log(`✅ [Booking-Requests] Returning ${enhancedBookings.length} pending bookings for studio ${studioId}`);
      return NextResponse.json({ bookingRequests: enhancedBookings });
    }

    if (userId) {
      // Return user's booking requests
      const userBookings = bookings.filter(booking => booking.userId === userId);
      console.log(`✅ [Booking-Requests] Returning ${userBookings.length} bookings for user ${userId}`);
      return NextResponse.json({ bookingRequests: userBookings });
    }

    // Return all booking requests
    console.log(`✅ [Booking-Requests] Returning ${bookings.length} total bookings`);
    return NextResponse.json({ bookingRequests: bookings });

  } catch (error) {
    console.error('❌ [Booking-Requests] Error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 [Booking-Requests] POST request received');
    
    // First check if Stripe is properly configured
    if (!stripe || !calculateTotalWithFee || !dollarsToCents) {
      console.error('❌ [Booking-Requests] Stripe configuration error - missing required functions');
      return NextResponse.json(
        { error: 'Payment system is temporarily unavailable. Please check environment configuration.' },
        { status: 503 }
      );
    }

    const bookingData = await request.json();
    console.log('📝 [Booking-Requests] Creating booking request:', {
      studioId: bookingData.studioId,
      userId: bookingData.userId,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime
    });
    
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
      console.error(`❌ [Booking-Requests] User not found: ${bookingData.userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      console.error(`❌ [Booking-Requests] User ${bookingData.userId} does not have Stripe customer ID`);
      return NextResponse.json(
        { error: 'User does not have a Stripe customer ID' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Booking-Requests] Getting payment methods for customer: ${user.stripeCustomerId}`);

    // Get user's default payment method with error handling
    let paymentMethods;
    try {
      paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });
    } catch (stripeError) {
      console.error('❌ [Booking-Requests] Stripe API error listing payment methods:', stripeError);
      return NextResponse.json(
        { error: 'Failed to access payment methods. Please check your payment setup.' },
        { status: 500 }
      );
    }

    if (paymentMethods.data.length === 0) {
      console.error(`❌ [Booking-Requests] No payment methods found for user ${bookingData.userId}`);
      return NextResponse.json(
        { error: 'No payment method found for user' },
        { status: 400 }
      );
    }

    const defaultPaymentMethod = paymentMethods.data[0];
    console.log(`💳 [Booking-Requests] Using payment method: ${defaultPaymentMethod.id}`);

    // Calculate amounts with company fee
    const baseAmount = dollarsToCents(bookingData.totalCost);
    const amounts = calculateTotalWithFee(baseAmount);

    console.log(`💰 [Booking-Requests] Payment calculation:`, {
      baseAmount: amounts.baseAmount,
      companyFee: amounts.companyFee,
      totalAmount: amounts.totalAmount
    });

    // Create PaymentIntent with manual capture and error handling
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
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
    } catch (stripeError) {
      console.error('❌ [Booking-Requests] Stripe PaymentIntent creation error:', stripeError);
      return NextResponse.json(
        { error: 'Failed to create payment authorization. Please check your payment method.' },
        { status: 500 }
      );
    }

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

    console.log('💳 [Booking-Requests] PaymentIntent created:', paymentIntent.id);
    console.log('✅ [Booking-Requests] Booking request created:', bookingRequest.id);

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
    console.error('❌ [Booking-Requests] Unexpected error in POST:', error);
    return NextResponse.json(
      { error: 'Failed to create booking request' },
      { status: 500 }
    );
  }
} 