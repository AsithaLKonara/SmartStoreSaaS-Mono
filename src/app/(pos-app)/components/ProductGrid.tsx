'use client';

import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

export function ProductGrid() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/products');
      if (res.ok) {
        const data = await res.json();
        const productsList = data.data || [];
        setProducts(productsList);

        const uniqueCategories = Array.from(
          new Set(productsList.map((p: any) => p.category))
        ) as string[];
        setCategories(['All', ...uniqueCategories]);
      }
    } catch (error) {
      logger.error({
        message: 'Failed to fetch products for POS',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Fallback dummy data for UI testing if API fails
      setProducts([
        { id: '1', name: 'Premium Wireless Headphones', price: 299.99, stock: 45, category: 'Electronics' },
        { id: '2', name: 'Ergonomic Office Chair', price: 199.50, stock: 12, category: 'Furniture' },
        { id: '3', name: 'Mechanical Keyboard RGB', price: 149.00, stock: 8, category: 'Accessories' },
        { id: '4', name: '4K Gaming Monitor', price: 399.00, stock: 22, category: 'Electronics' },
        { id: '5', name: 'USB-C Hub Pro', price: 49.99, stock: 150, category: 'Accessories' },
      ]);
      setCategories(['All', 'Electronics', 'Furniture', 'Accessories']);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              activeCategory === c
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-10">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
