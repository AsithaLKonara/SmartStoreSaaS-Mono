'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    description: string;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/customer-portal/wishlist');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching wishlist',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Removed from wishlist');
  };

  const addToCart = (productId: string) => {
    toast.success('Added to cart!');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="loading-spinner w-8 h-8"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 md:px-0">
      <div>
        <h1 className="text-4xl font-bold text-white flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Heart className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
          </div>
          My <span className="text-gradient">Wishlist</span>
        </h1>
        <p className="text-white/40 mt-2 ml-16">Exclusive premium items saved for future acquisition.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="group relative glass-dark rounded-3xl border border-white/5 transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px] overflow-hidden">
               <div className="aspect-square bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center p-12 group-hover:scale-105 transition-transform duration-500">
                  <div className="relative">
                    <Package className="w-24 h-24 text-white/5" />
                    <Heart className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
                  </div>
               </div>
               
               <div className="p-8 space-y-4">
                 <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{item.product.name}</h3>
                    <p className="text-white/40 text-sm mt-2 line-clamp-2 leading-relaxed">{item.product.description}</p>
                 </div>
                 
                 <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-6">
                       <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(item.product.price)}</span>
                       <span className="text-[10px] font-mono tracking-widest text-white/20 uppercase">Available Now</span>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm font-bold py-3.5 rounded-2xl transition-all glow active:scale-95 flex items-center justify-center gap-2"
                        onClick={() => addToCart(item.product.id)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Move to Cart
                      </button>
                      <button 
                        className="p-3.5 bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-500 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all active:scale-95"
                        onClick={() => removeFromWishlist(item.id)}
                        title="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-dark rounded-3xl border border-white/5 p-24 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
          <div className="relative inline-block">
             <Heart className="w-24 h-24 text-white/5 mx-auto" />
             <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full -z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Your wishlist is currently empty</h2>
            <p className="text-white/40 max-w-sm mx-auto font-medium">Capture the things that inspire you. Explore our premium collections to start your wishlist.</p>
          </div>
          <button 
            onClick={() => router.push('/shop')}
            className="rounded-2xl bg-white/5 border border-white/10 px-10 py-4 text-sm font-bold text-white hover:bg-white/10 hover:border-primary/50 transition-all glow active:scale-95"
          >
            Discover Premium Products
          </button>
        </div>
      )}
    </div>
  );
}

