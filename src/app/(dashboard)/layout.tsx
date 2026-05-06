'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/lib/monitoring/error-tracking';
import { RealtimeToastNotifications } from '@/components/RealtimeNotifications';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { Menu, X, Bell, User } from 'lucide-react';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { CommandPalette } from '@/components/CommandPalette';
import { GlobalBackground } from '@/components/marketing/GlobalBackground';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-zinc-950">
        <GlobalBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user as any)?.role || 'CUSTOMER';

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen text-slate-200">
        <GlobalBackground />
        
        <div className="relative z-10 flex min-h-screen">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 glass-dark border-r border-white/5 shadow-2xl transition-all duration-300">
            <ModernSidebar userRole={userRole} />
          </aside>

          {/* Mobile Sidebar */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
              <div 
                className="w-72 h-full glass-dark border-r border-white/10 shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <ModernSidebar userRole={userRole} onClose={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Header */}
            <header className="glass-dark border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:glass-dark/5 rounded-lg text-slate-300"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Search Bar */}
              <div className="hidden md:flex flex-1 max-w-lg mx-4">
                <AdvancedSearch 
                  placeholder="Search products, orders, customers... (Ctrl+K)"
                  onResultSelect={(result) => {
                    router.push(`/${result.type}s/${result.id}`);
                  }}
                  showFilters={false}
                  className="w-full"
                />
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 hover:glass-dark/5 rounded-lg text-slate-300 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                </button>

                {/* User Menu */}
                <div className="flex items-center space-x-3 px-3 py-2 hover:glass-dark/5 rounded-lg cursor-pointer transition-colors group">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">{session.user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{userRole}</p>
                  </div>
                </div>

                {/* Sign Out */}
                <button
                  onClick={() => window.location.href = '/api/auth/signout'}
                  className="hidden md:block px-4 py-2 glass-dark/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 rounded-lg text-sm font-medium transition-all"
                >
                  Sign Out
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-6 overflow-auto custom-scrollbar bg-transparent">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      <RealtimeToastNotifications />
      
      {/* Global Command Palette */}
      <CommandPalette />
    </ErrorBoundary>
  );
}
