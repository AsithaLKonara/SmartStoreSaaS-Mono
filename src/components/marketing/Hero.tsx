'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <div className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden bg-transparent pt-32 pb-24">
      {/* Content */}
      <div className="container mx-auto px-6 relative z-20 flex flex-col items-center text-center">
        {/* Floating Stat Badge */}
        <div className="animate-slide-down inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass border border-white/20 mb-8 hover:scale-105 transition-transform cursor-default">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">
            Rated 4.9/5 by 2500+ Enterprise Teams
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-8 max-w-5xl leading-[1.1] animate-fade-in">
          The Ultimate <br />
          <span className="text-gradient">Commerce OS</span>
        </h1>

        {/* Subtext */}
        <p className="text-gray-300 text-lg md:text-2xl max-w-3xl mb-12 leading-relaxed animate-fade-in delay-200">
          Global Marketplace + SaaS E-Commerce + Backend ERP + POS. <br className="hidden md:block"/>
          All your merchant operations unified in one powerful system.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slide-up delay-300">
          <Link
            href="/register"
            className="w-full sm:w-auto px-10 py-5 bg-primary text-white text-lg font-bold rounded-full flex items-center justify-center space-x-3 transition-all hover:scale-110 hover:shadow-2xl hover:shadow-primary/40 group"
          >
            <span>Start Selling Today</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="/demo"
            className="w-full sm:w-auto px-10 py-5 glass-dark text-white text-lg font-bold rounded-full flex items-center justify-center space-x-3 transition-all hover:bg-white/10 hover:scale-105"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Book Live Demo</span>
          </Link>
        </div>

        {/* Floating Card Preview (Mockup) */}
        <div className="mt-24 relative w-full max-w-5xl animate-slide-up delay-500">
          <div className="relative group overflow-hidden rounded-3xl border border-white/10 shadow-3xl bg-black/40 backdrop-blur-3xl transform -rotate-1 hover:rotate-0 transition-all duration-700">
            {/* Mock Dashboard Header */}
            <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            
            {/* Mock Dashboard Body */}
            <div className="p-8 grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-white/5 rounded-2xl" />
                  <div className="h-32 bg-white/5 rounded-2xl" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-12 bg-primary/20 rounded-xl ring-1 ring-primary/30" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-white/5 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Glowing Accent */}
            <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/20 blur-[120px] pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
