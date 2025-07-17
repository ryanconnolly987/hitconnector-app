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

function saveUsers(users: User[]): void {
  try {
    const dataDir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('❌ Error saving users file:', error);
  }
}

function findStudioUser(studioId: string): User | null {
  const users = getUsers();
  return users.find(user => user.role === 'studio' && user.studioId === studioId) || null;
}

// POST - Create setup intent for adding payment method
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🎯 [Studio Payment Methods] Creating setup intent...');
    
    const { id: studioId } = await params;
    
    if (!studioId) {
      console.log('❌ [Studio Payment Methods] Missing studioId');
      return NextResponse.json(
        { error: 'missing_studioId', message: 'Studio ID is required' },
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

    let stripeCustomerId = studioUser.stripeCustomerId;

    // Create or validate Stripe customer
    if (!stripeCustomerId) {
      console.log('🔄 [Studio Payment Methods] Creating Stripe customer for studio:', studioId);
      
      const customer = await stripe.customers.create({
        email: studioUser.email,
        name: studioUser.name,
        metadata: {
          studioId: studioId,
          userId: studioUser.id
        }
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      const users = getUsers();
      const userIndex = users.findIndex(u => u.id === studioUser.id);
      if (userIndex !== -1) {
        users[userIndex].stripeCustomerId = stripeCustomerId;
        saveUsers(users);
        console.log('✅ [Studio Payment Methods] Updated user with Stripe customer ID:', stripeCustomerId);
      }
    } else {
      // Validate existing customer ID by attempting to retrieve it
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (stripeError: any) {
        if (stripeError.code === 'resource_missing') {
          console.log('🔄 [Studio Payment Methods] Invalid customer ID, creating new customer:', stripeCustomerId);
          
          // Create new Stripe customer
          const customer = await stripe.customers.create({
            email: studioUser.email,
            name: studioUser.name,
            metadata: {
              studioId: studioId,
              userId: studioUser.id
            }
          });

          stripeCustomerId = customer.id;

          // Update user with new Stripe customer ID
          const users = getUsers();
          const userIndex = users.findIndex(u => u.id === studioUser.id);
          if (userIndex !== -1) {
            users[userIndex].stripeCustomerId = stripeCustomerId;
            saveUsers(users);
            console.log('✅ [Studio Payment Methods] Updated user with new Stripe customer ID:', stripeCustomerId);
          }
        } else {
          throw stripeError;
        }
      }
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    console.log('✅ [Studio Payment Methods] Setup intent created:', setupIntent.id);

    return NextResponse.json({
      clientSecret: setupIntent.client_secret
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [Studio Payment Methods] Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'stripe_setup_intent_failed', message: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}

// GET - List payment methods for studio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🎯 [Studio Payment Methods] Listing payment methods...');
    
    const { id: studioId } = await params;
    
    if (!studioId) {
      console.log('❌ [Studio Payment Methods] Missing studioId');
      return NextResponse.json(
        { error: 'missing_studioId', message: 'Studio ID is required' },
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

    let stripeCustomerId = studioUser.stripeCustomerId;

    if (!stripeCustomerId) {
      console.log('📝 [Studio Payment Methods] No Stripe customer ID for studio:', studioId);
      return NextResponse.json({ paymentMethods: [] });
    }

    let paymentMethods;
    try {
      // List payment methods
      paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card'
      });
    } catch (stripeError: any) {
      // Handle invalid customer error
      if (stripeError.code === 'resource_missing' && stripeError.param === 'customer') {
        console.log('🔄 [Studio Payment Methods] Invalid customer ID, creating new customer:', stripeCustomerId);
        
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: studioUser.email,
          name: studioUser.name,
          metadata: {
            studioId: studioId,
            userId: studioUser.id
          }
        });

        stripeCustomerId = customer.id;

        // Update user with new Stripe customer ID
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === studioUser.id);
        if (userIndex !== -1) {
          users[userIndex].stripeCustomerId = stripeCustomerId;
          saveUsers(users);
          console.log('✅ [Studio Payment Methods] Updated user with new Stripe customer ID:', stripeCustomerId);
        }

        // Return empty payment methods for new customer
        return NextResponse.json({ paymentMethods: [] });
      } else {
        // Re-throw other Stripe errors
        throw stripeError;
      }
    }

    // Format payment methods according to DTO
    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '0000',
      expMonth: pm.card?.exp_month || 0,
      expYear: pm.card?.exp_year || 0
    }));

    console.log('✅ [Studio Payment Methods] Found', formattedPaymentMethods.length, 'payment methods');

    return NextResponse.json({
      paymentMethods: formattedPaymentMethods
    });

  } catch (error) {
    console.error('❌ [Studio Payment Methods] Error listing payment methods:', error);
    return NextResponse.json(
      { error: 'stripe_list_failed', message: 'Failed to list payment methods' },
      { status: 500 }
    );
  }
} 