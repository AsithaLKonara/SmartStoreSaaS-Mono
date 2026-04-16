'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, Plus, Minus, Store } from 'lucide-react';
import { useMarketplaceCart } from '@/hooks/useMarketplaceCart';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function MarketplaceCartPage() {
  const router = useRouter();
  const { cartCount, totalAmount, getGroupedItems, removeItem, updateQuantity } = useMarketplaceCart();
  const groupedItems = getGroupedItems();

  if (cartCount === 0) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center space-y-6 shadow-xl shadow-slate-200/40">
          <div className="relative inline-block">
             <ShoppingBag className="w-24 h-24 text-slate-200 mx-auto" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Your global cart is empty</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Explore the marketplace and discover items from thousands of merchants.</p>
          </div>
          <Link href="/marketplace" className="inline-block rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black flex items-center gap-4 text-slate-900">
          <ShoppingBag className="w-10 h-10 text-indigo-600" />
          Global Cart
        </h1>
        <p className="text-slate-500 font-medium">{cartCount} Items Selected</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {groupedItems.map((group) => (
            <div key={group.organizationId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center space-x-3">
                <Store className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Sold by {group.organizationName}</h3>
              </div>
              
              <div className="p-6 space-y-6">
                {group.items.map((item) => (
                  <div key={item.id} className="flex gap-6 group">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl flex-shrink-0 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                         <Image src={item.image} alt={item.name} width={96} height={96} className="object-cover w-full h-full" />
                      ) : (
                         <ShoppingBag className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-lg font-bold text-slate-900">{item.name}</h4>
                        <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-lg font-black text-indigo-600 tracking-tight">{formatCurrency(item.price)}</p>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg border border-slate-200 p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-900 transition-colors shadow-sm cursor-pointer">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-bold text-sm text-slate-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-900 transition-colors shadow-sm cursor-pointer">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Subtotal for {group.organizationName}</span>
                <span className="font-bold text-slate-900">{formatCurrency(group.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sticky top-28 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between items-center text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-200 pb-4">
                <span>Estimated Tax & Shipping</span>
                <span className="text-slate-400 italic">Calculated at checkout</span>
              </div>
              
              <div className="flex justify-between items-end pt-2">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Estimated</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            
            <button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              onClick={() => router.push('/marketplace/checkout')}
            >
              Proceed to Secure Checkout
            </button>
            <p className="text-xs text-center text-slate-500 mt-4 uppercase tracking-widest font-bold">Encrypted & Secure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
