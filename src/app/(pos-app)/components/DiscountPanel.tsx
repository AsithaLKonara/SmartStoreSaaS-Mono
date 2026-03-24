'use client';

import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DiscountPanel() {
  const { applyDiscount, applyCoupon, discount, subtotal } = useCart();
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percent'>('none');
  const [value, setValue] = useState<string>('');
  const [coupon, setCoupon] = useState<string>('');

  const handleApply = () => {
    let amt = parseFloat(value) || 0;
    if (discountType === 'percent') {
      amt = subtotal * (amt / 100);
    }
    applyDiscount(amt);
    if (coupon) applyCoupon(coupon);
  };

  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
      <div className="flex items-center space-x-2 text-sm mb-3">
        <Tag className="w-4 h-4 text-slate-500" />
        <span className="font-medium text-slate-700">Discounts & Coupons</span>
      </div>
      
      <div className="flex space-x-2 mb-3">
        <button 
          onClick={() => setDiscountType('percent')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md flex-1 transition-colors ${discountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          % Off
        </button>
        <button 
          onClick={() => setDiscountType('fixed')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md flex-1 transition-colors ${discountType === 'fixed' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          $ Off
        </button>
      </div>

      {(discountType !== 'none') && (
        <div className="flex space-x-2 mb-3">
          <input 
            type="number" 
            placeholder={discountType === 'percent' ? '10%' : '$10.00'}
            className="flex-1 w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button onClick={handleApply} size="sm" variant="secondary" className="px-4">Apply</Button>
        </div>
      )}

      {discount > 0 && (
        <div className="flex justify-between items-center text-xs text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100">
          <span>Current Discount:</span>
          <span className="font-bold">-${discount.toFixed(2)}</span>
          <button 
            onClick={() => { applyDiscount(0); setValue(''); setDiscountType('none'); }}
            className="text-indigo-400 hover:text-indigo-800"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
