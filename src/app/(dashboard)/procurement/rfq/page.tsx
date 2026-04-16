'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  User, 
  ArrowRight,
  RefreshCw,
  Send,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface RFQItem {
  productId: string;
  quantity: number;
  specifications: string;
}

interface RFQ {
  id: string;
  title: string;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'ACCEPTED' | 'CLOSED';
  deadline: string;
  createdAt: string;
  createdBy: string;
}

export default function ProcurementRFQPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      const response = await fetch('/api/procurement/rfq');
      if (response.ok) {
        const data = await response.json();
        setRfqs(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load quotation requests');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    DRAFT: 'bg-slate-100 text-slate-800 border-slate-200',
    SENT: 'bg-sky-100 text-sky-800 border-sky-200',
    RECEIVED: 'bg-amber-100 text-amber-800 border-amber-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CLOSED: 'bg-rose-100 text-rose-800 border-rose-200'
  };

  const filteredRfqs = rfqs.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading Procurement Queue...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            Request for Quotation
          </h1>
          <p className="text-slate-500 mt-1">Manage supplier bidding and strategic sourcing requests.</p>
        </div>
        <Button className="rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 font-bold px-6">
          <Plus className="w-4 h-4 mr-2" /> New RFQ
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotes by title or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            />
          </div>
        </div>

        {filteredRfqs.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title="No Quotes Requested"
            description={searchTerm ? "No RFQs match your search." : "You haven't initiated any bidding processes with suppliers yet."}
            actionLabel="Issue New RFQ"
            onAction={() => {}} 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">RFQ Details</th>
                  <th className="px-6 py-4">Process Status</th>
                  <th className="px-6 py-4">Submission Deadline</th>
                  <th className="px-6 py-4">Issued By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {rfq.title}
                        </span>
                        <span className="text-xs text-slate-400 font-mono mt-1">{rfq.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[rfq.status]}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {rfq.deadline ? format(new Date(rfq.deadline), 'MMM d, yyyy') : 'No Deadline'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <User className="w-4 h-4 text-slate-300" />
                        {rfq.createdBy.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button variant="outline" size="sm" className="rounded-lg shadow-sm border-slate-200 font-bold">
                        View Bids
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
