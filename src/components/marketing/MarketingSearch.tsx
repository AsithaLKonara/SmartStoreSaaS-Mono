'use client';

import React, { useState } from 'react';
import { Search, Store, ShoppingBag, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const MarketingSearch = () => {
  const [marketplaceQuery, setMarketplaceQuery] = useState('');
  const [shopQuery, setShopQuery] = useState('');
  const router = useRouter();

  const handleMarketplaceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (marketplaceQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(marketplaceQuery)}`);
    }
  };

  const handleShopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (shopQuery.trim()) {
      router.push(`/shops?q=${encodeURIComponent(shopQuery)}`);
    }
  };

  return (
    <section className="relative z-30 -mt-12 mb-24 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Marketplace Search */}
        <div className="glass-dark rounded-3xl p-8 border border-white/10 hover:border-primary/50 transition-all group shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-primary/20 rounded-2xl group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Marketplace</h3>
              <p className="text-gray-400 text-sm">Search across millions of products</p>
            </div>
          </div>
          
          <form onSubmit={handleMarketplaceSearch} className="relative">
            <input
              type="text"
              placeholder="What are you looking for?"
              value={marketplaceQuery}
              onChange={(e) => setMarketplaceQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-gray-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary hover:bg-primary/80 rounded-xl transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </form>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {['Electronics', 'Fashion', 'Health', 'Tech'].map((cat) => (
              <button 
                key={cat}
                onClick={() => router.push(`/marketplace?category=${cat.toLowerCase()}`)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shop Search */}
        <div className="glass-dark rounded-3xl p-8 border border-white/10 hover:border-primary/50 transition-all group shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-indigo-500/20 rounded-2xl group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Find Shops</h3>
              <p className="text-gray-400 text-sm">Discover top-rated merchant stores</p>
            </div>
          </div>
          
          <form onSubmit={handleShopSearch} className="relative">
            <input
              type="text"
              placeholder="Search store name or category..."
              value={shopQuery}
              onChange={(e) => setShopQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all placeholder:text-gray-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {['Top Rated', 'Near Me', 'New Shops', 'Bestsellers'].map((tag) => (
              <button 
                key={tag}
                onClick={() => router.push(`/shops?filter=${tag.toLowerCase().replace(' ', '-')}`)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
