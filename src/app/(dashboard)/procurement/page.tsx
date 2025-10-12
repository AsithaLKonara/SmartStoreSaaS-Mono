'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6" data-testid="procurement-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="procurement-title">Procurement</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage suppliers and purchase orders</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'suppliers', name: 'Suppliers' },
            { id: 'purchase-orders', name: 'Purchase Orders' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Procurement Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Active Suppliers</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-100">Pending Orders</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">0</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-orange-900 dark:text-orange-100">Total Spend</h3>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">$0.00</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Suppliers</h2>
              <Button>Add Supplier</Button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Manage your supplier relationships</p>
          </div>
        )}

        {activeTab === 'purchase-orders' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Purchase Orders</h2>
              <Button>Create Order</Button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Track and manage purchase orders</p>
          </div>
        )}
      </div>
    </div>
  );
}