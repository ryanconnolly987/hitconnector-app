import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  studioId?: string;
  stripeCustomerId?: string;
}

function getUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('❌ Error reading users file:', error);
    return [];
  }
}

function findStudioUser(studioId: string): User | null {
  const users = getUsers();
  return users.find(user => user.role === 'studio' && user.studioId === studioId) || null;
}

// DELETE - Detach payment method from studio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pmId: string }> }
) {
  try {
    console.log('🎯 [Studio Payment Methods] Deleting payment method...');
    
    const { id: studioId, pmId } = await params;
    
    if (!studioId) {
      console.log('❌ [Studio Payment Methods] Missing studioId');
      return NextResponse.json(
        { error: 'missing_studioId', message: 'Studio ID is required' },
        { status: 422 }
      );
    }

    if (!pmId) {
      console.log('❌ [Studio Payment Methods] Missing payment method ID');
      return NextResponse.json(
        { error: 'missing_pmId', message: 'Payment method ID is required' },
        { status: 422 }
      );
    }

    // Find the studio user
    const studioUser = findStudioUser(studioId);
    if (!studioUser) {
      console.log('❌ [Studio Payment Methods] Studio user not found for ID:', studioId);
      return NextResponse.json(
        { error: 'studio_not_found', message: 'Studio not found' },
        { status: 404 }
      );
    }

    if (!studioUser.stripeCustomerId) {
      console.log('❌ [Studio Payment Methods] No Stripe customer ID for studio:', studioId);
      return NextResponse.json(
        { error: 'no_stripe_customer', message: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Verify payment method belongs to this customer
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(pmId);
      
      if (paymentMethod.customer !== studioUser.stripeCustomerId) {
        console.log('❌ [Studio Payment Methods] Payment method does not belong to studio:', pmId, studioId);
        return NextResponse.json(
          { error: 'payment_method_not_found', message: 'Payment method not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.log('❌ [Studio Payment Methods] Payment method not found:', pmId);
      return NextResponse.json(
        { error: 'payment_method_not_found', message: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(pmId);

    console.log('✅ [Studio Payment Methods] Payment method detached:', pmId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully'
    });

  } catch (error) {
    console.error('❌ [Studio Payment Methods] Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'stripe_detach_failed', message: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
} 