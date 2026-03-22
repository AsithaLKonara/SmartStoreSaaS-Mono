'use client';

import React from 'react';
import { Cpu, Globe, Banknote, Zap, Layers, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProductStory = () => {
  const storyPoints = [
    {
      title: 'AI Marketing Engine',
      description: 'Auto campaign creation & predictive marketing insights. Let AI choose your best performing ads.',
      icon: Cpu,
      color: 'from-blue-500/20 to-purple-500/20',
      iconColor: 'text-indigo-400',
    },
    {
      title: 'Multi Channel Sync',
      description: 'Sync inventory across Amazon, Shopify, and Retail POS automatically. One inventory, infinite channels.',
      icon: Globe,
      color: 'from-cyan-500/20 to-blue-500/20',
      iconColor: 'text-cyan-400',
    },
    {
      title: 'Finance Automation',
      description: 'Automatic invoices, tax reports, and revenue analytics for your entire operation.',
      icon: Banknote,
      color: 'from-emerald-500/20 to-cyan-500/20',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div id="features" className="py-24 bg-black/20 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-radial-at-t from-primary/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Everything You Need to <span className="text-gradient">Scale</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-16">
          SmartStore unifies your entire commerce operation — from marketing to inventory to finance — into one intelligent platform.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {storyPoints.map((point) => (
            <div
              key={point.title}
              className={cn(
                'p-8 rounded-3xl border border-white/5 bg-gradient-to-br transition-all duration-300 group hover:border-white/10 hover:shadow-2xl hover:shadow-primary/5',
                point.color,
                'glass-dark'
              )}
            >
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10',
                point.iconColor,
                'bg-black/50 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform'
              )}>
                <point.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                {point.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
