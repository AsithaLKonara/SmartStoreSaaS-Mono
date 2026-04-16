'use client';

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Hash, ArrowLeft, RefreshCw, ExternalLink, Package, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackingTimeline } from '@/components/logistics/TrackingTimeline';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery: string;
  actualDelivery: string;
  notes: string;
  address: any;
  courier: {
    name: string;
  };
  statusHistory: Array<{
    status: string;
    notes: string;
    createdAt: string;
  }>;
}

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipment();
  }, [params.id]);

  const fetchShipment = async () => {
    try {
      const response = await fetch(`/api/shipping/shipments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setShipment(data.data);
      } else {
        toast.error('Shipment not found');
      }
    } catch (error) {
      toast.error('Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse text-lg">Acquiring logistics telemetry...</div>;
  if (!shipment) return <div className="p-12 text-center text-slate-500 font-medium">Shipment record missing or restricted.</div>;

  const timelineEvents = shipment.statusHistory.map((h, i) => ({
    status: h.status.replace('_', ' '),
    location: shipment.address?.city || 'Origin Facility',
    timestamp: format(new Date(h.createdAt), 'MMM d, HH:mm'),
    description: h.notes || 'Status updated via automated gate scan.',
    isCompleted: true,
    isCurrent: i === 0
  }));

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 mb-2 font-bold transition-all text-xs uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Logistics Queue
          </Link>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-indigo-600" />
            Shipment Tracker
          </h1>
          <p className="text-slate-500 mt-1">Real-time chain of custody monitoring for active distribution.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl font-bold shadow-sm" onClick={fetchShipment}>
             <RefreshCw className="w-4 h-4 mr-2" /> Sync Status
           </Button>
           <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold px-6 text-white border-none">
             Issue BOL
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                    <Package className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tracking Number</p>
                    <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">{shipment.trackingNumber || 'PENDING ASSIGNMENT'}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Carrier</p>
                   <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg font-black text-xs uppercase tracking-wider">{shipment.courier?.name || 'In-House'}</span>
                </div>
             </div>

             <div className="mb-8">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                 Live Transit Timeline
               </h3>
               {timelineEvents.length > 0 ? (
                 <TrackingTimeline events={timelineEvents} />
               ) : (
                 <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                   <p className="font-bold text-slate-500">Manifest provisioned. Waiting for first facility scan.</p>
                 </div>
               )}
             </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600/30 transition-all duration-1000" />
              <div className="relative z-10">
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-6">Fulfillment Meta</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-rose-500" /> Destination
                    </p>
                    <p className="text-sm font-medium leading-relaxed">
                      {shipment.address?.street}<br />
                      {shipment.address?.city}, {shipment.address?.postalCode}<br />
                      {shipment.address?.country}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">ETA</p>
                      <p className="text-sm font-black italic">
                        {shipment.estimatedDelivery ? format(new Date(shipment.estimatedDelivery), 'MMM d') : 'Calculating...'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Priority</p>
                      <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-md border border-white/5 uppercase">EXPRESS</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4" /> Insured
                   </span>
                   <ExternalLink className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer transition-colors" />
                </div>
              </div>
           </div>
           
           <div className="bg-white rounded-[2rem] border border-slate-200 p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carrier Proof</p>
                <p className="text-sm font-black text-slate-900">Signed Documentation</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-xl hover:bg-slate-50">
                 <ExternalLink className="w-4 h-4 text-slate-400" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
