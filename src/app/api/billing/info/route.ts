import { NextRequest, NextResponse } from 'next/server';

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

    // Mock payment methods data - in production would fetch from Stripe
    const mockPaymentMethods = [
      {
        id: 'pm_1234567890',
        brand: 'Visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2026
      }
    ];

    return NextResponse.json({
      subscription: null,
      paymentMethods: mockPaymentMethods
    });

  } catch (error) {
    console.error('Error fetching billing info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 