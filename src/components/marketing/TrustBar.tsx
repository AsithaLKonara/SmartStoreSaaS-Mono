'use client';

import React from 'react';
import { ShoppingBag, Box, CreditCard, Layout, Network } from 'lucide-react';

const partners = [
  { name: 'Shopify', icon: ShoppingBag },
  { name: 'Amazon', icon: Box },
  { name: 'Stripe', icon: CreditCard },
  { name: 'WooCommerce', icon: Layout },
  { name: 'PayPal', icon: Network },
  { name: 'Magento', icon: ShoppingBag },
  { name: 'Etsy', icon: Box },
];

export const TrustBar = () => {
  return (
    <div className="py-12 bg-black/40 border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest">
          Trusted by 5000+ modern commerce teams worldwide
        </p>
      </div>
      
      <div className="relative flex overflow-x-hidden group">
        <div className="animate-marquee whitespace-nowrap flex items-center py-4">
          {[...partners, ...partners].map((partner, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 mx-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default"
            >
              <partner.icon className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white/80 tracking-tight">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
