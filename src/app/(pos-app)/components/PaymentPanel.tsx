'use client';

import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { Banknote, CreditCard, Wallet, Gift, SplitSquareHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PaymentPanel() {
  const { total, items, clearCart } = useCart();
  const [method, setMethod] = useState<'cash' | 'card' | 'wallet' | 'gift' | 'split'>('cash');
  const [tendered, setTendered] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setProcessing(true);
    try {
      // API call to POST /api/pos/checkout
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API
      
      // If method is cash, hit POST /api/pos/cash-drawer/open
      if (method === 'cash') {
        const cashDrawerReq = fetch('/api/pos/cash-drawer/open', { method: 'POST' });
        // Handle background req
      }

      // If method is card, hit POST /api/pos/card-payment
      if (method === 'card') {
        fetch('/api/pos/card-payment', { method: 'POST', body: JSON.stringify({ amount: total, terminalId: 'term-1' }) }).catch(() => {});
      }

      alert('Transaction Completed Successfully!');
      clearCart();
      setTendered('');
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || !navigator.onLine) {
        // Save to offline storage
        const offlineOrders = JSON.parse(localStorage.getItem('pos_offline_orders') || '[]');
        offlineOrders.push({
          id: crypto.randomUUID(),
          items, total, method, timestamp: new Date().toISOString()
        });
        localStorage.setItem('pos_offline_orders', JSON.stringify(offlineOrders));
        alert('Transaction saved offline. Will sync when reconnected.');
        clearCart();
        setTendered('');
      } else {
        alert('Transaction failed!');
      }
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'gift', label: 'Gift Card', icon: Gift },
    { id: 'split', label: 'Split', icon: SplitSquareHorizontal },
  ] as const;

  const quickAmounts = [10, 20, 50, 100];
  const balance = parseFloat(tendered) || 0;
  const change = Math.max(0, balance - total);

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
        Payment
        <span className="text-xl text-indigo-600">${total.toFixed(2)}</span>
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        {paymentMethods.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMethod(id)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
              method === id
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      {method === 'cash' && (
        <div className="space-y-4 mb-4 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">QUICK CASH</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setTendered(total.toFixed(2))}
                className="py-2 bg-indigo-100 text-indigo-700 rounded-md font-bold text-sm hover:bg-indigo-200"
              >
                Exact
              </button>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTendered((parseFloat(tendered || '0') + amt).toFixed(2))}
                  className="py-2 bg-slate-200 text-slate-700 rounded-md font-bold text-sm hover:bg-slate-300 transition-colors"
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">TENDERED AMOUNT</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xl font-bold focus:ring-2 focus:ring-indigo-500 text-slate-800"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Change:</span>
            <span className={`text-2xl font-bold ${change > 0 ? 'text-green-600' : 'text-slate-700'}`}>
              ${change.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {(method === 'card' || method === 'wallet' || method === 'gift' || method === 'split') && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 rounded-xl mb-4 border border-slate-100 border-dashed">
          <CreditCard className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-sm font-medium">Ready for terminal processing.</p>
        </div>
      )}

      <div className="mt-auto">
        <Button
          onClick={handleCheckout}
          disabled={items.length === 0 || processing || (method === 'cash' && balance < total)}
          className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:bg-slate-300 disabled:opacity-50"
        >
          {processing ? 'Processing...' : method === 'cash' ? `Pay $${total.toFixed(2)}` : 'Process Payment'}
        </Button>
      </div>
    </div>
  );
}
