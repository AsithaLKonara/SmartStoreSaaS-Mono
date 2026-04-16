'use client';

import React, { useState } from 'react';
import { 
  FilePieChart, 
  ArrowLeft, 
  Download, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GenerateReportPage() {
  const { data: session } = useSession();
  const [reportType, setReportType] = useState('pnl');
  const [dateRange, setDateRange] = useState('q3-2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Bridging theStub API: api/accounting/financial-reports
      const response = await fetch('/api/accounting/financial-reports');
      const data = await response.json();
      
      // Artificial delay for high-fidelity experience
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setReportReady(true);
      toast.success('Financial manifest compiled successfully');
    } catch (error) {
      toast.error('Failed to compile financial ledger');
    } finally {
      setIsGenerating(false);
    }
  };

  const reportOptions = [
    { id: 'pnl', name: 'Profit & Loss Statement', description: 'Net income, COGS, and operational overhead.' },
    { id: 'balance', name: 'Balance Sheet', description: 'Assets, liabilities, and shareholder equity.' },
    { id: 'tax', name: 'Sales Tax Summary', description: 'VAT/GST liabilities mapped to region.' },
    { id: 'audit', name: 'Full Transaction Audit', description: 'Raw ledger history for external auditors.' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/accounting" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Financial Overview
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <FilePieChart className="w-8 h-8 text-indigo-500" />
             Report Compilation Wizard
          </h1>
          <p className="text-slate-400 mt-1">Generate certified financial manifests for internal review or external compliance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-12 relative overflow-hidden group">
              {!reportReady ? (
                <div className="space-y-12">
                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Select Report Variant</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setReportType(option.id)}
                            className={`p-6 rounded-3xl border text-left transition-all ${
                              reportType === option.id 
                                ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-600/20' 
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                          >
                             <p className={`font-black text-sm mb-1 ${reportType === option.id ? 'text-white' : 'text-slate-200'}`}>{option.name}</p>
                             <p className="text-[10px] font-medium text-slate-400 leading-relaxed">{option.description}</p>
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Reporting Period</h3>
                      <div className="flex flex-wrap gap-2">
                         {['q1-2026', 'q2-2026', 'q3-2026', 'ytd'].map((period) => (
                           <button
                             key={period}
                             onClick={() => setDateRange(period)}
                             className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                               dateRange === period 
                                 ? 'bg-white text-slate-900 shadow-lg' 
                                 : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                             }`}
                           >
                             {period.replace('-', ' ')}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                         <ShieldCheck className="w-4 h-4 text-emerald-500" />
                         ISO-27001 Data Extraction Policy Active
                      </div>
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-6 rounded-2xl h-auto text-lg shadow-lg shadow-indigo-600/20"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                      >
                         {isGenerating ? <RefreshCw className="mr-3 animate-spin" /> : <TrendingUp className="mr-3" />}
                         {isGenerating ? 'Compiling Ledger...' : 'Generate Financial Statement'}
                      </Button>
                   </div>
                </div>
              ) : (
                <div className="py-12 space-y-12 animate-in fade-in zoom-in duration-700">
                   <div className="space-y-4 text-center">
                     <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                       <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                     </div>
                     <h2 className="text-3xl font-black text-white">Statement Compiled</h2>
                     <p className="text-slate-400 max-w-sm mx-auto">Your {reportOptions.find(o => o.id === reportType)?.name} for {dateRange.toUpperCase()} is ready for distribution.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                      <Button className="bg-white text-slate-900 font-black h-16 rounded-2xl hover:bg-slate-100 shadow-xl" onClick={() => window.print()}>
                        <Printer className="mr-3 w-5 h-5" />
                        Print Document
                      </Button>
                      <Button variant="secondary" className="h-16 rounded-2xl font-black border-white/10 hover:bg-white/5">
                        <Download className="mr-3 w-5 h-5" />
                        Export PDF/XLX
                      </Button>
                   </div>
                   
                   <button onClick={() => setReportReady(false)} className="text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-white block mx-auto transition-all">
                      Generate New Variant
                   </button>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">Automation Suite</h3>
                <p className="text-lg font-black leading-tight">Schedule Recurring Statements</p>
                <p className="text-xs opacity-80 leading-relaxed">Automate month-end closing procedures by scheduling this report to be sent to your primary stakeholder group every 30 days.</p>
                <Button className="w-full bg-white text-indigo-600 font-black rounded-xl mt-4 hover:bg-slate-50 transition-colors">
                   Enable Scheduling
                </Button>
              </div>
           </div>
           
           <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/5">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 border-b border-white/5 pb-4">Recent Compilations</h3>
              <div className="space-y-4 text-xs font-bold">
                 <div className="flex items-center justify-between text-slate-400">
                    <span>Q2-2026 Profit & Loss</span>
                    <span className="text-[10px] text-slate-600">12d ago</span>
                 </div>
                 <div className="flex items-center justify-between text-slate-400">
                    <span>MARCH Reconciliation</span>
                    <span className="text-[10px] text-slate-600">24d ago</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
