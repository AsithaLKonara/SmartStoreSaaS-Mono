'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FinalCTA = () => {
  return (
    <div className="py-32 bg-transparent overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-white/10 mb-8 animate-bounce">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">
            Try SmartStore Risk-Free
          </span>
        </div>

        <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tighter">
          Start Scaling Your <br />
          <span className="text-gradient">Commerce Empire</span>
        </h2>
        
        <p className="text-gray-400 text-lg md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Join thousands of successful merchants using AI to power their operations. No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            href="/register"
            className="w-full sm:w-auto px-12 py-5 bg-primary text-white text-xl font-bold rounded-full transition-all hover:scale-110 hover:shadow-2xl hover:shadow-primary/40 flex items-center justify-center space-x-3 group"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/demo"
            className="text-white text-lg font-bold hover:text-primary transition-colors flex items-center space-x-2"
          >
            <span>Book Live Demo</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <div className="flex items-center space-x-2 text-white font-medium">
             <div className="w-2 h-2 rounded-full bg-emerald-400" />
             <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center space-x-2 text-white font-medium">
             <div className="w-2 h-2 rounded-full bg-emerald-400" />
             <span>Stripe Integration</span>
          </div>
          <div className="flex items-center space-x-2 text-white font-medium">
             <div className="w-2 h-2 rounded-full bg-emerald-400" />
             <span>Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Import helper
import { ChevronRight } from 'lucide-react';
