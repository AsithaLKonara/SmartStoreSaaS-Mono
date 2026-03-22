'use client';

import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const tiers = [
  {
    name: 'Starter',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for startups getting their first sales.',
    features: ['1 Sales Channel', 'Basic AI Insights', '50 Products', 'Email Support'],
    cta: 'Start for Free',
    popular: false,
  },
  {
    name: 'Professional',
    price: { monthly: 49, yearly: 39 },
    description: 'Ideal for growing stores Scaling with AI.',
    features: ['5 Sales Channels', 'Full AI Automation Engine', 'Unlimited Products', 'Priority Support'],
    cta: 'Try Pro Free',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: 'Custom', yearly: 'Custom' },
    description: 'Built for large teams and complex operations.',
    features: ['Unlimited Channels', 'Custom AI Model Training', 'Dedicated Account Manager', '24/7 Phone Support'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div id="pricing" className="py-24 bg-black/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Simple, Transparent <span className="text-gradient">Pricing</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
          Choose the plan that's right for your business. Scale as you grow.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-16">
          <span className={cn('text-sm', !isAnnual ? 'text-white' : 'text-gray-500')}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 bg-white/10 rounded-full p-1 transition-all relative"
          >
            <div
              className={cn(
                'w-5 h-5 bg-primary rounded-full transition-all transform',
                isAnnual ? 'translate-x-7' : 'translate-x-0'
              )}
            />
          </button>
          <span className={cn('text-sm', isAnnual ? 'text-white' : 'text-gray-500')}>
            Yearly <span className="text-emerald-400 font-bold ml-1">(20% OFF)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'p-8 rounded-3xl border transition-all duration-500 relative group overflow-hidden',
                tier.popular 
                  ? 'border-primary/50 bg-primary/5 bg-mesh scale-105 z-10' 
                  : 'border-white/5 bg-white/5 hover:border-white/20'
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{tier.description}</p>
              
              <div className="mb-8">
                {typeof tier.price.monthly === 'number' ? (
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-white">$</span>
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      {isAnnual ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span className="text-gray-500 ml-2">/ month</span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-white py-2">{tier.price.monthly}</div>
                )}
              </div>

              <ul className="space-y-4 mb-10 text-left">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-3 text-gray-300">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.cta === 'Contact Sales' ? '/contact' : '/register'}
                className={cn(
                  'w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2',
                  tier.popular
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
