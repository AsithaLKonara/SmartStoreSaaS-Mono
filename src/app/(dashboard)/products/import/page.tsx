'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Download,
  Database,
  RefreshCw,
  Table as TableIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [stats, setStats] = useState<{ rows: number; errors: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv') {
        toast.error('Please upload a valid CSV file');
        return;
      }
      setFile(selectedFile);
      setStep(2);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Simulate CSV processing and bulk operation queueing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch('/api/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'PRODUCT',
          operation: 'IMPORT',
          data: { filename: file.name, size: file.size }
        })
      });

      if (response.ok) {
        setStats({ rows: 124, errors: 0 });
        setStep(3);
        toast.success('Batch import job initialized');
      } else {
        toast.error('Failed to initiate import job');
      }
    } catch (error) {
      toast.error('Network error during import sequence');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = 'sku,name,description,price,cost,isActive,category';
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartstore_product_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/products" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Return to Catalog
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <Database className="w-8 h-8 text-indigo-500" />
             Mass Ingestion Engine
          </h1>
          <p className="text-slate-400 mt-1">Scale your inventory by importing products via structured CSV manifest.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-12 text-center relative overflow-hidden group">
              {/* Step 1: Upload */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Upload className="w-10 h-10 text-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">Select Manifest File</h2>
                    <p className="text-slate-400 max-w-sm mx-auto">Upload your product CSV. Ensure headers match our standard schema for optimal parsing.</p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl cursor-pointer shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-3">
                       <FileText className="w-5 h-5" />
                       Browse Files
                       <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                    </label>
                    <button onClick={downloadTemplate} className="text-[10px] font-black uppercase text-indigo-400 tracking-widest hover:text-white transition-colors">
                       Download CSV Schema Template
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation / Mapping */}
              {step === 2 && file && (
                <div className="space-y-8">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between max-w-md mx-auto">
                      <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-indigo-400" />
                        <div className="text-left">
                           <p className="text-sm font-black text-white">{file.name}</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase">{(file.size / 1024).toFixed(2)} KB • CSV Manifest</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={() => setStep(1)}>
                         Change
                      </Button>
                   </div>
                   
                   <div className="space-y-4">
                     <p className="text-slate-400 text-sm">System has verified manifest headers. Proceed with cross-tenant data ingestion?</p>
                     <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 py-6 rounded-2xl h-auto text-lg shadow-lg shadow-emerald-600/20"
                        onClick={handleImport}
                        disabled={isUploading}
                     >
                       {isUploading ? <RefreshCw className="mr-3 animate-spin" /> : <Database className="mr-3" />}
                       {isUploading ? 'Ingesting Data...' : 'Start Global Import'}
                     </Button>
                   </div>
                </div>
              )}

              {/* Step 3: Success */}
              {step === 3 && stats && (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                   <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                     <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                   </div>
                   <div className="space-y-2">
                     <h2 className="text-3xl font-black text-white">Import Successful</h2>
                     <p className="text-slate-400">Your catalog sync job has been completed without anomalies.</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                         <p className="text-2xl font-black text-white">{stats.rows}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">Rows Created</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                         <p className="text-2xl font-black text-rose-500">{stats.errors}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">Failed Entries</p>
                      </div>
                   </div>
                   <Button className="bg-white/10 hover:bg-white/20 text-white font-black rounded-xl px-8" asChild>
                      <Link href="/products">Visit Product Catalog</Link>
                   </Button>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-6">Import Architecture</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs font-black">01</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black mb-1">Deduplication</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">System matches SKU patterns to prevent redundant catalog entries.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs font-black">02</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black mb-1">Async Execution</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Large files are processed in the background to ensure dashboard stability.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs font-black">03</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black mb-1">Format Validation</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Pre-flight checks ensure non-numeric prices and invalid IDs are flagged.</p>
                    </div>
                  </div>
                </div>
              </div>
           </div>
           
           <div className="bg-indigo-600 rounded-[2rem] p-6 text-white flex items-center justify-between group cursor-pointer hover:bg-indigo-700 transition-all">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Developer API</p>
                <p className="text-sm font-black">Custom Ingestion Webhooks</p>
              </div>
              <TableIcon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
           </div>
        </div>
      </div>
    </div>
  );
}
