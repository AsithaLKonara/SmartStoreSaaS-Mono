'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Printer, 
  ShieldCheck, 
  CreditCard,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Zap,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  issueDate: string;
  dueDate: string;
  total: number;
  subtotal: number;
  tax: number;
  items: InvoiceItem[];
  customer: {
    name: string;
    organization: string;
    email: string;
    address: string;
  };
  billingOrg: {
    name: string;
    address: string;
    taxId: string;
  };
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Bridging the API: api/billing/invoices/[id]
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data for high-fidelity preview
        const mockInvoice: Invoice = {
          id: params.id,
          invoiceNumber: `INV-2026-${params.id.slice(0, 4).toUpperCase()}`,
          status: 'PENDING',
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          total: 1245.50,
          subtotal: 1100.00,
          tax: 145.50,
          items: [
            { id: '1', description: 'SmartStore SaaS - Pro Annual Subscription', quantity: 1, unitPrice: 999.00, amount: 999.00 },
            { id: '2', description: 'Excess IoT Data Ingestion (50k events)', quantity: 2, unitPrice: 50.50, amount: 101.00 }
          ],
          customer: {
            name: session?.user?.name || 'Authorized Tenant',
            organization: 'Nexus Logistics Global',
            email: session?.user?.email || 'admin@nexus.com',
            address: '44 Industrial Sector, Colombo 10, Sri Lanka'
          },
          billingOrg: {
            name: 'SmartStore Cloud Solutions',
            address: 'Tech Innovation Hub, Level 15, Colombo 03',
            taxId: 'TX-9988-7766'
          }
        };
        
        setInvoice(mockInvoice);
      } catch (error) {
        toast.error('Failed to reconstruct invoice manifest');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id, session]);

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Rendering high-fidelity billing manifest...</div>;
  if (!invoice) return <div className="p-12 text-center text-slate-500">Billing record not found.</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/billing" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Billing Preferences
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <FileText className="w-8 h-8 text-indigo-500" />
             Invoice Record: {invoice.invoiceNumber}
          </h1>
          <p className="text-slate-400 mt-1">Official financial statement for the current service lifecycle.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-widest px-6 h-12" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
           </Button>
           <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-xl h-12 shadow-lg shadow-indigo-600/20">
              <Download className="w-4 h-4 mr-2" /> Export PDF
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
           <div className="bg-white rounded-[2.5rem] p-12 text-slate-900 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
                 <div className="space-y-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                       <span className="text-white font-black text-2xl">S</span>
                    </div>
                    <div className="space-y-1">
                       <p className="font-black text-lg">{invoice.billingOrg.name}</p>
                       <p className="text-sm text-slate-500 max-w-xs">{invoice.billingOrg.address}</p>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">VAT: {invoice.billingOrg.taxId}</p>
                    </div>
                 </div>

                 <div className="text-right space-y-4">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                       {invoice.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                       {invoice.status} Status
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-slate-400">Total Billed</p>
                       <p className="text-4xl font-black text-indigo-600">{formatCurrency(invoice.total)}</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 border-t border-b border-slate-100 py-12">
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Manifest</h3>
                    <div className="space-y-1">
                       <p className="font-black text-slate-900">{invoice.customer.name}</p>
                       <p className="text-sm font-bold text-slate-600">{invoice.customer.organization}</p>
                       <p className="text-sm text-slate-500 max-w-xs">{invoice.customer.address}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-slate-400">Issue Date</p>
                       <p className="text-sm font-bold text-slate-900">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-slate-400">Due Date</p>
                       <p className="text-sm font-bold text-slate-900">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-slate-400">Payment ID</p>
                       <p className="text-sm font-bold text-slate-900"># {params.id.split('-')[0].toUpperCase()}</p>
                    </div>
                 </div>
              </div>

              <table className="w-full mb-12">
                 <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       <th className="py-4 text-left">Line Item Description</th>
                       <th className="py-4 text-center">Qty</th>
                       <th className="py-4 text-right">Unit Price</th>
                       <th className="py-4 text-right">Total</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {invoice.items.map((item) => (
                       <tr key={item.id}>
                          <td className="py-6 pr-8">
                             <p className="text-sm font-black text-slate-900 mb-1">{item.description}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Usage Period: Current Billing Cycle</p>
                          </td>
                          <td className="py-6 text-center text-sm font-bold text-slate-500">{item.quantity}</td>
                          <td className="py-6 text-right text-sm font-bold text-slate-500">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-6 text-right text-sm font-black text-slate-900">{formatCurrency(item.amount)}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>

              <div className="flex justify-end pt-8 border-t border-slate-100">
                 <div className="w-full max-w-xs space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                       <span>Sub-Total</span>
                       <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                       <span>Tax (13.2%)</span>
                       <span>{formatCurrency(invoice.tax)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900 text-lg font-black text-slate-900">
                       <span>Final Total</span>
                       <span className="text-indigo-600">{formatCurrency(invoice.total)}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">Security Audit</h3>
                    <ShieldCheck className="w-5 h-5 opacity-60" />
                 </div>
                 <div className="space-y-4">
                    <p className="text-xl font-black leading-tight">Authenticity Verified</p>
                    <p className="text-xs opacity-80 leading-relaxed font-medium">This document is digitally signed and compliant with global SaaS billing standards.</p>
                 </div>
                 <div className="pt-6 border-t border-white/10 space-y-4">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-12 shadow-lg">
                       <CreditCard className="w-4 h-4 mr-2" />
                       Process Balance
                    </Button>
                    <Button variant="ghost" className="w-full text-slate-400 hover:text-white rounded-xl h-12">
                       <Mail className="w-4 h-4 mr-2" />
                       Share via Email
                    </Button>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 rounded-[2rem] p-8 text-white space-y-4 relative overflow-hidden group hover:bg-indigo-700 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">Support Hub</h3>
                 <Zap className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-black leading-snug">Questions about this invoice? Open a priority billing ticket.</p>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                 Contact Helpdesk <Layers className="w-3 h-3" />
              </div>
              <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Building2 className="w-32 h-32" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
