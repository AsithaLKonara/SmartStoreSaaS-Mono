'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { TrustBar } from '@/components/marketing/TrustBar';
import { ProductStory } from '@/components/marketing/ProductStory';
import { ProductDemo } from '@/components/marketing/ProductDemo';
import { BentoGrid } from '@/components/marketing/BentoGrid';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Pricing } from '@/components/marketing/Pricing';
import { FinalCTA } from '@/components/marketing/FinalCTA';
import { Footer } from '@/components/marketing/Footer';
import { MarketingSearch } from '@/components/marketing/MarketingSearch';

import { GlobalBackground } from '@/components/marketing/GlobalBackground';

export default function Home() {
  useEffect(() => {
    document.body.classList.add('marketing-page');
    // Ensure absolute transparency even if CSS fails to load early
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.body.classList.remove('marketing-page');
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <main className="relative min-h-screen selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Global Background Video (Fixed at bottom) */}
      <GlobalBackground />

      {/* Content Layer (Relative at top) */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <MarketingSearch />
        <TrustBar />
        <ProductStory />
        <ProductDemo />
        <BentoGrid />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  );
}