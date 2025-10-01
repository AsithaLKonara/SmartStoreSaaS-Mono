'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: string;
  lines: {
    account: { code: string; name: string };
    debit: number;
    credit: number;
  }[];
  createdAt: string;
}

export default function JournalEntriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (session) {
      fetchEntries();
    }
  }, [session, filter]);

  const fetchEntries = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/accounting/journal-entries'
        : `/api/accounting/journal-entries?status=${filter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: 'bg-gray-100 text-gray-800',
      POSTED: 'bg-green-100 text-green-800',
      REVERSED: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.DRAFT;
  };

  const calculateTotal = (lines: any[], type: 'debit' | 'credit') => {
    return lines.reduce((sum, line) => sum + (line[type] || 0), 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Journal Entries</h1>
          <p className="text-gray-600 mt-2">
            Record manual accounting transactions
          </p>
        </div>
        <Button asChild>
          <Link href="/accounting/journal-entries/new">
            <Plus className="w-4 h-4 mr-2" />
            New Journal Entry
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'DRAFT', 'POSTED', 'REVERSED'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            size="sm"
          >
            {status === 'all' ? 'All' : status}
          </Button>
        ))}
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No journal entries found.</p>
              <Button asChild className="mt-4">
                <Link href="/accounting/journal-entries/new">
                  Create your first entry
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{entry.entryNumber}</CardTitle>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.entryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Debits: ${calculateTotal(entry.lines, 'debit').toFixed(2)}
                    </div>
                    <div className="text-sm font-medium">
                      Credits: ${calculateTotal(entry.lines, 'credit').toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entry.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="flex-1">
                        <span className="font-mono text-xs text-gray-500">{line.account.code}</span>
                        <span className="ml-2">{line.account.name}</span>
                      </div>
                      <div className="flex gap-8">
                        <div className="w-24 text-right">
                          {line.debit > 0 && `$${line.debit.toFixed(2)}`}
                        </div>
                        <div className="w-24 text-right">
                          {line.credit > 0 && `$${line.credit.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {entry.status === 'DRAFT' && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">
                      <Check className="w-4 h-4 mr-1" />
                      Post to Ledger
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

