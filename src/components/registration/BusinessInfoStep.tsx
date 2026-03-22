'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onPrevious: () => void;
  isLoading?: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function BusinessInfoStep({ data, onNext, isLoading }: BusinessInfoStepProps) {
  const [formData, setFormData] = useState({
    businessName: data.businessName || '',
    contactName: data.contactName || '',
    email: data.email || '',
    phone: data.phone || '',
    businessType: data.businessType || 'retail',
    industry: data.industry || 'general',
    address: {
      street: data.address?.street || '',
      city: data.address?.city || '',
      state: data.address?.state || '',
      country: data.address?.country || 'Sri Lanka',
      postalCode: data.address?.postalCode || '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Business Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-gray-300">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Your Business Name"
              className={cn("bg-white/5 border-white/10 text-white placeholder:text-gray-600", errors.businessName ? 'border-red-500/50' : '')}
            />
            {errors.businessName && (
              <p className="text-sm text-red-500">{errors.businessName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-gray-300">Contact Person *</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => handleInputChange('contactName', e.target.value)}
              placeholder="Full Name"
              className={cn("bg-white/5 border-white/10 text-white placeholder:text-gray-600", errors.contactName ? 'border-red-500/50' : '')}
            />
            {errors.contactName && (
              <p className="text-sm text-red-500">{errors.contactName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
              className={cn("bg-white/5 border-white/10 text-white placeholder:text-gray-600", errors.email ? 'border-red-500/50' : '')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+94 XXX XXX XXX"
              className={cn("bg-white/5 border-white/10 text-white placeholder:text-gray-600", errors.phone ? 'border-red-500/50' : '')}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessType" className="text-gray-300">Business Type</Label>
            <select
              id="businessType"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
            >
              <option value="retail" className="bg-zinc-900">Retail</option>
              <option value="wholesale" className="bg-zinc-900">Wholesale</option>
              <option value="ecommerce" className="bg-zinc-900">E-Commerce</option>
              <option value="manufacturing" className="bg-zinc-900">Manufacturing</option>
              <option value="services" className="bg-zinc-900">Services</option>
              <option value="other" className="bg-zinc-900">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-gray-300">Industry</Label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-white"
            >
              <option value="general" className="bg-zinc-900">General</option>
              <option value="fashion" className="bg-zinc-900">Fashion & Apparel</option>
              <option value="electronics" className="bg-zinc-900">Electronics</option>
              <option value="food" className="bg-zinc-900">Food & Beverage</option>
              <option value="health" className="bg-zinc-900">Health & Beauty</option>
              <option value="home" className="bg-zinc-900">Home & Garden</option>
              <option value="sports" className="bg-zinc-900">Sports & Outdoors</option>
              <option value="other" className="bg-zinc-900">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Business Address</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street" className="text-gray-300">Street Address</Label>
          <Input
            id="street"
            value={formData.address.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            placeholder="123 Main Street"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-gray-300">City *</Label>
            <Input
              id="city"
              value={formData.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="Colombo"
              className={cn("bg-white/5 border-white/10 text-white placeholder:text-gray-600", errors.city ? 'border-red-500/50' : '')}
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-gray-300">State/Province</Label>
            <Input
              id="state"
              value={formData.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="Western Province"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country" className="text-gray-300">Country</Label>
            <Input
              id="country"
              value={formData.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              placeholder="Sri Lanka"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
            <Input
              id="postalCode"
              value={formData.address.postalCode}
              onChange={(e) => handleAddressChange('postalCode', e.target.value)}
              placeholder="10100"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="px-8 bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold glow"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>
      </div>

      <p className="text-sm text-gray-500 text-center">
        * Required fields
      </p>
    </form>
  );
}

