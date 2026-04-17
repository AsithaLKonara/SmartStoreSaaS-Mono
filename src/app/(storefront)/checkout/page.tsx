'use client';

import { useState } from 'react';
import { CreditCard, Truck, MapPin, Phone, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useStorefrontCart } from '@/hooks/useStorefrontCart';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useStorefrontCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'COD'
  });

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, name: i.name })),
          subtotal: totalAmount,
          shipping: 500,
          total: totalAmount + 500
        })
      });

      if (response.ok) {
        toast.success('Order placed successfully!');
        clearCart();
        router.push('/my-orders');
      } else {
        toast.error('Failed to place order');
      }
    } catch (error) {
      toast.error('Error processing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 md:px-0">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Checkout</h1>
        <p className="text-white/40 mt-2">Personalize your shipping and payment details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Information */}
          <div className="glass-dark rounded-3xl border border-white/5 p-8 space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              Shipping Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                  placeholder="+94 77 123 4567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Delivery Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10 min-h-[100px]"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                  placeholder="Colombo"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                  placeholder="10100"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="glass-dark rounded-3xl border border-white/5 p-8 space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              Payment Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['COD', 'ONLINE', 'STRIPE', 'PAYHERE'].map(method => (
                <label 
                  key={method} 
                  className={`flex items-center p-5 rounded-2xl cursor-pointer border transition-all duration-300 ${formData.paymentMethod === method ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={formData.paymentMethod === method}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="hidden"
                  />
                  <div>
                    <span className={`block font-bold mb-1 ${formData.paymentMethod === method ? 'text-white' : 'text-white/60'}`}>
                      {method === 'COD' ? 'Cash on Delivery' : method}
                    </span>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                      {method === 'COD' ? 'Safe & Reliable' : 'Instant Confirmation'}
                    </span>
                  </div>
                  {formData.paymentMethod === method && (
                    <div className="ml-auto w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="glass-dark rounded-3xl border border-white/10 p-8 sticky top-28 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
            
            <h2 className="text-2xl font-bold text-white">Review Summary</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-white/40">
                <span>Items Subtotal ({items.length} items)</span>
                <span className="font-mono text-white tracking-widest">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-white/40">
                <span>Priority Shipping</span>
                <span className="font-mono text-white tracking-widest">{formatCurrency(500)}</span>
              </div>
              <div className="border-t border-white/10 pt-6 mt-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Final Amount</span>
                    <p className="text-3xl font-bold text-white mt-1 tracking-tighter">{formatCurrency(totalAmount + 500)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCheckout} 
              disabled={loading}
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <div className="loading-spinner w-5 h-5 !border-white" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Complete Purchase
                  </>
                )}
              </div>
            </button>
            
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-1 group cursor-help">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-white/30 uppercase font-mono tracking-tighter">SSL Secured</span>
              </div>
              <div className="flex items-center gap-1 group cursor-help">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_rgba(139,92,246,0.5)]" />
                <span className="text-[10px] text-white/30 uppercase font-mono tracking-tighter">AI Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

