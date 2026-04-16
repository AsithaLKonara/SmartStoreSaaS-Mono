'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Gift, 
  Tag, 
  Truck, 
  CreditCard,
  Edit2
} from 'lucide-react';

export default function LoyaltyRewardsPage() {
  const rewards = [
    {
      id: '1',
      name: '$5.00 Off Coupon',
      points: 500,
      type: 'DISCOUNT',
      icon: Tag,
      active: true,
      redeemed: 156
    },
    {
      id: '2',
      name: 'Free Shipping',
      points: 1000,
      type: 'SHIPPING',
      icon: Truck,
      active: true,
      redeemed: 89
    },
    {
      id: '3',
      name: 'Exclusive Gift Box',
      points: 5000,
      type: 'PHYSICAL',
      icon: Gift,
      active: false,
      redeemed: 12
    },
    {
      id: '4',
      name: '$50.00 Store Credit',
      points: 4500,
      type: 'CREDIT',
      icon: CreditCard,
      active: true,
      redeemed: 45
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reward Tiers</h1>
          <p className="text-slate-500">Create the incentives that keep your customers coming back.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Reward
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rewards.map((reward) => {
          const Icon = reward.icon;
          return (
            <Card key={reward.id} className="flex flex-col border-slate-200 hover:border-indigo-200 transition-all group">
              <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 transition-colors`}>
                  <Icon className="w-6 h-6" />
                </div>
                <Badge variant={reward.active ? "default" : "secondary"}>
                  {reward.active ? 'Active' : 'Disabled'}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1">
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{reward.name}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-lg font-black text-amber-500">{reward.points}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Points required</span>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Used {reward.redeemed} times by shoppers.
                </p>
              </CardContent>
              <CardFooter className="p-4 border-t border-slate-50 bg-slate-50/10">
                <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-indigo-600">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Reward
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
