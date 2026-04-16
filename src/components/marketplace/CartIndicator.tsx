'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useMarketplaceCart } from '@/hooks/useMarketplaceCart';

export function CartIndicator() {
  const { cartCount } = useMarketplaceCart();

  return (
    <Link href="/marketplace/cart" className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors relative">
      <ShoppingCart className="w-5 h-5" />
      <span className="hidden sm:inline-block">Cart</span>
      {cartCount > 0 && (
        <span className="absolute -top-1.5 -right-2 sm:-right-4 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {cartCount}
        </span>
      )}
    </Link>
  );
}
