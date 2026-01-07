'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, CreditCard, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  currentBalance: number;
  isActive: boolean;
}

export default function BankReconciliationPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounting/bank/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.data || []);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching bank accounts',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
          <p className="text-gray-600 mt-2">Manage bank accounts and reconcile transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">{account.accountName}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{account.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-mono">****{account.accountNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{account.accountType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 mt-2">
                  <span className="text-sm font-medium">Balance:</span>
                  <span className="text-lg font-bold">{account.currency} {account.currentBalance.toFixed(2)}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2">
                  Reconcile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <p>No bank accounts connected yet.</p>
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Connect Your First Bank Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

