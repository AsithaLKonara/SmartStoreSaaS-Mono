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
        <h3 className="text-2xl font-bold mb-2">Choose Your Plan</h3>
        <p className="text-gray-600">
          Select the package that best fits your business needs
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
          <Check className="w-4 h-4" />
          14-day free trial • No credit card required
        </div>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
              selectedPackage === pkg.id
                ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            } ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleSelectPackage(pkg)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-4">
              <div className={`inline-flex p-3 rounded-full mb-3 ${
                selectedPackage === pkg.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {pkg.icon}
              </div>
              <h4 className="text-xl font-bold mb-2">{pkg.name}</h4>
              <div className="mb-4">
                <span className="text-3xl font-bold">LKR {pkg.price.toLocaleString()}</span>
                <span className="text-gray-600 text-sm">{pkg.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    selectedPackage === pkg.id ? 'text-blue-600' : 'text-green-600'
                  }`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {pkg.limitations && pkg.limitations.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-500 mb-2">Limitations:</p>
                <ul className="space-y-1">
                  {pkg.limitations.map((limitation, index) => (
                    <li key={index} className="text-xs text-gray-500">
                      • {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPackage === pkg.id && (
              <div className="absolute top-4 right-4">
                <div className="bg-blue-600 rounded-full p-1">
                  <Check className="w-5 h-5 text-white" />
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-900 mb-2">What&apos;s included in all plans:</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            SSL certificate
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Daily backups
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            99.9% uptime
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Regular updates
          </li>
        </ul>
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
          disabled={isLoading || !selectedPackage}
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500">
        You can change or cancel your plan anytime
      </p>
    </div>
  );
}

