'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  PlusCircle, 
  Settings2, 
  Coins, 
  Users, 
  UserPlus, 
  ShoppingBag
} from 'lucide-react';

export default function LoyaltyRulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earning Rules</h1>
          <p className="text-slate-500">Define how customers earn points across your storefront.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Purchase Rule */}
        <Card className="border-indigo-100 bg-indigo-50/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Purchase Multiplier</CardTitle>
            </div>
            <Switch defaultChecked />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Reward customers based on the total amount spent on a single order.</p>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Points per $1</label>
                <Input type="number" defaultValue={5} className="mt-1" />
              </div>
              <div className="flex items-center pt-5">
                <Settings2 className="w-4 h-4 text-slate-300 mr-2" />
                <span className="text-xs text-slate-500">Standard Rule</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signup Rule */}
        <Card className="border-emerald-100 bg-emerald-50/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Welcome Points</CardTitle>
            </div>
            <Switch defaultChecked />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">One-time reward when a customer creates an account on your store.</p>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Reward Value</label>
                <div className="relative mt-1">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <Input type="number" defaultValue={500} className="pl-10" />
                </div>
              </div>
              <div className="flex items-center pt-5">
                <span className="text-xs text-slate-500">Fixed Reward</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Rule */}
        <Card className="border-amber-100 bg-amber-50/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Users className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Referral Bonus</CardTitle>
            </div>
            <Switch defaultChecked />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Reward referring customers when their friends complete their first purchase.</p>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Referrer Reward</label>
                <Input type="number" defaultValue={1000} className="mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Friend Reward</label>
                <Input type="number" defaultValue={250} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
