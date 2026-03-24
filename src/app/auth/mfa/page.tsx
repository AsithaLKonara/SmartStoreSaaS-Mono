'use client';

import React, { useEffect, Suspense } from 'react';
import MfaForm from '@/components/MfaForm';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { GlobalBackground } from '@/components/marketing/GlobalBackground';

export default function MfaPage() {
  useEffect(() => {
    document.body.classList.add('marketing-page');
    return () => {
      document.body.classList.remove('marketing-page');
    };
  }, []);

  return (
    <main className="relative min-h-screen selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <GlobalBackground />
      <Navbar />
      
      <div className="relative z-10 pt-32 pb-24 flex items-center justify-center">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white italic">Loading security...</div>}>
          <MfaForm />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
