'use client';

import React, { useState, useEffect } from 'react';
import { PackageX, ArrowLeft, CheckCircle2, XCircle, RefreshCcw, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ReturnDetailView() {
  const params = useParams();
  const router = useRouter();
  const returnId = params.id as string;
  
  const [returnRecord, setReturnRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REFUND' | null>(null);

  useEffect(() => {
    fetchReturnDetails();
  }, [returnId]);

  const fetchReturnDetails = async () => {
    try {
      const res = await fetch('/api/returns');
      const data = await res.json();
      if (data.success) {
        // Because a dedicated GET /api/returns/[id] might not be configured, we filter the list.
        const found = data.data.find((r: any) => r.id === returnId);
        if (found) {
          setReturnRecord(found);
        } else {
          toast.error('Return request not found');
          router.push('/returns');
        }
      }
    } catch (err) {
      toast.error('Failed to load return details');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!actionType) return;
    
    const endpoint = actionType === 'APPROVE' ? 'approve' : actionType === 'REJECT' ? 'reject' : 'refund';
    try {
      const res = await fetch(`/api/returns/${returnId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `Return ${actionType.toLowerCase()} via Dashboard` })
      });
      
      if (res.ok) {
        toast.success(`Return request ${actionType.toLowerCase()}ed successfully`);
        fetchReturnDetails();
        setIsConfirmOpen(false);
      } else {
        throw new Error('Action failed');
      }
    } catch (err) {
      toast.error(`Failed to ${actionType.toLowerCase()} return`);
    }
  };

  const promptAction = (type: 'APPROVE' | 'REJECT' | 'REFUND') => {
    setActionType(type);
    setIsConfirmOpen(true);
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading return data...</div>;
  if (!returnRecord) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 mb-8">
        <Link href="/returns" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-500" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <PackageX className="w-6 h-6 text-rose-500" />
              Return Request
            </h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
              returnRecord.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
              returnRecord.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 
              returnRecord.status === 'REFUNDED' ? 'bg-indigo-100 text-indigo-800' : 
              'bg-amber-100 text-amber-800'
            }`}>
              {returnRecord.status || 'PENDING'}
            </span>
          </div>
          <p className="text-sm font-mono text-slate-500 mt-1">ID: {returnRecord.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Request Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Reason for Return</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium">
                  {returnRecord.reason || 'No reason provided by customer.'}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Original Order</p>
                <Link href={`/orders/${returnRecord.orderId}`} className="inline-flex items-center gap-2 font-mono text-indigo-600 hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                  {returnRecord.order?.orderNumber || returnRecord.orderId}
                </Link>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Customer</p>
                <p className="font-bold text-slate-900">{returnRecord.order?.customer?.name || 'Unknown'}</p>
                <p className="text-sm text-slate-500">{returnRecord.order?.customer?.email || 'No email provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
               <Clock className="w-4 h-4 text-slate-500" /> Actions
            </h3>
            
            <p className="text-xs text-slate-500 mb-6">
               Created on {format(new Date(returnRecord.createdAt || Date.now()), 'PPP')}
            </p>

            <div className="space-y-3">
               {returnRecord.status !== 'APPROVED' && returnRecord.status !== 'REFUNDED' && (
                 <Button 
                   onClick={() => promptAction('APPROVE')}
                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-md shadow-emerald-600/20"
                 >
                   <CheckCircle2 className="w-4 h-4" /> Approve Return
                 </Button>
               )}
               
               {returnRecord.status === 'APPROVED' && (
                 <Button 
                   onClick={() => promptAction('REFUND')}
                   className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-md shadow-indigo-600/20"
                 >
                   <RefreshCcw className="w-4 h-4" /> Process Refund
                 </Button>
               )}

               {returnRecord.status !== 'REJECTED' && returnRecord.status !== 'REFUNDED' && (
                 <Button 
                   onClick={() => promptAction('REJECT')}
                   variant="outline"
                   className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold rounded-xl flex justify-center items-center gap-2"
                 >
                   <XCircle className="w-4 h-4" /> Reject Request
                 </Button>
               )}
            </div>
          </div>
        </div>

      </div>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeAction}
        title={
          actionType === 'APPROVE' ? 'Approve Return Request' : 
          actionType === 'REJECT' ? 'Reject Return Request' : 
          'Process Refund'
        }
        description={
          actionType === 'APPROVE' ? 'Are you sure you want to approve this return? This will notify the customer to ship the item back.' : 
          actionType === 'REJECT' ? 'Are you sure you want to reject this request? This action cannot be easily undone.' : 
          'Are you sure you want to process the refund? This will reverse the transaction balance.'
        }
        confirmText={
          actionType === 'APPROVE' ? 'Approve' : 
          actionType === 'REJECT' ? 'Reject' : 
          'Refund'
        }
        variant={actionType === 'REJECT' ? 'danger' : 'info'}
      />

    </div>
  );
}
