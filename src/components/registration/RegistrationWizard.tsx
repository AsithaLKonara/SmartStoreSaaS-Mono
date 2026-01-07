'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BusinessInfoStep } from './BusinessInfoStep';
import { PackageSelectionStep } from './PackageSelectionStep';
import { PaymentTrialStep } from './PaymentTrialStep';
import { logger } from '@/lib/logger';

interface RegistrationData {
  // Step 1: Business Information
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  industry: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  
  // Step 2: Package Selection
  packageId: string;
  packageName: string;
  packagePrice: number;
  
  // Step 3: Payment/Trial Decision
  paymentMethod: 'trial' | 'payment';
  paymentDetails?: {
    method: string;
    provider: string;
  };
}

const steps = [
  {
    id: 1,
    title: 'Business Information',
    description: 'Tell us about your business',
    component: BusinessInfoStep,
  },
  {
    id: 2,
    title: 'Select Package',
    description: 'Choose your subscription plan',
    component: PackageSelectionStep,
  },
  {
    id: 3,
    title: 'Payment & Trial',
    description: 'Start your journey with us',
    component: PaymentTrialStep,
  },
];

export function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    industry: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Sri Lanka',
      postalCode: '',
    },
    packageId: '',
    packageName: '',
    packagePrice: 0,
    paymentMethod: 'trial',
  });
  const [isLoading, setIsLoading] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  const handleNext = (stepData: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/registration/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        // Redirect to success page or show success message
        window.location.href = '/registration/success';
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      logger.error({
        message: 'Registration error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { step: currentStep }
      });
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join SmartStore SaaS
          </h1>
          <p className="text-lg text-gray-600">
            Start your e-commerce journey with our comprehensive platform
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  currentStep >= step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm font-bold">
                  {step.id}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-center">
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent
              data={registrationData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
              isFirstStep={currentStep === 1}
              isLastStep={currentStep === steps.length}
            />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-8"
          >
            Previous
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Need help? Contact our support team
            </p>
            <a
              href="mailto:support@smartstore.com"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              support@smartstore.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


