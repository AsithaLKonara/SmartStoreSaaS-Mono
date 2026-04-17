'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (categoryFilter = '') => {
    setLoading(true);
    try {
      const url = `/api/products${categoryFilter ? `?category=${categoryFilter}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        // Standardize product data from API successResponse { data, meta }
        const rawProducts = result.data || [];
        const formattedProducts = rawProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price) || 0,
          image: p.image || '',
          rating: 4.5, // Default for now
          reviews: Math.floor(Math.random() * 100) + 10 // Mock reviews
        }));
        setProducts(formattedProducts);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching products',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string) => {
    toast.success('Added to cart!');
  };

  const addToWishlist = (productId: string) => {
    toast.success('Added to wishlist!');
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="loading-spinner w-8 h-8"></div></div>;

  return (
    <div className="flex flex-col md:flex-row gap-8 py-8 px-4 md:px-0">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 space-y-8">
        <div className="glass-dark p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Filters
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Categories</h3>
              <div className="space-y-2">
                {['All Products', 'Electronics', 'Premium Gear', 'AI Tools', 'Accessories'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => fetchProducts(cat === 'All Products' ? '' : cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${cat === 'All Products' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Price Range</h3>
              <div className="px-2">
                <input type="range" className="w-full accent-primary bg-white/10 h-1 rounded-lg" />
                <div className="flex justify-between mt-2 text-[10px] text-white/40 font-mono">
                  <span>0 LKR</span>
                  <span>100K+ LKR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-dark p-6 rounded-2xl border border-white/5 hidden md:block">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Inventory Sync
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30 w-4 h-4" />
            <input
              type="text"
              placeholder="Search premium products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>Sort by:</span>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-primary/50">
              <option>Newest First</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group relative glass-dark rounded-2xl border border-white/5 transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px] overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                <Package className="w-20 h-20 text-white/10 group-hover:text-primary/20 transition-colors" />
                {/* Sale Badge Example */}
                {product.price > 5000 && (
                  <span className="absolute top-4 right-4 bg-primary px-2 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase">Premium</span>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-white group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-white/40 text-xs mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < (product.rating || 4) ? 'text-primary fill-primary' : 'text-white/10'}`} />
                  ))}
                  <span className="text-[10px] text-white/30 ml-2 font-mono uppercase tracking-tighter">
                    {product.reviews || 0} Reviews
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl font-bold text-white tracking-tight">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="flex-1 bg-white/5 hover:bg-primary text-white text-sm font-semibold py-2.5 rounded-xl border border-white/10 hover:border-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button 
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all active:scale-95"
                    onClick={() => addToWishlist(product.id)}
                  >
                    <Heart className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 glass-dark rounded-3xl border border-white/5">
            <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">No products found</h3>
            <p className="text-white/40 text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

