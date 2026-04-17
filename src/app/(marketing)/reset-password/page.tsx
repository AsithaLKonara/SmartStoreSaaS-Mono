'use client';

import React, { useState } from 'react';
import { KeyRound, Mail, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { GlobalBackground } from '@/components/marketing/GlobalBackground';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending reset link
    setTimeout(() => {
      setStep('sent');
      setLoading(false);
    }, 1500);
  };

  return (
     <main className="relative min-h-screen selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <GlobalBackground />
      <Navbar />
      
      <div className="relative z-10 pt-32 pb-24 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          
          <div className="glass-dark border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
            
            <div className="relative z-10">
              {step === 'request' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-primary/20">
                      <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Recover Access</h1>
                    <p className="text-gray-400 mt-2 font-medium">Enter your verified email address to receive a restoration link.</p>
                  </div>

                  <form onSubmit={handleRequest} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                       <div className="relative">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                         <input
                           required
                           type="email"
                           placeholder="name@company.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-all font-medium"
                         />
                       </div>
                    </div>

                    <Button
                      disabled={loading}
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                        <>
                          Send Reset Link
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Link href="/login" className="text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-[0.2em]">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Secure Login
                    </Link>
                  </div>
                </div>
              )}

              {step === 'sent' && (
                <div className="text-center space-y-8 py-4">
                   <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-emerald-500/20">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                   </div>
                   <div>
                     <h2 className="text-3xl font-black text-white tracking-tight">Transmission Sent</h2>
                     <p className="text-gray-400 mt-4 leading-relaxed font-medium">
                       We&apos;ve dispatched a secure restoration package to <span className="text-white font-bold">{email}</span>. Please verify your inbox.
                     </p>
                   </div>
                   <div className="pt-4 space-y-4">
                     <p className="text-xs text-gray-500 font-medium">Didn&apos;t receive the packet?</p>
                     <Button 
                       variant="outline" 
                       onClick={() => setStep('request')}
                       className="w-full h-12 border-white/10 text-white font-bold rounded-xl hover:bg-white/5"
                     >
                       Retry Transmission
                     </Button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
