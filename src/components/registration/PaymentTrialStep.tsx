'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, Check, Shield, Zap } from 'lucide-react';

interface PaymentTrialStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrevious: () => void;
  isLoading?: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function PaymentTrialStep({ 
  data, 
  onNext, 
  onPrevious, 
  isLoading 
}: PaymentTrialStepProps) {
  const [selectedOption, setSelectedOption] = useState<'trial' | 'payment'>(
    data.paymentMethod || 'trial'
  );

  const handleContinue = () => {
    onNext({
      paymentMethod: selectedOption,
      paymentDetails: selectedOption === 'payment' ? {
        method: 'card',
        provider: 'stripe',
      } : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Get Started Today</h3>
        <p className="text-gray-600">
          Choose how you&apos;d like to begin your SmartStore journey
        </p>
      </div>

      {/* Trial Option */}
      <div
        className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
          selectedOption === 'trial'
            ? 'border-green-600 bg-green-50 shadow-lg'
            : 'border-gray-200 hover:border-green-300'
        }`}
        onClick={() => setSelectedOption('trial')}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            selectedOption === 'trial' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
          }`}>
            <Zap className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-bold">Start Free Trial</h4>
              {selectedOption === 'trial' && (
                <div className="bg-green-600 rounded-full p-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">
              Try all features free for 14 days. No credit card required.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Full access to {data.packageName} plan</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>14 days free trial</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Cancel anytime during trial</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Setup assistance included</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Recommended:</strong> Perfect for trying out all features before committing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Option */}
      <div
        className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
          selectedOption === 'payment'
            ? 'border-blue-600 bg-blue-50 shadow-lg'
            : 'border-gray-200 hover:border-blue-300'
        }`}
        onClick={() => setSelectedOption('payment')}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            selectedOption === 'payment' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
          }`}>
            <CreditCard className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-bold">Start with Payment</h4>
              {selectedOption === 'payment' && (
                <div className="bg-blue-600 rounded-full p-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">
              Subscribe now and get started immediately with full features.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Immediate full access</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-blue-600" />
                <span>LKR {data.packagePrice?.toLocaleString()}/month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Priority onboarding support</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Dedicated account setup</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Cancel anytime</span>
              </div>
            </div>

            {selectedOption === 'payment' && (
              <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">Payment will be processed after submission:</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment via Stripe</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security & Benefits */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Your data is secure</h4>
            <p className="text-sm text-gray-600">
              We use industry-standard encryption to protect your information. 
              Your payment details are securely processed and never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Your Selection Summary:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-800">Business:</span>
            <span className="font-medium text-blue-900">{data.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-800">Plan:</span>
            <span className="font-medium text-blue-900">{data.packageName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-800">Price:</span>
            <span className="font-medium text-blue-900">
              LKR {data.packagePrice?.toLocaleString()}/month
            </span>
          </div>
          {selectedOption === 'trial' && (
            <div className="flex justify-between items-center pt-2 border-t border-blue-300">
              <span className="text-blue-800">Trial Period:</span>
              <span className="font-bold text-green-600 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                14 days free
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
        >
          Previous
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={isLoading}
          className="px-8"
        >
          {isLoading ? 'Processing...' : 'Complete Registration'}
        </Button>
      </div>

      <p className="text-center text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}

