'use client';

import React from 'react';
import { useCart } from '../hooks/useCart';
import { Trash2, Plus, Minus, MessageSquare } from 'lucide-react';

export function CartItem({ item }: { item: any }) {
  const { updateQuantity, removeItem, updateNotes } = useCart();

  return (
    <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-2">
          <h4 className="font-medium text-slate-800 text-sm leading-tight">{item.name}</h4>
          <span className="text-xs text-slate-500">${item.price.toFixed(2)} each</span>
        </div>
        <div className="font-bold text-slate-900 border-l border-slate-100 pl-2 text-right">
          ${(item.price * item.quantity - item.discount).toFixed(2)}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-medium text-slate-800 text-sm">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Note button */}
          <button
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors"
            title="Add note"
            onClick={() => {
              const note = window.prompt('Item note:', item.notes || '');
              if (note !== null) updateNotes(item.id, note);
            }}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => removeItem(item.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {item.notes && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-100">
          Note: {item.notes}
        </div>
      )}
    </div>
  );
}
