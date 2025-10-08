'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6" data-testid="accounting-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="accounting-title">Accounting</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage financial records and reports</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'chart-of-accounts', name: 'Chart of Accounts' },
            { id: 'journal-entries', name: 'Journal Entries' },
            { id: 'reports', name: 'Reports' }
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
            <h2 className="text-xl font-semibold mb-4">Accounting Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Assets</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">$0.00</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-100">Total Revenue</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">$0.00</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-red-900 dark:text-red-100">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">$0.00</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chart-of-accounts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chart of Accounts</h2>
              <Button>Add Account</Button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Manage your chart of accounts</p>
          </div>
        )}

        {activeTab === 'journal-entries' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Journal Entries</h2>
              <Button>Create Entry</Button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Record financial transactions</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline">Balance Sheet</Button>
              <Button variant="outline">Income Statement</Button>
              <Button variant="outline">Cash Flow Statement</Button>
              <Button variant="outline">Trial Balance</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}