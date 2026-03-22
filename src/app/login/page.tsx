'use client';

import React, { useEffect, Suspense } from 'react';
import LoginForm from '@/components/LoginForm';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { GlobalBackground } from '@/components/marketing/GlobalBackground';

export default function LoginPage() {
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
      
      <div className="relative z-10 pt-32 pb-24">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
