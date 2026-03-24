'use client';

import React from 'react';
import { useCart } from '../hooks/useCart';
import { Trash2, AlertCircle } from 'lucide-react';
import { CartItem } from './CartItem';
import { DiscountPanel } from './DiscountPanel';

export function CartPanel() {
  const { items, subtotal, tax, discount, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <ShoppingCartIcon className="w-16 h-16 mb-4 text-slate-300" />
        <p>Cart is empty</p>
        <p className="text-sm mt-2 text-slate-500 text-center px-6">
          Scan products or click on the product grid to start adding items.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto space-y-3 pb-6 pr-1 custom-scrollbar">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="shrink-0 mt-auto bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Discounts */}
        <DiscountPanel />

        <div className="space-y-2 pt-3 border-t border-slate-100 text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-indigo-600">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <span className="text-lg font-bold text-slate-800">Total</span>
          <span className="text-2xl font-bold tracking-tight text-indigo-600">
            ${total.toFixed(2)}
          </span>
        </div>

        <button 
          onClick={clearCart}
          className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-red-600 font-medium rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          Void Sale
        </button>
      </div>
    </div>
  );
}

function ShoppingCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
