'use client';

import React, { useState } from 'react';
import { 
  Undo2, 
  ArrowLeft, 
  Search, 
  Filter, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Package,
  FileText,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RefundRecord {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  reason: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  paymentMethod: string;
}

export default function RefundsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock refund ledger for high-fidelity UI
  const reports: RefundRecord[] = [
    { id: 'rf_101', orderNumber: 'ORD-4422', customer: 'Janith Perera', amount: 890.00, reason: 'Defective hardware', status: 'COMPLETED', createdAt: '2026-04-12T10:00:00Z', paymentMethod: 'Stripe' },
    { id: 'rf_102', orderNumber: 'ORD-4410', customer: 'Amal Silva', amount: 120.50, reason: 'Logistics delay', status: 'PENDING', createdAt: '2026-04-14T14:30:00Z', paymentMethod: 'Stripe' },
    { id: 'rf_103', orderNumber: 'ORD-4395', customer: 'Sarah Khan', amount: 3500.00, reason: 'Wrong item dimensions', status: 'FAILED', createdAt: '2026-04-15T09:12:00Z', paymentMethod: 'Bank Transfer' },
    { id: 'rf_104', orderNumber: 'ORD-4430', customer: 'Dilshan M.', amount: 450.00, reason: 'Duplicate charge', status: 'PENDING', createdAt: '2026-04-16T11:00:00Z', paymentMethod: 'COD / Store Credit' }
  ];

  const handleProcessRefund = async (id: string) => {
    setIsProcessing(true);
    try {
      // Bridging Stub API: api/payments/refund
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Capital reversal initiated with primary gateway');
    } catch (error) {
      toast.error('Gatway rejection: Unable to process reversal');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusIcons = {
    COMPLETED: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    PENDING: <Clock className="w-4 h-4 text-amber-500 animate-pulse" />,
    FAILED: <XCircle className="w-4 h-4 text-rose-500" />
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/payments" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Payment Ledger
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <Undo2 className="w-8 h-8 text-indigo-500" />
             Capital Reversal Command
          </h1>
          <p className="text-slate-400 mt-1">Unified management of inbound refund requests and automated gateway reversals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Refund Queue */}
        <div className="lg:col-span-3 space-y-6">
           <div className="relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
             <Input 
                placeholder="Search by Order ID or Customer globally..." 
                className="pl-14 h-16 bg-slate-900 border-white/5 text-white rounded-3xl focus:ring-indigo-500/50 shadow-2xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           <div className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Order & Intent</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Value</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/5 transition-all group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                              <Package className="w-5 h-5 text-indigo-500" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-white mb-1">{report.orderNumber}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">{report.reason}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-8">
                         <p className="text-xs font-bold text-slate-300">{report.customer}</p>
                         <p className="text-[9px] font-mono text-slate-600">via {report.paymentMethod}</p>
                      </td>
                      <td className="p-8 text-right">
                         <p className="text-sm font-black text-white">{formatCurrency(report.amount)}</p>
                         <p className="text-[9px] font-bold text-slate-500 uppercase">{formatDate(report.createdAt)}</p>
                      </td>
                      <td className="p-8 text-center">
                         <div className="flex flex-col items-center gap-1">
                            {statusIcons[report.status]}
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{report.status}</span>
                         </div>
                      </td>
                      <td className="p-8 text-right">
                         <div className="flex items-center justify-end gap-2">
                            {report.status === 'PENDING' ? (
                               <Button 
                                  size="sm" 
                                  className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black text-[10px] uppercase h-9 px-4"
                                  onClick={() => handleProcessRefund(report.id)}
                                  disabled={isProcessing}
                                >
                                  Process Reversal
                               </Button>
                            ) : (
                               <Button size="sm" variant="ghost" className="rounded-xl font-black text-[10px] uppercase h-9 px-4 text-slate-500 hover:bg-white/5">
                                  Audit Logs
                               </Button>
                            )}
                            <button className="p-2 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-slate-500">
                               <ExternalLink className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">Security Protocol</h3>
                  <ShieldCheck className="w-5 h-5 opacity-60" />
                </div>
                <div className="space-y-4">
                  <p className="text-2xl font-black leading-tight">Fraud Mitigation Active</p>
                  <p className="text-xs opacity-80 leading-relaxed font-medium">All refunds exceeding LKR 10,000.00 require dual-factor authorization from a Senior Accountant.</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/5 space-y-2">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase">
                      <span>Gateway Latency</span>
                      <span className="text-emerald-300">Optimum</span>
                   </div>
                   <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div className="w-full bg-emerald-400 h-full" />
                   </div>
                </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[2rem] border border-white/5 p-8 space-y-6 shadow-xl">
              <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest pb-4 border-b border-white/5">Snapshot</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                       <CreditCard className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">MTD Reversals</p>
                      <p className="text-lg font-black text-white">{formatCurrency(4890.50)}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                       <FileText className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Open Disputes</p>
                      <p className="text-lg font-black text-white">02 Items</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
