'use client';

import React, { useEffect } from 'react';
import { RegistrationWizard } from '@/components/registration/RegistrationWizard';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { GlobalBackground } from '@/components/marketing/GlobalBackground';

export default function RegisterPage() {
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
        <RegistrationWizard />
      </div>

      <Footer />
    </main>
  );
}


