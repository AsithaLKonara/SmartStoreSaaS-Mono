import { logger } from '@/lib/logger';

export const posService = {
  getProducts: async () => {
    try {
      const res = await fetch('/api/pos/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch (e) {
      logger.error('Error fetching POS products', { error: e });
      throw e;
    }
  },

  searchCustomers: async (query: string) => {
    try {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search customers');
      return await res.json();
    } catch (e) {
      logger.error('Error searching customers', { error: e });
      throw e;
    }
  },

  processPayment: async (payload: any) => {
    try {
      const res = await fetch('/api/pos/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Payment failed');
      return await res.json();
    } catch (e) {
      logger.error('Payment processing error', { error: e });
      throw e;
    }
  },

  openCashDrawer: async () => {
    try {
      const res = await fetch('/api/pos/cash-drawer/open', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to open drawer');
      return await res.json();
    } catch (e) {
      logger.error('Cash drawer error', { error: e });
      throw e;
    }
  },

  checkout: async (payload: any) => {
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Checkout failed');
      return await res.json();
    } catch (e) {
      logger.error('Checkout error', { error: e });
      throw e;
    }
  },
};
