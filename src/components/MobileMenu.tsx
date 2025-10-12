'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { data: session } = useSession();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed top-0 left-0 h-full w-64 bg-gray-800 text-white shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">SmartStore</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a 
                href="/dashboard" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="/products" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Products
              </a>
            </li>
            <li>
              <a 
                href="/orders" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Orders
              </a>
            </li>
            <li>
              <a 
                href="/customers" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Customers
              </a>
            </li>
            <li>
              <a 
                href="/accounting" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Accounting
              </a>
            </li>
            <li>
              <a 
                href="/procurement" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Procurement
              </a>
            </li>
            <li>
              <a 
                href="/analytics" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Analytics
              </a>
            </li>
            <li>
              <a 
                href="/monitoring" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Monitoring
              </a>
            </li>
            <li>
              <a 
                href="/audit" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Audit Logs
              </a>
            </li>
            <li>
              <a 
                href="/backup" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Backup & Recovery
              </a>
            </li>
            <li>
              <a 
                href="/docs" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                API Documentation
              </a>
            </li>
            <li>
              <a 
                href="/tenants" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Organizations
              </a>
            </li>
            <li>
              <a 
                href="/payments" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Payments
              </a>
            </li>
            <li>
              <a 
                href="/inventory" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Inventory
              </a>
            </li>
            <li>
              <a 
                href="/shipping" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Shipping
              </a>
            </li>
            <li>
              <a 
                href="/customer-portal" 
                className="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                onClick={onClose}
              >
                Customer Portal
              </a>
            </li>
          </ul>
        </nav>
        
        {/* User info at bottom */}
        <div className="absolute bottom-4 left-4 right-4 p-4 border-t border-gray-700">
          <div className="text-sm text-gray-300">
            Welcome, {session?.user?.name || session?.user?.email}
          </div>
          <button
            onClick={() => {
              window.location.href = '/api/auth/signout';
            }}
            className="text-sm text-gray-400 hover:text-white mt-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}


