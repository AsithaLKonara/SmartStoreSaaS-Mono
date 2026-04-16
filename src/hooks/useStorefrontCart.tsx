'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface StorefrontCartItem {
  id: string; // unique cart line ID
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
}

export interface StorefrontCartContextType {
  items: StorefrontCartItem[];
  cartCount: number;
  totalAmount: number;
  addItem: (item: Omit<StorefrontCartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<StorefrontCartContextType | undefined>(undefined);

export function StorefrontCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StorefrontCartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localized storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('smartstore_storefront_cart');
      if (stored) setItems(JSON.parse(stored));
    } catch (err) {}
    setIsLoaded(true);
  }, []);

  // Save changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('smartstore_storefront_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const addItem = (item: Omit<StorefrontCartItem, 'id'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i => i.productId === item.productId 
          ? { ...i, quantity: i.quantity + item.quantity } 
          : i);
      }
      return [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{
      items, cartCount, totalAmount, addItem, removeItem, updateQuantity, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useStorefrontCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useStorefrontCart must be used inside StorefrontCartProvider');
  return context;
};
