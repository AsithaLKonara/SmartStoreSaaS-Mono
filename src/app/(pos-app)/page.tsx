'use client';

import React from 'react';
import { ProductGrid } from './components/ProductGrid';
import { CartPanel } from './components/CartPanel';
import { PaymentPanel } from './components/PaymentPanel';
import { BarcodeScanner } from './components/BarcodeScanner';
import { POSProvider } from './hooks/usePOS';
import { CartProvider } from './hooks/useCart';
import { CustomerSelector } from './components/CustomerSelector';

export default function POSTerminalPage() {
  return (
    <POSProvider>
      <CartProvider>
        <div className="flex h-screen w-full overflow-hidden bg-slate-100 text-slate-800">
        {/* LEFT: Product Catalog & Search (approx 50%) */}
        <section className="flex flex-col flex-1 h-full border-r border-slate-200 bg-white">
          <header className="p-4 border-b border-slate-200 flex space-x-2 shrink-0">
            <div className="flex-1">
              <BarcodeScanner />
            </div>
          </header>
          <div className="flex-1 overflow-hidden p-4">
            <ProductGrid />
          </div>
        </section>

        {/* CENTER: Shopping Cart (approx 25%) */}
        <section className="flex flex-col w-[350px] lg:w-[400px] h-full border-r border-slate-200 bg-slate-50 shrink-0">
          <header className="p-4 border-b border-slate-200 shrink-0 bg-white">
            <CustomerSelector />
          </header>
          <div className="flex-1 overflow-y-auto w-full p-4">
            <CartPanel />
          </div>
        </section>

        {/* RIGHT: Payment Panel (approx 25%) */}
        <section className="flex flex-col w-[300px] lg:w-[350px] h-full shrink-0 bg-white">
          <div className="flex-1 overflow-y-auto p-4 w-full">
            <PaymentPanel />
          </div>
        </section>
      </div>
      </CartProvider>
    </POSProvider>
  );
}
