'use client';

import React from 'react';
import { Store, Cpu, TrendingUp } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Connect your stores',
    description: 'Instantly link Shopify, Amazon, Stripe, and your local POS to one unified dashboard.',
    icon: Store,
  },
  {
    id: 2,
    title: 'Let AI optimize',
    description: 'Our engine analyzes your data and automates inventory, marketing, and reports.',
    icon: Cpu,
  },
  {
    id: 3,
    title: 'Scale horizontally',
    description: 'Expand across new channels and regions with zero operational friction.',
    icon: TrendingUp,
  },
];

export const HowItWorks = () => {
  return (
    <div className="py-24 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">
          Scale in <span className="text-gradient">Three Steps</span>
        </h2>
        
        <div className="relative group">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 z-0 animate-pulse" />

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step) => (
              <div key={step.id} className="space-y-6">
                <div className="relative mx-auto w-32 h-32 rounded-full glass border border-white/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 hover:shadow-2xl hover:shadow-primary/20">
                   <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center border-4 border-black text-xl">
                      {step.id}
                   </div>
                   <step.icon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-white leading-tight">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-lg leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
