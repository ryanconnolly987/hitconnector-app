"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

interface AddCardFormProps {
  onSuccess: () => void;
}

function AddCardForm({ onSuccess }: AddCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    const createSetupIntent = async () => {
      if (!user?.id) return;

      try {
        // First ensure user has a Stripe customer
        const customerResponse = await fetch('/api/stripe/create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!customerResponse.ok) {
          throw new Error('Failed to create customer');
        }

        // Create setup intent
        const setupResponse = await fetch('/api/stripe/setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        const setupData = await setupResponse.json();
        if (setupData.success) {
          setClientSecret(setupData.clientSecret);
        } else {
          throw new Error(setupData.error);
        }
      } catch (error) {
        console.error('Error setting up payment:', error);
        toast({
          title: 'Error',
          description: 'Failed to set up payment. Please try again.',
          variant: 'destructive',
        });
      }
    };

    createSetupIntent();
  }, [user?.id, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setLoading(false);
      return;
    }

    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: user?.name,
          email: user?.email,
        },
      },
    });

    if (error) {
      console.error('Error confirming card setup:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment method.',
        variant: 'destructive',
      });
    } else {
      console.log('Setup successful:', setupIntent);
      toast({
        title: 'Success',
        description: 'Payment method saved successfully!',
      });
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || loading || !clientSecret}
        className="w-full"
      >
        {loading ? 'Saving...' : 'Save Payment Method'}
      </Button>
    </form>
  );
}

export default function AddCardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSuccess = () => {
    // Redirect back to previous page or booking flow
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    router.push(returnUrl || '/');
  };

  const handleBack = () => {
    router.back();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to add a payment method.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Payment Method
            </CardTitle>
            <CardDescription>
              Add a payment method to complete your bookings. Your card will be securely stored and only charged when studios accept your booking requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <AddCardForm onSuccess={handleSuccess} />
            </Elements>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-sm text-gray-600 space-y-2">
        <p>🔒 Your payment information is encrypted and secure</p>
        <p>💳 We use Stripe to process payments safely</p>
        <p>🚫 You won't be charged until a studio accepts your booking</p>
      </div>
    </div>
  );
} 