import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { stripe, calculateTotalWithFee, dollarsToCents } from '@/lib/stripe';
import { findUserById } from '@/lib/user-store';

const BOOKING_REQUESTS_FILE = path.join(process.cwd(), 'data', 'booking-requests.json');

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
  status: 'pending' | 'confirmed' | 'rejected';
  paymentIntentId?: string;
  paymentStatus?: 'authorized' | 'captured' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(BOOKING_REQUESTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read booking requests from file
function getBookingRequests(): BookingRequest[] {
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

// Write booking requests to file
function saveBookingRequests(bookingRequests: BookingRequest[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(BOOKING_REQUESTS_FILE, JSON.stringify({ bookingRequests }, null, 2));
  } catch (error) {
    console.error('Error saving booking requests file:', error);
    throw new Error('Failed to save booking request data');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get('studioId');
    const userId = searchParams.get('userId');
    
    const bookingRequests = getBookingRequests();
    
    // Filter by studioId or userId if provided
    let filteredRequests = bookingRequests;
    if (studioId) {
      filteredRequests = filteredRequests.filter(req => req.studioId === studioId);
    }
    if (userId) {
      filteredRequests = filteredRequests.filter(req => req.userId === userId);
    }
    
    return NextResponse.json({ bookingRequests: filteredRequests }, { status: 200 });
  } catch (error) {
    console.error('GET booking-requests error:', error);
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

    // Create booking request with payment intent
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
      status: 'pending',
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'authorized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save booking request
    const bookingRequests = getBookingRequests();
    bookingRequests.push(bookingRequest);
    saveBookingRequests(bookingRequests);
    
    console.log('✅ Booking request created:', bookingRequest.id);
    console.log('💳 PaymentIntent created:', paymentIntent.id);
    
    return NextResponse.json({
      success: true,
      booking: bookingRequest,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Error creating booking request:', error);
    return NextResponse.json(
      { error: 'Failed to create booking request' },
      { status: 500 }
    );
  }
} 