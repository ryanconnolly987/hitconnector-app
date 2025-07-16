import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUserStripeCustomerId } from '@/lib/user-store';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('🏪 [Create-Customer] POST request received');

    const { userId } = await request.json();

    if (!userId) {
      console.error('❌ [Create-Customer] Missing userId in request');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Create-Customer] Processing request for user: ${userId}`);

    // Get user from database
    const user = findUserById(userId);
    if (!user) {
      console.error(`❌ [Create-Customer] User not found: ${userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      console.log(`✅ [Create-Customer] User ${userId} already has Stripe customer: ${user.stripeCustomerId}`);
      return NextResponse.json({
        success: true,
        customerId: user.stripeCustomerId
      });
    }

    console.log(`🔧 [Create-Customer] Creating new Stripe customer for user: ${userId}`);

    // Create Stripe customer with error handling
    let customer;
    try {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
          role: user.role
        }
      });
    } catch (stripeError) {
      console.error('❌ [Create-Customer] Stripe API error creating customer:', stripeError);
      return NextResponse.json(
        { error: 'Failed to create customer profile. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`💳 [Create-Customer] Stripe customer created: ${customer.id}`);

    // Update user with Stripe customer ID
    try {
      updateUserStripeCustomerId(userId, customer.id);
      console.log(`✅ [Create-Customer] Updated user ${userId} with customer ID: ${customer.id}`);
    } catch (updateError) {
      console.error('❌ [Create-Customer] Error updating user with customer ID:', updateError);
      // Customer was created successfully, so return success even if local update failed
      // The customer ID can be retrieved from Stripe if needed
    }

    return NextResponse.json({
      success: true,
      customerId: customer.id
    });

  } catch (error) {
    console.error('❌ [Create-Customer] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe customer' },
      { status: 500 }
    );
  }
} 