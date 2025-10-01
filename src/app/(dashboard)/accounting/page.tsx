'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  BookOpen,
  Calculator,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AccountingDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    journalEntries: 0,
    taxRates: 0,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchStats();
  }, [session, status]);

  const fetchStats = async () => {
    try {
      const [accountsRes] = await Promise.all([
        fetch('/api/accounting/accounts'),
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setStats(prev => ({ ...prev, totalAccounts: accountsData.count || 0 }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const modules = [
    {
      title: 'Chart of Accounts',
      description: 'Manage your account structure',
      icon: BookOpen,
      href: '/accounting/chart-of-accounts',
      color: 'bg-blue-500',
    },
    {
      title: 'Journal Entries',
      description: 'Record manual transactions',
      icon: FileText,
      href: '/accounting/journal-entries',
      color: 'bg-green-500',
    },
    {
      title: 'General Ledger',
      description: 'View all transactions',
      icon: BarChart3,
      href: '/accounting/ledger',
      color: 'bg-purple-500',
    },
    {
      title: 'Financial Reports',
      description: 'P&L, Balance Sheet, Cash Flow',
      icon: TrendingUp,
      href: '/accounting/reports',
      color: 'bg-orange-500',
    },
    {
      title: 'Tax Management',
      description: 'Configure tax rates',
      icon: Calculator,
      href: '/accounting/tax',
      color: 'bg-red-500',
    },
    {
      title: 'Bank Reconciliation',
      description: 'Reconcile bank transactions',
      icon: DollarSign,
      href: '/accounting/bank',
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Accounting</h1>
        <p className="text-gray-600 mt-2">
          Manage your financial accounts, transactions, and reports
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
            <CardDescription>Total accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAccounts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.journalEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Rates</CardTitle>
            <CardDescription>Configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.taxRates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${module.color} text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/accounting/journal-entries/new">
                + New Journal Entry
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/accounting/reports">
                View Reports
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/accounting/ledger">
                View Ledger
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

