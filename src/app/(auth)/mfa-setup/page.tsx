'use client';

import React from 'react';
import MfaSetup from '@/components/MfaSetup';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MfaSetupPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black text-white text-center">Security Core</h1>
          <p className="text-slate-400 text-center mt-2">Provision Multi-Factor Authentication for your identity.</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
           {/* Decorative background element */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600/20 transition-all duration-1000" />
           
           <div className="relative z-10 text-white">
             <MfaSetup />
           </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
