'use client';

import { useState } from 'react';
import { CreditCard, Truck, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
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
          ...formData,
          items: [], // Would come from cart context
          total: 0
        })
      });

      if (response.ok) {
        toast.success('Order placed successfully!');
        router.push('/portal/orders');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="+94 77 123 4567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Colombo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="10100"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h2>
            <div className="space-y-3">
              {['COD', 'ONLINE', 'STRIPE', 'PAYHERE'].map(method => (
                <label key={method} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={formData.paymentMethod === method}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="mr-3"
                  />
                  <span className="font-medium">{method === 'COD' ? 'Cash on Delivery' : method}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold">{formatCurrency(500)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(500)}</span>
                </div>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

