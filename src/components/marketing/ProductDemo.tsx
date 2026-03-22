'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, Package, Megaphone, ShoppingCart, ChevronRight } from 'lucide-react';

const tabs = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-purple-400', bg: 'from-purple-500/10' },
  { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-blue-400', bg: 'from-blue-500/10' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-amber-400', bg: 'from-amber-500/10' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
];

const analyticsHeights = [45, 72, 38, 85, 54, 92, 63, 41, 78, 59, 88, 52];

export const ProductDemo = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div id="demo" className="py-24 bg-black/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* Left Side: Copy */}
        <div className="space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            See SmartStore <br />
            <span className="text-gradient">In Action</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Experience how the AI-driven operating system simplifies your daily tasks. One dashboard to rule every channel.
          </p>
          
          <div className="space-y-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 group',
                  activeTab === tab.id 
                    ? 'border-primary/50 bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]' 
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                )}
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                    activeTab === tab.id ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'
                  )}>
                    <tab.icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    'text-xl font-bold transition-colors',
                    activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  )}>
                    {tab.label}
                  </span>
                </div>
                <ChevronRight className={cn(
                  'w-5 h-5 transition-transform duration-300',
                  activeTab === tab.id ? 'text-primary rotate-0 translate-x-2' : 'text-gray-600 -rotate-90'
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Visual Preview */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-1000" />
          
          <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden aspect-[4/3] shadow-2xl transition-all duration-500 group-hover:scale-[1.01]">
            <div className="p-8 h-full flex flex-col">
              {/* Tab Header inside Preview */}
              <div className="mb-6 flex space-x-2">
                <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Preview: {activeTab.toUpperCase()} Mode
                </div>
              </div>

              {/* Dynamic Content Mockup */}
              {activeTab === 'analytics' && (
                <div className="flex-1 space-y-6 animate-fade-in">
                  <div className="h-40 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl relative overflow-hidden ring-1 ring-white/5">
                    <div className="absolute inset-0 flex items-end px-4 space-x-1">
                      {analyticsHeights.map((height, i) => (
                        <div key={i} className="flex-1 bg-primary/20 rounded-t-sm animate-pulse" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-white/5 rounded-2xl" />
                    <div className="h-24 bg-white/5 rounded-2xl" />
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="flex-1 space-y-4 animate-fade-in">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-16 bg-white/5 rounded-2xl flex items-center px-4 space-x-4 border border-white/5">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg" />
                      <div className="flex-1 h-3 bg-white/10 rounded-full" />
                      <div className="w-16 h-6 bg-emerald-500/20 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'marketing' && (
                <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-amber-500/20 animate-pulse">
                    <Megaphone className="w-10 h-10 text-amber-500" />
                  </div>
                  <div className="h-4 w-48 bg-white/10 rounded-full mb-4" />
                  <div className="h-3 w-32 bg-white/5 rounded-full" />
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="flex-1 animate-fade-in">
                  <div className="h-full bg-white/5 rounded-2xl border border-white/5 p-6 space-y-4">
                     {[1,2,3].map(i => (
                       <div key={i} className="flex items-center space-x-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                         <div className="w-8 h-8 rounded-full bg-indigo-500/20" />
                         <div className="flex-1 space-y-2">
                           <div className="h-3 w-2/3 bg-white/10 rounded-full" />
                           <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
