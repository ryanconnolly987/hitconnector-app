import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/user-store';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Setup-Intent] POST request received');
    
    const { userId } = await request.json();

    // 1️⃣ Validate input
    if (!userId) {
      console.error('❌ [Setup-Intent] Missing userId in request');
      return NextResponse.json(
        { error: 'missing_userId' },
        { status: 422 }
      );
    }

    console.log(`🔍 [Setup-Intent] Processing request for user: ${userId}`);

    // 2️⃣ Fetch user and validate Stripe customer
    const user = findUserById(userId);
    if (!user) {
      console.error(`❌ [Setup-Intent] User not found: ${userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      console.error(`❌ [Setup-Intent] User ${userId} does not have Stripe customer ID`);
      return NextResponse.json(
        { error: 'missing_stripeCustomerId' },
        { status: 404 }
      );
    }

    console.log(`🔧 [Setup-Intent] Creating setup intent for customer: ${user.stripeCustomerId}`);

    // 3️⃣ Create Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    console.log(`✅ [Setup-Intent] Setup intent created: ${setupIntent.id}`);

    return NextResponse.json(
      { clientSecret: setupIntent.client_secret },
      { status: 201 }
    );

  } catch (err: any) {
    console.error('❌ [Setup-Intent] Error:', err);
    return NextResponse.json(
      { error: 'stripe_setup_intent_failed', message: err.message },
      { status: 500 }
    );
  }
} 