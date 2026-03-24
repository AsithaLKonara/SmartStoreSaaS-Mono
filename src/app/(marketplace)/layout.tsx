import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, User, Menu } from 'lucide-react';

export const metadata = {
  title: 'Global Marketplace | SmartStore',
  description: 'Shop millions of products from thousands of verified merchants.',
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Global Marketplace Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-md focus:outline-none">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/marketplace" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="hidden sm:inline-block font-black text-xl tracking-tight text-slate-900">
              SMART<span className="text-indigo-600">STORE</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 max-w-3xl mx-4 lg:mx-12 hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search products across thousands of stores..."
              className="block w-full pl-10 pr-3 py-2.5 border-2 border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-6">
          <Link href="/login" className="hidden sm:flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            <User className="w-5 h-5" />
            <span>Sign In</span>
          </Link>
          <Link href="/marketplace/cart" className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline-block">Cart</span>
            <span className="absolute -top-1.5 -right-2 sm:-right-4 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              0
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {children}
      </main>

      {/* Global Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 py-12 px-4 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm">
          <p>© 2026 SmartStore Global Marketplace. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Become a Seller</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
