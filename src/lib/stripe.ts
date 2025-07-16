import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Validate required environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is not set');
  throw new Error('Stripe configuration error: STRIPE_SECRET_KEY is required');
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is not set');
  throw new Error('Stripe configuration error: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
}

// Server-side Stripe instance  
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-06-30.basil' as any, // Pin to stable version once available
  typescript: true,
});

// Client-side Stripe instance
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Company fee configuration
export const COMPANY_FEE_PERCENTAGE = parseFloat(process.env.COMPANY_FEE_PERCENTAGE || '3') / 100;

// Helper functions for payment calculations
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function calculateTotalWithFee(baseAmountCents: number): {
  baseAmount: number;
  companyFee: number;
  totalAmount: number;
} {
  const companyFeeCents = Math.round(baseAmountCents * COMPANY_FEE_PERCENTAGE);
  const totalAmountCents = baseAmountCents + companyFeeCents;
  
  return {
    baseAmount: baseAmountCents,
    companyFee: companyFeeCents,
    totalAmount: totalAmountCents,
  };
} 