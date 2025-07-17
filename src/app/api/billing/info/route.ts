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

    // Call the new Stripe payment methods API
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://your-production-domain.com'
      : 'http://localhost:3000';

    try {
      const paymentMethodsResponse = await fetch(
        `${baseUrl}/api/studios/${studioId}/stripe/payment-methods`
      );
      
      let paymentMethods = [];
      if (paymentMethodsResponse.ok) {
        const data = await paymentMethodsResponse.json();
        paymentMethods = data.paymentMethods || [];
      } else {
        console.log('⚠️ [Billing Info] Could not fetch payment methods:', paymentMethodsResponse.status);
      }

      return NextResponse.json({
        subscription: null, // No subscriptions for now since site is free for studios
        paymentMethods
      });

    } catch (fetchError) {
      console.error('❌ [Billing Info] Error calling payment methods API:', fetchError);
      
      // Fallback to empty array if the new API is not available
      return NextResponse.json({
        subscription: null,
        paymentMethods: []
      });
    }

  } catch (error) {
    console.error('❌ [Billing Info] Error fetching billing info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 