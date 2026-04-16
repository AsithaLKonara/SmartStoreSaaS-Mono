'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, ArrowRightLeft, TrendingDown, TrendingUp, Search, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'ADJUSTMENT' | 'TRANSFER' | 'SALE' | 'RECEIPT' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
  user: { name: string };
}

export default function InventoryMovementsPage() {
  const { data: session } = useSession();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/inventory/movements');
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (error) {
      toast.error('Failed to load movements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ArrowRightLeft className="w-10 h-10 text-primary" />
            Stock Movements
          </h1>
          <p className="text-slate-400">
            Real-time ledger of all inventory adjustments, transfers, and sales.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="glass-dark border-white/10 text-white">
            <Calendar className="w-4 h-4 mr-2" /> Last 30 Days
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            Export Ledger
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-dark p-4 rounded-xl border border-white/10 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            placeholder="Search by product or reason..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-all"
          />
        </div>
        <select className="bg-white/5 border border-white/10 text-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary/50 cursor-pointer">
          <option value="all">All Types</option>
          <option value="sale">Sales</option>
          <option value="receipt">Receipts</option>
          <option value="adjustment">Adjustments</option>
        </select>
        <Button variant="outline" size="icon" className="glass-dark border-white/10">
          <Filter className="w-4 h-4 text-white" />
        </Button>
      </div>

      <div className="glass-dark rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Delta</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-6 py-4 h-12 bg-white/5"></td>
                </tr>
              ))
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                  No stock movements recorded in the selected period.
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{m.productName}</span>
                      <span className="text-[10px] text-slate-500 font-mono italic">{m.productId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight 
                      ${m.type === 'SALE' ? 'bg-orange-500/10 text-orange-400' : ''}
                      ${m.type === 'RECEIPT' ? 'bg-green-500/10 text-green-400' : ''}
                      ${m.type === 'ADJUSTMENT' ? 'bg-blue-500/10 text-blue-400' : ''}
                      ${m.type === 'RETURN' ? 'bg-red-500/10 text-red-400' : ''}
                      ${m.type === 'TRANSFER' ? 'bg-purple-500/10 text-purple-400' : ''}
                    `}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span>
                      <span className="text-[10px] text-slate-500">
                        {m.previousStock} → {m.newStock}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {m.quantity > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-500/50" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500/50" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 italic max-w-[200px] truncate">
                    {m.reason}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {m.user.name.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-300">{m.user.name}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
