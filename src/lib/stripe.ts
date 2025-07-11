import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// Client-side Stripe instance
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Company fee configuration
export const COMPANY_FEE_PERCENTAGE = parseFloat(process.env.COMPANY_FEE_PERCENTAGE || '3') / 100;

// Helper function to calculate total amount with company fee
export function calculateTotalWithFee(baseAmount: number): {
  baseAmount: number;
  companyFee: number;
  totalAmount: number;
} {
  const companyFee = Math.round(baseAmount * COMPANY_FEE_PERCENTAGE);
  const totalAmount = baseAmount + companyFee;
  
  return {
    baseAmount,
    companyFee,
    totalAmount
  };
}

// Helper function to convert dollars to cents for Stripe
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Helper function to convert cents to dollars for display
export function centsToDollars(cents: number): number {
  return cents / 100;
} 