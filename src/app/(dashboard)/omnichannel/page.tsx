'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, ShoppingBag, Share2, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OmnichannelDashboard() {
  const { data: session } = useSession();

  const modules = [
    {
      title: 'POS System',
      description: 'In-store point of sale',
      icon: Store,
      href: '/pos',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Marketplaces',
      description: 'Amazon, eBay, Etsy integrations',
      icon: ShoppingBag,
      href: '/omnichannel/marketplaces',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Social Commerce',
      description: 'Facebook, Instagram, TikTok',
      icon: Share2,
      href: '/omnichannel/social',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Omnichannel Management</h1>
        <p className="text-gray-600 mt-2">Manage all your sales channels</p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Open Module
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">Active Channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-gray-600">Multi-channel Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">Synced Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">Pending Orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

