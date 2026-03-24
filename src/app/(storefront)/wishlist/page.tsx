'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="w-8 h-8" />
          My Wishlist
        </h1>
        <p className="text-gray-600">Saved items for later</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.product.description}</p>
                <p className="text-2xl font-bold text-primary mb-4">{formatCurrency(item.product.price)}</p>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => addToCart(item.product.id)}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => removeFromWishlist(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">Save items you love for later!</p>
          <Button onClick={() => window.location.href = '/portal/shop'}>
            Start Shopping
          </Button>
        </div>
      )}
    </div>
  );
}

