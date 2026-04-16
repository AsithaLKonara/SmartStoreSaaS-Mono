'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  DollarSign,
  Link as LinkIcon,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ProcurementInvoice {
  id: string;
  purchaseOrderId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  createdAt: string;
}

export default function ProcurementInvoicesPage() {
  const [invoices, setInvoices] = useState<ProcurementInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/procurement/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load supplier invoices');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    OVERDUE: 'bg-rose-100 text-rose-800 border-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const filteredInvoices = invoices.filter(i => 
    i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.purchaseOrderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Synchronizing Accounts Payable...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Receipt className="w-8 h-8 text-indigo-600" />
            Supplier Invoices
          </h1>
          <p className="text-slate-500 mt-1">Track and manage payables from strategic procurement partners.</p>
        </div>
        <Button className="rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 font-bold px-6">
          <Plus className="w-4 h-4 mr-2" /> Log Invoice
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice ID or PO Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <EmptyState 
            icon={Receipt}
            title="No Invoices Logged"
            description={searchTerm ? "No billing records match your search." : "You haven't recorded any supplier invoices yet."}
            actionLabel="Register Invoice"
            onAction={() => {}} 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Invoice ID</th>
                  <th className="px-6 py-4">Billing Status</th>
                  <th className="px-6 py-4">Purchase Order</th>
                  <th className="px-6 py-4">Amount Due</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 truncate max-w-[120px]">
                          {invoice.id}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Issued {format(new Date(invoice.createdAt), 'MMM d')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/procurement/purchase-orders/${invoice.purchaseOrderId}`} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:underline">
                        <LinkIcon className="w-3 h-3" />
                        <span className="font-mono text-xs">{invoice.purchaseOrderId.slice(0, 12)}...</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 text-base">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'Immediate'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="sm" className="rounded-xl hover:bg-indigo-50 text-indigo-600 font-bold px-4">
                        Pay Log
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
