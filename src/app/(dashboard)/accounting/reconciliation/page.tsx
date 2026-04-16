'use client';

import React, { useState } from 'react';
import { 
  Library, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  Banknote,
  Search,
  Filter,
  CheckSquare,
  Square,
  Zap,
  RefreshCw,
  FileSearch,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'RECONCILED';
  reference?: string;
}

export default function ReconciliationPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock ledger data for high-fidelity UI
  const ledgerData: Transaction[] = [
    { id: 'tx_1', date: '2026-04-12', description: 'Stripe Payout - ORD-4422', amount: 1240.50, type: 'CREDIT', status: 'PENDING', reference: 'ch_3N4k2...' },
    { id: 'tx_2', date: '2026-04-12', description: 'Warehouse Utility Payment', amount: 450.00, type: 'DEBIT', status: 'RECONCILED' },
    { id: 'tx_3', date: '2026-04-13', description: 'Refund - ORD-4410', amount: 89.99, type: 'DEBIT', status: 'PENDING', reference: 'rf_1O9j3...' },
    { id: 'tx_4', date: '2026-04-14', description: 'Supplier Payment - Global Logistics', amount: 2300.00, type: 'DEBIT', status: 'PENDING' },
    { id: 'tx_5', date: '2026-04-15', description: 'POS Storefront Daily Close', amount: 567.20, type: 'CREDIT', status: 'PENDING' }
  ];

  const handleReconcile = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select transactions to reconcile');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate backend reconciliation routine
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`${selectedIds.size} entries successfully audited against bank manifest`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error('Reconciliation batch failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/accounting" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Financial Hub
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <Library className="w-8 h-8 text-indigo-500" />
             Bank Ledger Reconciliation
          </h1>
          <p className="text-slate-400 mt-1">Audit and align your internal transaction manifest with external bank statements.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest px-6 h-12">
              <RefreshCw className="w-4 h-4 mr-2" /> Sync Statement
           </Button>
           <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-xl h-12 shadow-lg shadow-indigo-600/20"
            onClick={handleReconcile}
            disabled={isProcessing || selectedIds.size === 0}
           >
             {isProcessing ? <RefreshCw className="mr-2 animate-spin w-4 h-4" /> : <ShieldCheck className="mr-2 w-4 h-4" />}
             Reconcile {selectedIds.size > 0 ? selectedIds.size : ''} Entries
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
           {/* Filters Bar */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                   placeholder="Search by description or SKU..." 
                   className="pl-12 h-14 bg-slate-900 border-white/5 text-white rounded-2xl focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="w-full rounded-2xl h-14 font-black border-white/5 hover:bg-white/5 flex items-center gap-2">
                   <Filter className="w-4 h-4" /> Filters
                </Button>
              </div>
           </div>

           {/* Ledger Table */}
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-6 w-12 text-center"></th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Description</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ledgerData.map((tx) => (
                    <tr 
                      key={tx.id} 
                      className={`hover:bg-white/5 transition-colors cursor-pointer group ${selectedIds.has(tx.id) ? 'bg-indigo-600/10' : ''}`}
                      onClick={() => toggleSelect(tx.id)}
                    >
                      <td className="p-6 text-center">
                        {tx.status === 'RECONCILED' ? (
                          <div className="w-5 h-5 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 mx-auto">
                             <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </div>
                        ) : selectedIds.has(tx.id) ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400 mx-auto" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-700 mx-auto group-hover:text-slate-500 transition-colors" />
                        )}
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-black text-slate-400">{tx.date}</span>
                      </td>
                      <td className="p-6">
                         <p className="text-sm font-bold text-white mb-1">{tx.description}</p>
                         <p className="text-[9px] font-mono text-slate-500">{tx.reference || 'SYSTEM_INTERNAL_ADJUST'}</p>
                      </td>
                      <td className="p-6 text-right">
                         <span className={`text-sm font-black ${tx.type === 'DEBIT' ? 'text-rose-500' : 'text-emerald-500'}`}>
                           {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount)}
                         </span>
                      </td>
                      <td className="p-6 text-center">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                           tx.status === 'RECONCILED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                         }`}>
                           {tx.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>

        <div className="space-y-6">
           {/* Summary Stats */}
           <div className="bg-indigo-600 rounded-[2.5rem] border border-white/5 p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                <h3 className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Audit Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="opacity-80">Ledger Balance</span>
                    <span>{formatCurrency(124500.00)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="opacity-80">Bank Statement</span>
                    <span>{formatCurrency(123890.50)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-xs font-black uppercase tracking-widest">Discrepancy</span>
                    <span className="text-xl font-black text-amber-300">{formatCurrency(609.50)}</span>
                  </div>
                </div>
                <Button className="w-full bg-white text-indigo-600 font-black rounded-xl h-12 shadow-inner">
                   Analyze Gaps
                </Button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <ArrowRightLeft className="w-24 h-24" />
              </div>
           </div>

           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <History className="w-5 h-5 text-indigo-600" />
                 </div>
                 <h3 className="text-sm font-black text-slate-900">Automation Mode</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Auto-reconciliation can resolve 85% of matches without human verification based on correlation ID match.</p>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Pilot</span>
                 <div className="w-12 h-6 bg-emerald-500 rounded-full flex items-center justify-end p-1 transition-all">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
