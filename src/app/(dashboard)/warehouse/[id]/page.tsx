'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  MapPin, 
  Package, 
  Cpu, 
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;
  
  const [warehouse, setWarehouse] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchWarehouseData();
  }, [warehouseId]);

  const fetchWarehouseData = async () => {
    try {
      const [wRes, iRes] = await Promise.all([
        fetch(`/api/warehouses/${warehouseId}`),
        fetch('/api/warehouses/inventory')
      ]);

      const wData = await wRes.json();
      const iData = await iRes.json();

      if (wData.success) {
        setWarehouse(wData.data);
      } else {
        toast.error('Warehouse not found');
        router.push('/warehouse');
        return;
      }

      if (iData.success) {
        // Find specific inventory for this warehouse from the aggregation API
        const specificWarehouse = iData.data.warehouses.find((w: any) => w.id === warehouseId);
        setInventory(specificWarehouse?.inventory || []);
      }
    } catch (err) {
      toast.error('Failed to load warehouse details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/warehouses/${warehouseId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Warehouse decommissioned successfully');
        router.push('/warehouse');
      }
    } catch (err) {
      toast.error('Failed to delete warehouse');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading secure logistics data...</div>;
  if (!warehouse) return null;

  const address = typeof warehouse.address === 'string' 
    ? JSON.parse(warehouse.address) 
    : (warehouse.address || {});

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/warehouse" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-600" />
              {warehouse.name}
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {address.street}, {address.city}, {address.country}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold px-6">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Layout
          </Button>
          <Button 
            onClick={() => setIsDeleteOpen(true)}
            variant="outline" 
            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold px-6"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Decommission
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Statistics Widgets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" /> IoT Connectivity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Active Sensors</span>
                <span className="font-bold text-slate-900">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Gateway Status</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest">
                  Online
                </span>
              </div>
              <Button variant="ghost" className="w-full text-indigo-600 text-xs font-bold hover:bg-indigo-50 mt-2">
                Manage Devices
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" /> Synchronization
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Last Sync</span>
                <span className="font-mono text-xs">Recently</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                Local cache is current with cloud distribution layer.
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Mapping */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Physical Inventory Map
              </h2>
            </div>

            {inventory.length === 0 ? (
              <EmptyState 
                icon={Box}
                title="No Products Stored"
                description="This distribution center currently has no physical inventory assigned. Use the Add Inventory tool to provision stock."
                actionLabel="Inbound Shipment"
                actionHref="/inventory"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 text-[10px] text-slate-500 uppercase font-black tracking-[0.1em] border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Item Identification</th>
                      <th className="px-6 py-4">Physical Quantity</th>
                      <th className="px-6 py-4">Stored At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventory.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-black text-lg text-indigo-600">
                            {item.quantity || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold ml-2">Units</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {item.binLocation || 'Unassigned Zone'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Decommission Warehouse?"
        description={`Are you sure you want to decommission ${warehouse.name}? This will hide the facility from active logistics routes.`}
        confirmText="Confirm Decommission"
        variant="danger"
      />

    </div>
  );
}
