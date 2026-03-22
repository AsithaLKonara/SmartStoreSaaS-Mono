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
        <h3 className="text-2xl font-bold mb-2 text-white">Get Started Today</h3>
        <p className="text-gray-400">
          Choose how you&apos;d like to begin your SmartStore journey
        </p>
      </div>

      {/* Trial Option */}
      <div
        className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
          selectedOption === 'trial'
            ? 'border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/10'
            : 'border-white/10 bg-white/5 hover:border-emerald-500/30'
        }`}
        onClick={() => setSelectedOption('trial')}
      >
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl transition-colors ${
            selectedOption === 'trial' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-emerald-500'
          }`}>
            <Zap className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-bold text-white">Start Free Trial</h4>
              {selectedOption === 'trial' && (
                <div className="bg-emerald-500 rounded-full p-1 shadow-lg shadow-emerald-500/20">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <p className="text-gray-400 mb-6 text-sm">
              Try all features free for 14 days. No credit card required.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Full access to {data.packageName} plan</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>14 days free trial</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-xs text-emerald-400">
                <span className="font-black mr-1">RECOMMENDED:</span> Perfect for exploring the platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Option */}
      <div
        className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
          selectedOption === 'payment'
            ? 'border-primary bg-primary/10 shadow-xl shadow-primary/10'
            : 'border-white/10 bg-white/5 hover:border-primary/30'
        }`}
        onClick={() => setSelectedOption('payment')}
      >
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl transition-colors ${
            selectedOption === 'payment' ? 'bg-primary text-white' : 'bg-white/5 text-primary'
          }`}>
            <CreditCard className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-bold text-white">Start with Payment</h4>
              {selectedOption === 'payment' && (
                <div className="bg-primary rounded-full p-1 shadow-lg shadow-primary/20">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <p className="text-gray-400 mb-6 text-sm">
              Subscribe now and get started immediately with full features.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-primary" />
                <span>Immediate full access</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-primary" />
                <span>LKR {data.packagePrice?.toLocaleString()}/month</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-primary" />
                <span>Priority onboarding</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>

            {selectedOption === 'payment' && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-xs text-gray-400 mb-3 uppercase font-bold tracking-wider">Payment Method:</p>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Secure payment via Stripe</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security & Benefits */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-white mb-2">Your data is secure</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              We use industry-standard encryption to protect your information. 
              Your payment details are securely processed and never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap className="w-16 h-16 text-primary" />
        </div>
        <h4 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
          Selection Summary
        </h4>
        <div className="space-y-3 text-sm relative z-10">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-gray-400">Organization:</span>
            <span className="font-bold text-white">{data.businessName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-gray-400">Selected Plan:</span>
            <span className="font-bold text-primary">{data.packageName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-gray-400">Total Price:</span>
            <span className="font-bold text-white">
              LKR {data.packagePrice?.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">/month</span>
            </span>
          </div>
          {selectedOption === 'trial' && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-400">Initial Payment:</span>
              <span className="font-black text-emerald-400 flex items-center gap-1 uppercase tracking-tighter">
                <Calendar className="w-4 h-4" />
                LKR 0.00 (14 Days Free)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
          className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl px-8"
        >
          Previous
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl px-12 py-6 font-bold glow"
        >
          {isLoading ? 'Processing...' : 'Complete Registration'}
        </Button>
      </div>

      <p className="text-center text-xs text-gray-600 mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}

