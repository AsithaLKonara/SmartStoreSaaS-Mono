'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useMarketplaceCart } from '@/hooks/useMarketplaceCart';
import toast from 'react-hot-toast';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number | string;
    organizationId: string;
    organizationName: string;
    stock: number;
    logo?: string;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useMarketplaceCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      quantity: 1,
      image: product.logo,
      organizationId: product.organizationId,
      organizationName: product.organizationName,
      stock: product.stock,
    });
    
    setIsAdded(true);
    toast.success('Added to cart');
    
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <button
      onClick={handleAdd}
      disabled={isOutOfStock || isAdded}
      className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center space-x-2 
        ${isOutOfStock 
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
          : isAdded 
            ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
        }`}
    >
      {isAdded ? (
        <>
          <Check className="w-5 h-5" />
          <span>Added to Cart</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5" />
          <span>{isOutOfStock ? 'Out of Stock' : 'Add to Global Cart'}</span>
        </>
      )}
    </button>
  );
}
