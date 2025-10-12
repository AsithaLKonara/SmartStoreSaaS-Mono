'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  orderId: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function StripePaymentForm({
  orderId,
  amount,
  currency = 'usd',
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create payment intent
      const response = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            orderId,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe Checkout or use Stripe Elements
      // For now, we'll show the client secret
      toast.success('Payment intent created! Client Secret: ' + data.clientSecret.substring(0, 20) + '...');
      
      if (onSuccess) {
        onSuccess(data.paymentIntentId);
      }

      // In a real implementation, you would:
      // 1. Use Stripe Elements to collect card details
      // 2. Confirm the payment with stripe.confirmCardPayment()
      // 3. Handle the result
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
      
      if (onError) {
        onError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pay with Stripe
            </h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currency.toUpperCase()} {amount.toLocaleString()}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
            <span className="font-medium text-gray-900 dark:text-white">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
            <span className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Powered by:</span>
            <span className="font-medium text-gray-900 dark:text-white">Stripe</span>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {currency.toUpperCase()} {amount.toLocaleString()}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Secure payment powered by Stripe. Your payment information is encrypted.
        </p>
      </div>

      {/* In production, add Stripe Elements here for card input */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> This creates a payment intent. In production, integrate Stripe Elements 
          to collect card details and confirm payment.
        </p>
      </div>
    </div>
  );
}

