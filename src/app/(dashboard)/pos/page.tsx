'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Monitor, CreditCard, Receipt, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function POSDashboard() {
  const { data: session } = useSession();
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchTerminals();
    }
  }, [session]);

  const fetchTerminals = async () => {
    try {
      const res = await fetch('/api/pos/terminals');
      if (res.ok) {
        const data = await res.json();
        setTerminals(data.data || []);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching POS terminals',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      title: 'POS Terminal',
      description: 'Start a new sale',
      icon: Monitor,
      href: '/pos/terminal',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Transactions',
      description: 'View all POS transactions',
      icon: Receipt,
      href: '/pos/transactions',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Cash Drawer',
      description: 'Manage cash drawers',
      icon: DollarSign,
      href: '/pos/cash-drawer',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Terminals',
      description: 'Configure POS terminals',
      icon: CreditCard,
      href: '/pos/terminals',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Point of Sale</h1>
          <p className="text-gray-600 mt-2">Manage in-store sales and terminals</p>
        </div>
        <Button asChild>
          <Link href="/pos/terminal">
            <CreditCard className="w-4 h-4 mr-2" />
            Start Sale
          </Link>
        </Button>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{terminals.length}</div>
            <p className="text-xs text-gray-600">Active Terminals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-gray-600">Today&apos;s Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">Transactions Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-gray-600">Open Cash Drawers</p>
          </CardContent>
        </Card>
      </div>

      {/* Terminal Status */}
      {terminals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Terminal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {terminals.map((terminal: any) => (
                <div key={terminal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{terminal.terminalName}</div>
                      <div className="text-sm text-gray-600">{terminal.terminalCode}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${terminal.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {terminal.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

