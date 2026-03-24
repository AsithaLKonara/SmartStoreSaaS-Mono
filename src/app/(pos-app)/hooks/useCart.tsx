'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItemType {
  id: string; // unique item id in cart
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  notes?: string;
  stock?: number;
}

export interface CartContextType {
  items: CartItemType[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  couponCode: string | null;
  addItem: (product: any, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyDiscount: (discount: number) => void;
  applyCoupon: (code: string) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const calculateTotals = (items: CartItemType[], globalDiscount: number) => {
  const subtotal = items.reduce((acc, item) => {
    const itemTotal = (item.price - item.discount) * item.quantity;
    return acc + itemTotal;
  }, 0);
  
  const taxRate = 0.1; // Example 10% tax
  const discountAmount = Math.min(globalDiscount, subtotal);
  const totalAfterDiscount = subtotal - discountAmount;
  const tax = totalAfterDiscount * taxRate;
  const total = totalAfterDiscount + tax;

  return { subtotal, tax, total };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const totals = calculateTotals(items, discount);

  const addItem = (product: any, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          discount: 0,
          stock: product.stock,
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => prev.map((i) =>
      i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
    ));
  };

  const applyDiscount = (discountAmount: number) => {
    setDiscount(discountAmount);
  };

  const applyCoupon = (code: string) => {
    setCouponCode(code);
  };

  const updateNotes = (id: string, notes: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(0);
    setCouponCode(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount,
        total: totals.total,
        couponCode,
        addItem,
        removeItem,
        updateQuantity,
        applyDiscount,
        applyCoupon,
        updateNotes,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
