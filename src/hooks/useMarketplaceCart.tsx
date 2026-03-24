'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MarketplaceCartItem {
  id: string; // unique cart line ID
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  organizationId: string;
  organizationName: string;
  stock: number;
}

export interface CheckoutGroup {
  organizationId: string;
  organizationName: string;
  items: MarketplaceCartItem[];
  subtotal: number;
}

export interface MarketplaceCartContextType {
  items: MarketplaceCartItem[];
  cartCount: number;
  totalAmount: number;
  addItem: (item: Omit<MarketplaceCartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getGroupedItems: () => CheckoutGroup[];
}

const CartContext = createContext<MarketplaceCartContextType | undefined>(undefined);

export function MarketplaceCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MarketplaceCartItem[]>([]);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const addItem = (newItem: Omit<MarketplaceCartItem, 'id'>) => {
    setItems((prev) => {
      const existingLine = prev.find((i) => i.productId === newItem.productId);
      if (existingLine) {
        return prev.map((i) =>
          i.productId === newItem.productId
            ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.stock) }
            : i
        );
      }
      return [...prev, { ...newItem, id: crypto.randomUUID() }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i))
    );
  };

  const clearCart = () => setItems([]);

  const getGroupedItems = (): CheckoutGroup[] => {
    const groups: Record<string, CheckoutGroup> = {};
    items.forEach((item) => {
      if (!groups[item.organizationId]) {
        groups[item.organizationId] = {
          organizationId: item.organizationId,
          organizationName: item.organizationName,
          items: [],
          subtotal: 0,
        };
      }
      groups[item.organizationId].items.push(item);
      groups[item.organizationId].subtotal += (item.price * item.quantity);
    });
    return Object.values(groups);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        totalAmount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getGroupedItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useMarketplaceCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useMarketplaceCart must be used inside MarketplaceCartProvider');
  return context;
};
