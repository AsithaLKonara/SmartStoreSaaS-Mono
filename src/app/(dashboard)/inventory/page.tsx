"use client";

import { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Zap,
  RefreshCw,
  Truck,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface InventoryItem {
  id: string;
  name: string; // Changed from 'product' to match API
  sku: string;
  stock: number;
  minStock: number; // Changed from 'reorderLevel' to match API
  price: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []); // Success response wraps in .data
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching inventory',
        error: error instanceof Error ? error : new Error(String(error))
      });
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const runAutopilot = async () => {
    setAutopilotRunning(true);
    const toastId = toast.loading('AI Autopilot is analyzing stock and trends...');
    try {
      const res = await fetch('/api/inventory/autopilot/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Autopilot complete: ${data.data.decisions.length} reorders triggered`, { id: toastId });
        fetchInventory();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('AI Autopilot encountered an issue', { id: toastId });
    } finally {
      setAutopilotRunning(false);
    }
  };

  const lowStock = items.filter(i => i.stock <= i.minStock);
  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            Inventory Hub
          </h1>
          <p className="text-gray-500 mt-1">Autonomous stock management & procurement</p>
        </div>
        <Button
          onClick={runAutopilot}
          disabled={autopilotRunning}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          {autopilotRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
          Run AI Autopilot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="inventory-stats">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active SKUs</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Critical Alerts</p>
            <p className="text-2xl font-bold">{lowStock.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Healthy stock</p>
            <p className="text-2xl font-bold">{items.length - lowStock.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products, SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Product Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Current Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Safe Level</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("font-bold", item.stock <= item.minStock ? "text-red-500" : "text-slate-700")}>
                      {item.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{item.minStock} units</td>
                  <td className="px-6 py-4">
                    {item.stock <= item.minStock ? (
                      <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Resupply Needed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider w-fit">
                        Strategic Stable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 h-auto">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper for class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
