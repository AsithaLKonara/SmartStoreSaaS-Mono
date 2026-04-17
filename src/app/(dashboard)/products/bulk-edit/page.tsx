'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckSquare, 
  Square, 
  Search, 
  Trash2, 
  Zap, 
  DollarSign, 
  Eye, 
  EyeOff,
  RefreshCw,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
}

export default function BulkEditProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk Actions State
  const [priceModifier, setPriceModifier] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBulkAction = async (operation: string, extraData: any = {}) => {
    if (selectedIds.size === 0) {
      toast.error('Select products to apply changes');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'PRODUCT',
          operation,
          data: Array.from(selectedIds),
          ...extraData
        })
      });

      if (response.ok) {
        toast.success(`Bulk ${operation.toLowerCase()} operation queued`);
        // In a real scenario, we'd wait for a socket update, but for now we refresh
        setTimeout(fetchProducts, 2000);
      } else {
        toast.error('Bulk operation failed to queue');
      }
    } catch (error) {
      toast.error('Connection error during bulk update');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Synchronizing catalog metadata...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/products" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <Zap className="w-8 h-8 text-amber-400" />
             Mass Catalog Ops
          </h1>
          <p className="text-slate-400 mt-1">High-throughput bulk pricing and status modifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Bulk Control Panel */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-6">Selection Control</h3>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4">
                     <p className="text-2xl font-black">{selectedIds.size}</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase">Items Selected</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest"
                    onClick={toggleSelectAll}
                  >
                    {selectedIds.size === filteredProducts.length ? 'Clear Selection' : 'Select All Filtered'}
                  </Button>
                </div>

                <div className="space-y-4 pt-8 border-t border-white/5">
                   <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Actions</h3>
                   
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase text-slate-500">Price Adjustment (%)</Label>
                     <div className="flex gap-2">
                        <Input 
                          placeholder="+10 or -5" 
                          className="bg-white/5 border-white/10 text-white rounded-xl h-10"
                          value={priceModifier}
                          onChange={(e) => setPriceModifier(e.target.value)}
                        />
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                          onClick={() => handleBulkAction('ADJUST_PRICE', { modifier: priceModifier })}
                          disabled={!priceModifier || isProcessing}
                        >
                          Apply
                        </Button>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                     <Button 
                        variant="secondary"
                        className="rounded-xl flex flex-col h-20 items-center justify-center gap-2 group"
                        onClick={() => handleBulkAction('ACTIVATE')}
                        disabled={isProcessing}
                      >
                        <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase">Activate</span>
                     </Button>
                     <Button 
                        variant="secondary"
                        className="rounded-xl flex flex-col h-20 items-center justify-center gap-2 group"
                        onClick={() => handleBulkAction('DEACTIVATE')}
                        disabled={isProcessing}
                      >
                        <EyeOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase">Deactivate</span>
                     </Button>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Product Selection List */}
        <div className="lg:col-span-3 space-y-4">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
             <Input 
               placeholder="Filter by name or SKU..." 
               className="pl-12 h-14 bg-white/5 border-white/5 text-white rounded-3xl focus:ring-indigo-500/50"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>

           <div className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-6 w-12 text-center"></th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Info</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((p) => (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedIds.has(p.id) ? 'bg-indigo-600/10' : ''}`}
                      onClick={() => toggleSelect(p.id)}
                    >
                      <td className="p-6 text-center">
                        {selectedIds.has(p.id) ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-700" />
                        )}
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-bold text-white">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{p.isActive ? 'Active' : 'Archived'}</span>
                        </div>
                      </td>
                      <td className="p-6">
                         <span className="text-xs font-mono text-slate-400">{p.sku}</span>
                      </td>
                      <td className="p-6 text-right">
                         <p className="text-sm font-black text-white">{formatCurrency(p.price)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-20 text-center">
                   <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                   <p className="text-slate-500 font-bold">No products matching the filter.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
