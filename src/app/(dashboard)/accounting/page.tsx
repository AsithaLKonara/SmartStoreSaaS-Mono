'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

export default function AccountingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalAssets: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0
  });

  useEffect(() => {
    if (!session?.user?.organizationId) {
      router.push('/login');
      return;
    }
    fetchSummary();
  }, [session, router]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data || data);
      }
    } catch (error) {
      logger.error({ message: 'Error fetching accounting summary', error });
      toast.error('Failed to load financial overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="accounting-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-white" data-testid="accounting-title">Accounting</h1>
          <p className="text-slate-400 dark:text-gray-400">Manage financial records and reports</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/5">
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
      <div className="glass-dark rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Accounting Overview</h2>
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="h-24 bg-slate-700 rounded-lg flex-1"></div>
                <div className="h-24 bg-slate-700 rounded-lg flex-1"></div>
                <div className="h-24 bg-slate-700 rounded-lg flex-1"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Assets</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary.totalAssets)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 dark:text-green-100">Total Revenue</h3>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-red-900 dark:text-red-100">Total Expenses</h3>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.totalExpenses)}</p>
                </div>
                <div className={`p-4 rounded-lg ${summary.netIncome >= 0 ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <h3 className={`font-medium ${summary.netIncome >= 0 ? 'text-purple-900 dark:text-purple-100' : 'text-red-900 dark:text-red-100'}`}>Net Income</h3>
                  <p className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(summary.netIncome)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chart-of-accounts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chart of Accounts</h2>
              <Button>Add Account</Button>
            </div>
            <p className="text-slate-400 dark:text-gray-400">Manage your chart of accounts</p>
          </div>
        )}

        {activeTab === 'journal-entries' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Journal Entries</h2>
              <Button>Create Entry</Button>
            </div>
            <p className="text-slate-400 dark:text-gray-400">Record financial transactions</p>
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