'use client';

import { useState } from 'react';
import { User, ShoppingBag, Heart, Star, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerPortalPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8" />
          Customer Portal
        </h1>
        <p className="text-gray-600">Self-service portal for customers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <ShoppingBag className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">My Orders</h3>
          <p className="text-gray-600 text-sm mb-4">Track your orders and view history</p>
          <Button className="w-full">View Orders</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Heart className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wishlist</h3>
          <p className="text-gray-600 text-sm mb-4">Save items for later purchase</p>
          <Button className="w-full">View Wishlist</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Star className="w-10 h-10 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loyalty Points</h3>
          <p className="text-gray-600 text-sm mb-4">View and redeem your points</p>
          <Button className="w-full">View Points</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <User className="w-10 h-10 text-purple-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile</h3>
          <p className="text-gray-600 text-sm mb-4">Manage your account details</p>
          <Button className="w-full">Edit Profile</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Package className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Returns</h3>
          <p className="text-gray-600 text-sm mb-4">Request returns and refunds</p>
          <Button className="w-full">Manage Returns</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Settings className="w-10 h-10 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Settings</h3>
          <p className="text-gray-600 text-sm mb-4">Update preferences and notifications</p>
          <Button className="w-full">Settings</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Order #ORD-2025-001 Delivered</p>
              <p className="text-sm text-gray-600">October 9, 2025</p>
            </div>
            <Button variant="outline" size="sm">View</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
