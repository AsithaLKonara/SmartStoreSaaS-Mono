'use client';

import React, { useState } from 'react';
import { Truck, Calculator, Filter, ArrowRight, DollarSign, Clock, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RateOption {
  id: string;
  carrier: string;
  service: string;
  price: number;
  deliveryTime: string;
  insuranceIcon: boolean;
  isFastest?: boolean;
  isCheapest?: boolean;
}

export default function LogisticsRatesPage() {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<RateOption[]>([]);

  const carriers = [
    { name: 'FedEx', logo: 'F', color: 'bg-orange-500' },
    { name: 'UPS', logo: 'U', color: 'bg-amber-800' },
    { name: 'DHL', logo: 'D', color: 'bg-yellow-400' },
    { name: 'USPS', logo: 'S', color: 'bg-blue-600' }
  ];

  const calculateRates = () => {
    setLoading(true);
    // Simulate API fetch to carrier aggregators
    setTimeout(() => {
      setRates([
        { id: '1', carrier: 'FedEx', service: 'International Priority', price: 124.50, deliveryTime: '2-3 Days', insuranceIcon: true, isFastest: true },
        { id: '2', carrier: 'UPS', service: 'Worldwide Expedited', price: 98.20, deliveryTime: '4-5 Days', insuranceIcon: true },
        { id: '3', carrier: 'DHL', service: 'Express Worldwide', price: 145.00, deliveryTime: '1-2 Days', insuranceIcon: true },
        { id: '4', carrier: 'USPS', service: 'Priority Mail Intl', price: 65.40, deliveryTime: '7-10 Days', insuranceIcon: false, isCheapest: true },
      ]);
      setLoading(false);
      toast.success('Real-time rates synchronized');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-indigo-600" />
            Carrier Sourcing
          </h1>
          <p className="text-slate-500 mt-1">Real-time cross-carrier rate comparison and service provisioning.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl font-bold shadow-sm">
             <Filter className="w-4 h-4 mr-2" /> Logistics Filters
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Shipment Profile</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-slate-700">London, United Kingdom (GB)</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parcel Details</p>
                  <p className="text-sm font-bold text-slate-700">12.5kg • 40x40x20cm</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Value</p>
                  <p className="text-sm font-bold text-slate-700">$1,250.00 (Standard Liability)</p>
                </div>
              </div>
              <Button 
                onClick={calculateRates} 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl h-14 shadow-lg shadow-indigo-600/20"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Sync Live Rates
              </Button>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {rates.length === 0 ? (
            <div className="h-[400px] bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center">
               <Globe className="w-16 h-16 text-slate-200 mb-4 animate-pulse" />
               <h3 className="text-xl font-bold text-slate-400">Regional Rates Suspended</h3>
               <p className="text-slate-400 max-w-xs mt-2 font-medium">Click the synchronization button to acquire real-time distribution quotes from integrated carriers.</p>
            </div>
          ) : (
            rates.map((rate) => (
              <div key={rate.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                <div className="flex items-center gap-6 w-full sm:w-auto">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-inner ${carriers.find(c => c.name === rate.carrier)?.color || 'bg-slate-900'}`}>
                      {carriers.find(c => c.name === rate.carrier)?.logo || rate.carrier[0]}
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-lg font-black text-slate-900">{rate.carrier}</h3>
                       {rate.isFastest && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black uppercase rounded tracking-widest shadow-sm">Fastest</span>}
                       {rate.isCheapest && <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded tracking-widest shadow-sm">Eco Best</span>}
                     </div>
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">{rate.service}</p>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 w-full sm:w-auto sm:justify-end">
                   <div className="text-center sm:text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transit Time</p>
                     <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                       <Clock className="w-4 h-4 text-slate-400" /> {rate.deliveryTime}
                     </p>
                   </div>

                   <div className="text-center sm:text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fee</p>
                     <p className="text-2xl font-black text-indigo-600 transition-transform group-hover:scale-110 duration-300">
                       {formatCurrency(rate.price)}
                     </p>
                   </div>

                   <Button className="rounded-2xl bg-slate-900 hover:bg-black text-white font-black px-6 shadow-xl h-12 flex items-center gap-2">
                      Book Service
                      <ArrowRight className="w-4 h-4" />
                   </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
