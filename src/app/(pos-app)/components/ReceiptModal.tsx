'use client';

import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReceiptModal({ open, onClose, orderId }: { open: boolean, onClose: () => void, orderId?: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Receipt Viewer</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white font-mono text-sm leading-relaxed text-slate-700">
          <div className="text-center mb-6">
            <h2 className="font-bold text-lg text-slate-900 mb-1">SmartStore ERP</h2>
            <p className="text-xs text-slate-500">123 Main Street<br/>City, State 12345</p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 space-y-1">
            <div className="flex justify-between">
              <span>Date: {new Date().toLocaleDateString()}</span>
              <span>Time: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Receipt: #{orderId || '10294'}</span>
              <span>Cashier: Admin</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between font-bold text-slate-800 pb-2 border-b border-slate-100">
              <span>Item</span>
              <span>Amount</span>
            </div>
            {/* Example items */}
            <div className="flex justify-between">
              <span>1x Headphone</span>
              <span>$299.99</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs pl-4 pb-1">
              <span>Discount</span>
              <span>-$10.00</span>
            </div>
            <div className="flex justify-between">
              <span>2x Monitor</span>
              <span>$798.00</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 font-bold">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>$1087.99</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span>$108.80</span>
            </div>
            <div className="flex justify-between text-lg text-slate-900 pt-2 border-t border-slate-900 mt-2">
              <span>TOTAL</span>
              <span>$1196.79</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-8">
            <p>Thank you for your purchase!</p>
            <p>Please keep this receipt for returns.</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="default" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
