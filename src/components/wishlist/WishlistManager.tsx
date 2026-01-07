'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Plus, Trash2, Share2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface Wishlist {
  id: string;
  name: string;
  isPublic: boolean;
  shareCode?: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  notes?: string;
  addedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    comparePrice?: number;
    media: Array<{
      id: string;
      url: string;
      altText?: string;
      isPrimary: boolean;
    }>;
    productVariants: Array<{
      id: string;
      name: string;
      value: string;
      price?: number;
    }>;
  };
}

interface WishlistManagerProps {
  customerId: string;
  onAddToCart?: (productId: string) => void;
}

export default function WishlistManager({ customerId, onAddToCart }: WishlistManagerProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const fetchWishlists = useCallback(async () => {
    try {
      const response = await fetch(`/api/wishlist?customerId=${customerId}`);
      const data = await response.json();
      setWishlists(data.wishlists || []);
    } catch (error) {
      // Error fetching wishlists - could implement proper error handling
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

  const createWishlist = async () => {
    if (!newWishlistName.trim()) return;

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWishlistName,
          customerId,
          isPublic
        }),
      });

      if (response.ok) {
        const newWishlist = await response.json();
        setWishlists([newWishlist, ...wishlists]);
        setNewWishlistName('');
        setIsPublic(false);
        setShowCreateForm(false);
      }
    } catch (error) {
      // Error creating wishlist - could implement proper error handling
    }
  };

  const deleteWishlist = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to delete this wishlist?')) return;

    try {
      const response = await fetch(`/api/wishlist?id=${wishlistId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWishlists(wishlists.filter(w => w.id !== wishlistId));
      }
    } catch (error) {
      // Error deleting wishlist - could implement proper error handling
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const response = await fetch(`/api/wishlist/items?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchWishlists(); // Refresh wishlists
      }
    } catch (error) {
      // Error removing item from wishlist - could implement proper error handling
    }
  };

  const shareWishlist = (wishlist: Wishlist) => {
    if (wishlist.isPublic && wishlist.shareCode) {
      const shareUrl = `${window.location.origin}/wishlist/${wishlist.shareCode}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Wishlist link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Wishlists
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Wishlist
        </button>
      </div>

      {/* Create Wishlist Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Create New Wishlist</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wishlist Name
              </label>
              <input
                type="text"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter wishlist name"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Make this wishlist public (shareable)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createWishlist}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wishlists */}
      {wishlists.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No wishlists yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create your first wishlist to start saving your favorite items
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {wishlists.map((wishlist) => (
            <div key={wishlist.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {wishlist.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {wishlist.items.length} items • Created {new Date(wishlist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {wishlist.isPublic && (
                      <button
                        onClick={() => shareWishlist(wishlist)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Share wishlist"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteWishlist(wishlist.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Wishlist Items */}
              <div className="p-6">
                {wishlist.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No items in this wishlist yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="aspect-square mb-3">
                          {item.product.media.length > 0 ? (
                            <Image
                              src={item.product.media[0].url}
                              alt={item.product.media[0].altText || item.product.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                              <Heart className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-blue-600">
                            {formatCurrency(item.product.price)}
                          </span>
                          {item.product.comparePrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(item.product.comparePrice)}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {item.notes}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAddToCart?.(item.product.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
