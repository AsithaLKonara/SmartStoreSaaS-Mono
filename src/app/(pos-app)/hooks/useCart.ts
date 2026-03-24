import { create } from 'zustand';

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

export interface CartState {
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

// Helper to recalculate totals
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

export const useCart = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  couponCode: null,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      let newItems;
      if (existing) {
        newItems = state.items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        newItems = [
          ...state.items,
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
      }
      return { items: newItems, ...calculateTotals(newItems, state.discount) };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== id);
      return { items: newItems, ...calculateTotals(newItems, state.discount) };
    });
  },

  updateQuantity: (id, quantity) => {
    set((state) => {
      const newItems = state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
      );
      return { items: newItems, ...calculateTotals(newItems, state.discount) };
    });
  },

  applyDiscount: (discountAmount) => {
    set((state) => ({
      discount: discountAmount,
      ...calculateTotals(state.items, discountAmount),
    }));
  },

  applyCoupon: (code) => {
    set({ couponCode: code });
    // In a real app, this would call an API to validate and get discount
  },

  updateNotes: (id, notes) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, notes } : i)),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      couponCode: null,
    });
  },
}));
