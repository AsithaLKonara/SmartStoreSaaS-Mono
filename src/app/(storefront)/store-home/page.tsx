import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';

export default function StorefrontHome() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20">
              Welcome to our new online store.{' '}
              <a href="#" className="font-semibold text-indigo-600">
                <span className="absolute inset-0" aria-hidden="true" />
                Read more <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl uppercase italic">
              Experience Premium Commerce
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Discover our curated collections designed for the modern lifestyle. Quality, sustainability, and style delivered to your doorstep.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/shop"
                className="rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2 group"
              >
                Browse Shop
                <ShoppingBag className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/about" className="text-sm font-bold leading-6 text-slate-900 flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Collections Placeholder */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900">
                    Category {i}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Featured Collection {i}</h3>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <span className="text-slate-400 text-xs ml-1">(48 Reviews)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
