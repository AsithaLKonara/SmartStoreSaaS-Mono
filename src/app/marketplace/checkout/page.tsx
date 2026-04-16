'use client';

import React, { useState } from 'react';
import { Shield, CreditCard, ShoppingBag, Truck } from 'lucide-react';
import { useMarketplaceCart } from '@/hooks/useMarketplaceCart';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function MarketplaceCheckoutPage() {
  const router = useRouter();
  const { cartCount, totalAmount, getGroupedItems, clearCart } = useMarketplaceCart();
  const groupedItems = getGroupedItems();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'ONLINE' // Defaulting to secure simulated checkout
  });

  if (cartCount === 0) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Your cart is empty</h2>
        <button onClick={() => router.push('/marketplace')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
          Return to Marketplace
        </button>
      </div>
    );
  }

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Simulate Payment validation step
      await new Promise(res => setTimeout(res, 1500)); 

      // In a production system, this would iterate over `groupedItems` and 
      // submit individual multi-tenant orders via an aggregator API endpoint.
      // For this phase, we resolve the simulated flow securely.
      
      toast.success('Payment Secured! Orders placed with merchants.');
      clearCart();
      router.push('/dashboard/orders');
    } catch (error) {
      toast.error('Transaction Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Secure Checkout</h1>
        <p className="text-slate-500 mt-2">Complete your global marketplace purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
              <Truck className="w-5 h-5 text-indigo-600" />
              Shipping Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delivery Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium min-h-[100px]"
                  placeholder="123 Smart Avenue"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Secure Payment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-center p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.paymentMethod === 'ONLINE' ? 'bg-indigo-50 border-indigo-600 shadow-md shadow-indigo-600/10' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="payment" value="ONLINE" checked={formData.paymentMethod === 'ONLINE'} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="hidden" />
                <div>
                  <span className={`block font-bold mb-1 ${formData.paymentMethod === 'ONLINE' ? 'text-indigo-900' : 'text-slate-700'}`}>Credit / Debit Card</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Powered by Stripe</span>
                </div>
              </label>
              <label className={`flex items-center p-5 rounded-2xl cursor-pointer border-2 transition-all ${formData.paymentMethod === 'COD' ? 'bg-indigo-50 border-indigo-600 shadow-md shadow-indigo-600/10' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="payment" value="COD" checked={formData.paymentMethod === 'COD'} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="hidden" />
                <div>
                  <span className={`block font-bold mb-1 ${formData.paymentMethod === 'COD' ? 'text-indigo-900' : 'text-slate-700'}`}>Cash on Delivery</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Pay upon arrival</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        <div className="lg:col-span-5">
           <div className="bg-white rounded-3xl border border-slate-200 p-8 sticky top-28 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Order Review</h2>
            
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 mb-6">
              {groupedItems.map((group) => (
                <div key={group.organizationId} className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Merchant: <span className="text-slate-900">{group.organizationName}</span></p>
                  <div className="space-y-3">
                    {group.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-slate-900">{item.quantity}x</span>
                          <span className="text-slate-600 truncate max-w-[150px]">{item.name}</span>
                        </div>
                        <span className="font-bold text-indigo-600">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-sm mb-6 pt-6 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Subtotal ({cartCount} items)</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
            >
              {loading ? 'Processing Transaction...' : (
                <>
                  <Shield className="w-5 h-5" />
                  Pay {formatCurrency(totalAmount)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
