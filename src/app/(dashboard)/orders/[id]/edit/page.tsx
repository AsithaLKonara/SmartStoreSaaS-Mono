'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Truck, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
  };
}

export default function OrderEditPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
        setStatus(data.data.status.toLowerCase());
        setNotes(data.data.notes || '');
        setTrackingNumber(data.data.trackingNumber || '');
      }
    } catch (error) {
      toast.error('Order retrieval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, trackingNumber })
      });

      if (response.ok) {
        toast.success('Order synchronized successfully');
        fetchOrder();
      } else {
        toast.error('Failed to update order manifest');
      }
    } catch (error) {
      toast.error('Network error during order sync');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Acquiring order telemetry...</div>;
  if (!order) return <div className="p-12 text-center text-slate-500">Order record not found or access restricted.</div>;

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    processing: <RefreshCw className="w-4 h-4 animate-spin-slow" />,
    shipped: <Truck className="w-4 h-4" />,
    delivered: <CheckCircle2 className="w-4 h-4" />,
    cancelled: <AlertCircle className="w-4 h-4" />
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={`/orders/${order.id}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Order Details
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <ShoppingCart className="w-8 h-8 text-indigo-500" />
             Modify Order: {order.orderNumber}
          </h1>
          <p className="text-slate-400 mt-1">Update fulfillment status, logistics tracking, and internal audit notes.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/20 h-auto"
            onClick={handleSave}
            disabled={isSaving}
           >
             {isSaving ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
             Commit Changes
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Fulfillment Lifecycle</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          status === s 
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                            : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="text-sm font-black uppercase tracking-widest">{s}</span>
                        {(statusIcons as any)[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logistics Info */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Logistics Telemetry</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tracking Number</Label>
                      <div className="relative">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                          placeholder="Carrier Tracking ID" 
                          className="bg-white/5 border-white/5 text-white pl-12 h-12 rounded-xl focus:ring-indigo-500/50"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl">
                       <div className="flex gap-4">
                         <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                           <Package className="w-5 h-5 text-indigo-500" />
                         </div>
                         <div>
                            <p className="text-xs font-black text-white mb-1">Carrier Auto-Sync</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Entering a valid tracking number will trigger automated notifications to the customer.</p>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-4 pt-8 border-t border-white/5">
                 <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                   <FileText className="w-3 h-3" />
                   Internal Merchant Notes
                 </h3>
                 <Textarea 
                    placeholder="Document adjustments, customer requests, or fulfillment delays..." 
                    className="bg-white/5 border-white/5 text-white min-h-[150px] rounded-2xl focus:ring-indigo-500/50 p-6 text-sm font-medium"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                 />
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Order Summary</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-500">Order Placed</span>
                   <span className="text-xs font-black text-slate-900">{format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-500">Customer</span>
                   <span className="text-xs font-black text-slate-900">{order.customer?.name}</span>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                   <span className="text-xs font-bold text-slate-500">Total Value</span>
                   <span className="text-xl font-black text-indigo-600">LKR {order.total.toFixed(2)}</span>
                </div>
              </div>
           </div>
           
           <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Integration Status</p>
                <p className="text-xs font-bold">Synchronized with ERP</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
           </div>
        </div>
      </div>
    </div>
  );
}
