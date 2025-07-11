import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { findUserById, updateUserStripeCustomerId } from '@/lib/user-store';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        customerId: user.stripeCustomerId
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
        role: user.role
      }
    });

    // Update user with Stripe customer ID
    updateUserStripeCustomerId(userId, customer.id);

    return NextResponse.json({
      success: true,
      customerId: customer.id
    });

  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe customer' },
      { status: 500 }
    );
  }
} 