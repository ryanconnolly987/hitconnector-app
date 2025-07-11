import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { findUserById } from '@/lib/user-store';

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

    if (user.role !== 'studio') {
      return NextResponse.json(
        { error: 'Only studio accounts can create Connect accounts' },
        { status: 400 }
      );
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default to US, can be expanded later
      email: user.email,
      metadata: {
        userId: user.id,
        userRole: user.role,
        studioId: user.studioId || ''
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/studio-dashboard/profile?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/studio-dashboard/profile?connected=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    console.error('Error creating Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to create Connect account' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        country: account.country,
        email: account.email
      }
    });

  } catch (error) {
    console.error('Error retrieving Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Connect account' },
      { status: 500 }
    );
  }
} 