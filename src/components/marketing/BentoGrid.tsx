'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Brain, Zap, Share2, Database, ShieldCheck, BarChart3 } from 'lucide-react';

const features = [
  {
    title: 'Global Marketplace',
    description: 'List your items on a unified AliExpress-style global storefront securely bridging thousands of diverse merchants together seamlessly.',
    className: 'md:col-span-2 md:row-span-1',
    icon: Share2,
    color: 'from-purple-500/20 to-indigo-500/20',
  },
  {
    title: 'SaaS E-Commerce',
    description: 'Design a private Shopify-style custom branded storefront strictly for your exclusive retail presence without touching your marketplace logic.',
    className: 'md:col-span-1 md:row-span-1',
    icon: Database,
    color: 'from-amber-500/20 to-orange-500/20',
  },
  {
    title: 'Backend Operations ERP',
    description: 'An AI-powered dashboard handling your inventory, CRM, financial logic, and cross-channel fulfilment instantly.',
    className: 'md:col-span-1 md:row-span-2',
    icon: Brain,
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Native POS System',
    description: 'Sync your brick-and-mortar storefronts dynamically. Connects directly to barcode scanners, cash drawers, and offline storage queues.',
    className: 'md:col-span-1 md:row-span-1',
    icon: Zap,
    color: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    title: 'Split-Payout Connect',
    description: 'Compliant Stripe Destination Charges. Split global marketplace revenues directly to merchants minus commission frictionlessly.',
    className: 'md:col-span-1 md:row-span-1',
    icon: ShieldCheck,
    color: 'from-indigo-500/20 to-blue-500/20',
  },
];

export const BentoGrid = () => {
  return (
    <div id="solutions" className="py-24 bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Powerful <span className="text-gradient">Capabilities</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to master your commerce workflow in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {features.map((feature, i) => (
            <div
              key={i}
              className={cn(
                'group relative rounded-3xl p-8 border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 glass-dark flex flex-col justify-between',
                feature.className
              )}
            >
              {/* Background Glow */}
              <div className={cn(
                'absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br blur-3xl opacity-10 group-hover:opacity-30 transition-opacity',
                feature.color
              )} />
              
              <div>
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Decorative graphic placeholder */}
              <div className="mt-8 bg-white/5 h-2 w-full rounded-full overflow-hidden">
                <div className="bg-primary h-full w-1/3 group-hover:w-full transition-all duration-1000" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
