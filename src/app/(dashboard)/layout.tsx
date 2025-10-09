'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/lib/monitoring/error-tracking';
import { RealtimeNotifications, RealtimeToastNotifications } from '@/components/RealtimeNotifications';
import { MobileMenu } from '@/components/MobileMenu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-800 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">SmartStore</h2>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-gray-800 text-white p-4" data-testid="sidebar">
          <h2 className="text-2xl font-bold mb-6">SmartStore</h2>
          <nav>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/products" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Products
                </a>
              </li>
              <li>
                <a href="/orders" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Orders
                </a>
              </li>
              <li>
                <a href="/customers" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Customers
                </a>
              </li>
              <li>
                <a href="/accounting" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Accounting
                </a>
              </li>
              <li>
                <a href="/procurement" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Procurement
                </a>
              </li>
              <li>
                <a href="/analytics" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Analytics
                </a>
              </li>
              <li>
                <a href="/monitoring" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Monitoring
                </a>
              </li>
              <li>
                <a href="/audit" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Audit Logs
                </a>
              </li>
              <li>
                <a href="/backup" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Backup & Recovery
                </a>
              </li>
              <li>
                <a href="/docs" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="/tenants" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Organizations
                </a>
              </li>
              <li>
                <a href="/payments" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Payments
                </a>
              </li>
              <li>
                <a href="/inventory" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Inventory
                </a>
              </li>
              <li>
                <a href="/shipping" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Shipping
                </a>
              </li>
              <li>
                <a href="/customer-portal" className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Customer Portal
                </a>
              </li>
            </ul>
          </nav>
          
          {/* User info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
            <div className="text-sm text-gray-300 truncate">
              Welcome, {session.user?.name || session.user?.email}
            </div>
            <button
              onClick={() => {
                window.location.href = '/api/auth/signout';
              }}
              className="text-sm text-gray-400 hover:text-white mt-2 w-full text-left"
              data-testid="logout-button"
            >
              Sign Out
            </button>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 bg-gray-900 relative pt-20 lg:pt-8">
          {/* Real-time notifications */}
          <div className="fixed top-16 right-4 lg:absolute lg:top-4 lg:right-4 z-40">
            <RealtimeNotifications />
          </div>
          
          {children}
        </main>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Toast notifications */}
      <RealtimeToastNotifications />
    </ErrorBoundary>
  );
}
