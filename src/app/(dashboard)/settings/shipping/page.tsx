'use client';

import { useState } from 'react';
import { Truck, MapPin, Package, Globe, Plus, Trash2, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ShippingSettingsPage() {
  const [shippingZones, setShippingZones] = useState([
    { id: '1', name: 'Domestic (Standard)', region: 'Local Country', methods: 2, isActive: true },
    { id: '2', name: 'International (Express)', region: 'Global', methods: 1, isActive: true },
    { id: '3', name: 'Store Pickup', region: 'Specific Locations', methods: 1, isActive: true }
  ]);

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Truck className="w-10 h-10 text-primary" />
            Shipping & Logistics
          </h1>
          <p className="text-slate-400">
            Define shipping zones, delivery methods, and fulfillment rules for your organization.
          </p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 mr-2" /> Add Shipping Zone
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fulfillment Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-dark rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Active Shipping Zones
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {shippingZones.map((zone) => (
                <div key={zone.id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">{zone.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {zone.region}</span>
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {zone.methods} Methods</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">Manage</Button>
                    <Button size="icon" variant="ghost" className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-dark rounded-xl border border-white/10 p-6 space-y-6">
             <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" /> Default Fulfillment Rules
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300">Free Shipping Threshold</label>
                    <input type="text" defaultValue="$150.00" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white w-24 text-right" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300">Default Handling Fee</label>
                    <input type="text" defaultValue="$5.00" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white w-24 text-right" />
                  </div>
                </div>
                <div className="space-y-4 border-l border-white/5 pl-6">
                   <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="accent-primary" />
                      <span className="text-sm text-slate-300">Enable local pickup</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="accent-primary" />
                      <span className="text-sm text-slate-300">Request phone for delivery</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <input type="checkbox" className="accent-primary" />
                      <span className="text-sm text-slate-300">Restrict P.O. Boxes</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Global Logistics Sidebar */}
        <div className="space-y-6">
           <div className="glass-dark rounded-xl border border-white/10 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Warehouse Location
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your primary shipping origin is used to calculate taxes and real-time carrier rates.
              </p>
              <div className="p-4 bg-white/5 rounded-lg text-sm text-slate-300 space-y-1">
                <p className="font-bold text-white">Main Distribution Center</p>
                <p>123 Commerce Way</p>
                <p>Silicon Valley, CA 94025</p>
                <p>United States</p>
              </div>
              <Button variant="outline" className="w-full glass-dark border-white/10 text-white text-xs">Update Origin</Button>
           </div>

           <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <p className="text-xs text-blue-300/80 leading-relaxed">
              Shipping rates are calculated dynamically based on weight, dimensions, and destination zone. Ensure product dimensions are accurate in the catalog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
