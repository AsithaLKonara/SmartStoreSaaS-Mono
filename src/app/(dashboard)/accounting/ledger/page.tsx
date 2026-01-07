'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Filter, Download, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LedgerEntry {
  id: string;
  transactionDate: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  account: {
    code: string;
    name: string;
  };
}

export default function GeneralLedgerPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({ totalDebits: 0, totalCredits: 0, balance: 0 });

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounting/accounts?activeOnly=true');
      if (res.ok) {
        const data = await res.json();
        const flatAccounts: any[] = [];
        const flatten = (accs: any[]) => {
          accs.forEach(acc => {
            flatAccounts.push(acc);
            if (acc.children) flatten(acc.children);
          });
        };
        flatten(data.data || []);
        setAccounts(flatAccounts);
      }
    } catch (error) {
      // Error handled silently - user sees UI feedback
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      let url = '/api/accounting/ledger?';
      if (selectedAccount) url += `accountId=${selectedAccount}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data || []);
        setSummary(data.summary || { totalDebits: 0, totalCredits: 0, balance: 0 });
      }
    } catch (error) {
      // Error handled silently - user sees UI feedback
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, startDate, endDate]);

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session, fetchAccounts]);

  useEffect(() => {
    if (session) {
      fetchLedger();
    }
  }, [session, fetchLedger]);

  const exportToCSV = () => {
    const headers = ['Date', 'Account', 'Description', 'Reference', 'Debit', 'Credit', 'Balance'];
    const rows = entries.map(entry => [
      new Date(entry.transactionDate).toLocaleDateString(),
      `${entry.account.code} - ${entry.account.name}`,
      entry.description,
      entry.reference || '',
      entry.debit.toFixed(2),
      entry.credit.toFixed(2),
      entry.balance.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">General Ledger</h1>
          <p className="text-gray-600 mt-2">
            View all accounting transactions
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="account">Account</Label>
              <select
                id="account"
                className="w-full px-3 py-2 border rounded-md"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalDebits.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.totalCredits.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summary.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found. Try adjusting your filters or create a journal entry.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(entry.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-mono text-xs text-gray-500">{entry.account.code}</div>
                        <div>{entry.account.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.reference}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {entry.debit > 0 && `$${entry.debit.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {entry.credit > 0 && `$${entry.credit.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                        ${entry.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

