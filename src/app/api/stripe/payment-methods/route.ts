import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { findUserById } from '@/lib/user-store';

// Mock payment methods for test mode - In production, this would integrate with Stripe API
const mockPaymentMethods = [
  {
    id: 'pm_test_card_visa',
    brand: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2027
  },
  {
    id: 'pm_test_card_mastercard', 
    brand: 'Mastercard',
    last4: '4444',
    expMonth: 8,
    expYear: 2026
  }
];

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

    // In test mode, return mock payment methods for any valid user ID
    // In production, this would query Stripe for actual customer payment methods
    return NextResponse.json({
      hasPaymentMethod: mockPaymentMethods.length > 0,
      paymentMethods: mockPaymentMethods
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, paymentMethodId } = body;

    if (!userId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'User ID and payment method ID are required' },
        { status: 400 }
      );
    }

    // In test mode, simulate adding a payment method
    // In production, this would create a Stripe SetupIntent and attach the payment method
    const newPaymentMethod = {
      id: `pm_test_${Date.now()}`,
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2027
    };

    return NextResponse.json({
      success: true,
      paymentMethod: newPaymentMethod
    });

  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 