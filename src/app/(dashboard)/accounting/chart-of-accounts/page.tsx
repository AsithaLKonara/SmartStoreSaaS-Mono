'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  accountSubType: string;
  balance: number;
  isActive: boolean;
  children?: Account[];
}

export default function ChartOfAccountsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounting/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const renderAccount = (account: Account, level = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);

    return (
      <div key={account.id}>
        <div
          className={`flex items-center justify-between p-3 hover:bg-gray-50 border-b ${
            !account.isActive ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button onClick={() => toggleExpand(account.id)} className="p-1">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-gray-500">{account.code}</span>
                <span className="font-medium">{account.name}</span>
                <span className={`px-2 py-1 text-xs rounded ${getTypeColor(account.accountType)}`}>
                  {account.accountType}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="ghost">
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && account.children!.map(child => renderAccount(child, level + 1))}
      </div>
    );
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ASSET: 'bg-blue-100 text-blue-800',
      LIABILITY: 'bg-red-100 text-red-800',
      EQUITY: 'bg-purple-100 text-purple-800',
      REVENUE: 'bg-green-100 text-green-800',
      EXPENSE: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-gray-600 mt-2">
            Manage your account structure and hierarchy
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Accounts Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {accounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No accounts found. Create your first account to get started.
            </div>
          ) : (
            <div>
              {accounts.map(account => renderAccount(account))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

