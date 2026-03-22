'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Rocket } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  limitations?: string[];
}

interface PackageSelectionStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrevious: () => void;
  isLoading?: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const packages: Package[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 2999,
    period: '/month',
    icon: <Zap className="w-8 h-8" />,
    features: [
      'Up to 100 products',
      'Up to 500 orders/month',
      'Basic analytics',
      'Email support',
      'Mobile app access',
      'Basic integrations',
    ],
    limitations: [
      'Single store',
      'Basic features only',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 5999,
    period: '/month',
    icon: <Crown className="w-8 h-8" />,
    popular: true,
    features: [
      'Unlimited products',
      'Unlimited orders',
      'Advanced analytics',
      'Priority support',
      'Mobile + Web apps',
      'All integrations',
      'Multi-channel selling',
      'Inventory management',
      'Customer portal',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 12999,
    period: '/month',
    icon: <Rocket className="w-8 h-8" />,
    features: [
      'Everything in Professional',
      'Unlimited stores',
      'White-label solution',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      'API access',
      'Advanced security',
      'Custom training',
      'SLA guarantee',
    ],
  },
];

export function PackageSelectionStep({ 
  data, 
  onNext, 
  onPrevious, 
  isLoading 
}: PackageSelectionStepProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>(
    data.packageId || ''
  );
  const [error, setError] = useState('');

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg.id);
    setError('');
  };

  const handleContinue = () => {
    if (!selectedPackage) {
      setError('Please select a package to continue');
      return;
    }

    const selected = packages.find(pkg => pkg.id === selectedPackage);
    if (selected) {
      onNext({
        packageId: selected.id,
        packageName: selected.name,
        packagePrice: selected.price,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2 text-white">Choose Your Plan</h3>
        <p className="text-gray-400">
          Select the package that best fits your business needs
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/20">
          <Check className="w-4 h-4" />
          14-day free trial • No credit card required
        </div>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
              selectedPackage === pkg.id
                ? 'border-primary bg-primary/10 shadow-xl shadow-primary/10 scale-[1.03]'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            } ${pkg.popular ? 'ring-2 ring-primary/50' : ''}`}
            onClick={() => handleSelectPackage(pkg)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider glow">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-4">
              <div className={`inline-flex p-4 rounded-2xl mb-4 transition-colors ${
                selectedPackage === pkg.id ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'
              }`}>
                {pkg.icon}
              </div>
              <h4 className="text-xl font-bold mb-2 text-white">{pkg.name}</h4>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">LKR {pkg.price.toLocaleString()}</span>
                <span className="text-gray-500 text-sm ml-1">{pkg.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                  <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    selectedPackage === pkg.id ? 'text-primary' : 'text-emerald-500'
                  }`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {pkg.limitations && pkg.limitations.length > 0 && (
              <div className="border-t border-white/5 pt-4 mt-4">
                <p className="text-[10px] text-gray-600 uppercase font-bold mb-2">Notice:</p>
                <ul className="space-y-1">
                  {pkg.limitations.map((limitation, index) => (
                    <li key={index} className="text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-gray-700" /> {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPackage === pkg.id && (
              <div className="absolute top-4 right-4">
                <div className="bg-primary rounded-full p-1 shadow-lg shadow-primary/20">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-center text-red-500 text-sm">{error}</p>
      )}

      {/* Additional Information */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-12 bg-radial-at-t from-primary/5 to-transparent">
        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          Standard in all plans:
        </h4>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            SSL Certificate
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Daily Backups
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            99.9% Uptime
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            Vulnerability Scans
          </li>
        </ul>
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
          disabled={isLoading || !selectedPackage}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl px-12 py-6 font-bold glow"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>
      </div>

      <p className="text-center text-sm text-gray-600 mt-4">
        You can change or cancel your plan anytime
      </p>
    </div>
  );
}

