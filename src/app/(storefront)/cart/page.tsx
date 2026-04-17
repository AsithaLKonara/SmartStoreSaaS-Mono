'use client';

import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useStorefrontCart } from '@/hooks/useStorefrontCart';

export default function CartPage() {
  const router = useRouter();
  const { items: cartItems, updateQuantity, removeItem, totalAmount: subtotal } = useStorefrontCart();


  const shipping = 500; // LKR
  const total = subtotal + shipping;

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-10 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold flex items-center gap-4">
          <ShoppingBag className="w-10 h-10 text-primary" />
          Shopping <span className="text-gradient">Cart</span>
        </h1>
        <p className="text-white/40 text-sm font-mono uppercase tracking-widest">{cartItems.length} Items Selected</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="glass-dark rounded-3xl border border-white/5 p-20 text-center space-y-6">
          <div className="relative inline-block">
             <ShoppingBag className="w-24 h-24 text-white/5 mx-auto" />
             <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full -z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-white/40 max-w-sm mx-auto">Looks like you haven't added any premium gear to your cart yet.</p>
          </div>
          <button 
            onClick={() => router.push('/shop')}
            className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all glow active:scale-95"
          >
            Explore the Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="glass-dark rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors group">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-white/5 rounded-xl flex-shrink-0 border border-white/5 flex items-center justify-center p-4">
                     <ShoppingBag className="w-12 h-12 text-white/10" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-white">{item.name}</h3>
                      <button onClick={() => removeItem(item.id)} className="text-white/20 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-xl font-bold text-white tracking-tight">{formatCurrency(item.price)}</p>
                      <div className="flex items-center gap-1 bg-white/5 rounded-xl border border-white/10 p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-mono text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="glass-dark rounded-3xl border border-white/10 p-8 sticky top-28 space-y-8 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
              
              <h2 className="text-2xl font-bold text-white">Order Summary</h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Subtotal</span>
                  <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Estimated Shipping</span>
                  <span className="font-semibold text-white">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between items-center text-green-400">
                  <span className="text-white/40">Tax (Included)</span>
                  <span className="font-semibold">{formatCurrency(0)}</span>
                </div>
                
                <div className="border-t border-white/10 pt-6 mt-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Total Amount</span>
                      <p className="text-3xl font-bold text-white mt-1 tracking-tighter">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all glow active:scale-[0.98]"
                onClick={() => router.push('/checkout')}
              >
                Proceed to Checkout
              </button>
              
              <div className="pt-4 text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Secure Checkout Guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

