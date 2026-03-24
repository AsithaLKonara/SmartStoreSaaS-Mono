import React from 'react';
import { useCart } from '../hooks/useCart';

export function ProductCard({ product }: { product: any }) {
  const addItem = useCart((state) => state.addItem);

  return (
    <div
      onClick={() => addItem(product, 1)}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
    >
      <div>
        <div className="w-full h-32 bg-slate-50 rounded-lg mb-3 flex items-center justify-center font-bold text-slate-300">
          {(product.image || product.name.charAt(0))}
        </div>
        <h3 className="font-medium text-slate-800 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{product.category}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-lg text-slate-900">${product.price.toFixed(2)}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {product.stock} left
        </span>
      </div>
    </div>
  );
}
