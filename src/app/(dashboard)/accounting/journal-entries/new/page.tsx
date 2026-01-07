'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
}

interface EntryLine {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export default function NewJournalEntryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<EntryLine[]>([
    { accountId: 'default', description: 'Default entry', debit: 0, credit: 0 },
    { accountId: 'default', description: 'Default entry', debit: 0, credit: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounting/accounts?activeOnly=true');
      if (res.ok) {
        const data = await res.json();
        // Flatten the hierarchy for dropdown
        const flatAccounts: Account[] = [];
        const flatten = (accs: any[]) => {
          accs.forEach(acc => {
            flatAccounts.push(acc);
            if (acc.children && acc.children.length > 0) {
              flatten(acc.children);
            }
          });
        };
        flatten(data.data || []);
        setAccounts(flatAccounts);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching accounts',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', description: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof EntryLine, value: any) => {
    const newLines = [...lines];
    const currentLine = newLines[index];
    if (!currentLine) return;
    
    if (field === 'accountId' && typeof value === 'string') {
      newLines[index] = { 
        accountId: value,
        description: currentLine.description,
        debit: currentLine.debit,
        credit: currentLine.credit
      };
    } else if (field === 'description' && typeof value === 'string') {
      newLines[index] = { 
        accountId: currentLine.accountId,
        description: value,
        debit: currentLine.debit,
        credit: currentLine.credit
      };
    } else if (field === 'debit' && typeof value === 'number') {
      newLines[index] = { 
        accountId: currentLine.accountId,
        description: currentLine.description,
        debit: value,
        credit: currentLine.credit
      };
    } else if (field === 'credit' && typeof value === 'number') {
      newLines[index] = { 
        accountId: currentLine.accountId,
        description: currentLine.description,
        debit: currentLine.debit,
        credit: value
      };
    }
    setLines(newLines);
  };

  const calculateTotals = () => {
    const totalDebits = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    return { totalDebits, totalCredits, balanced: Math.abs(totalDebits - totalCredits) < 0.01 };
  };

  const handleSave = async (postImmediately = false) => {
    setError('');
    const { totalDebits, totalCredits, balanced } = calculateTotals();

    if (!balanced) {
      setError(`Entry not balanced! Debits: $${totalDebits.toFixed(2)}, Credits: $${totalCredits.toFixed(2)}`);
      return;
    }

    if (!description) {
      setError('Description is required');
      return;
    }

    const validLines = lines.filter(line => line.accountId && (line.debit > 0 || line.credit > 0));
    if (validLines.length < 2) {
      setError('At least 2 lines with amounts are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryDate,
          description,
          reference,
          lines: validLines,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (postImmediately) {
          // Post to ledger
          await fetch(`/api/accounting/journal-entries/${data.data.id}/post`, {
            method: 'POST',
          });
        }
        router.push('/accounting/journal-entries');
      } else {
        setError(data.message || 'Failed to create entry');
      }
    } catch (error) {
      setError('Error creating journal entry');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Journal Entry</h1>
          <p className="text-gray-600 mt-2">
            Record a manual accounting transaction
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entry Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entryDate">Entry Date</Label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                placeholder="INV-001, PO-123, etc."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <Label>Status</Label>
              <div className="h-10 flex items-center">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                  DRAFT
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g., Monthly rent payment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Entry Lines */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Entry Lines</h3>
              <Button onClick={addLine} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Line
              </Button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-700 pb-2 border-b">
              <div className="col-span-4">Account</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
              <div className="col-span-1"></div>
            </div>

            {/* Entry Lines */}
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-4">
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={line.accountId}
                    onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                  >
                    <option value="">Select account...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Line description"
                    value={line.description}
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={line.debit || ''}
                    onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={line.credit || ''}
                    onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1">
                  {lines.length > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="grid grid-cols-12 gap-4 pt-4 border-t font-semibold">
              <div className="col-span-7 text-right">Totals:</div>
              <div className="col-span-2 text-right">
                ${totals.totalDebits.toFixed(2)}
              </div>
              <div className="col-span-2 text-right">
                ${totals.totalCredits.toFixed(2)}
              </div>
              <div className="col-span-1">
                {totals.balanced ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            {!totals.balanced && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                ⚠️ Entry is not balanced. Debits must equal credits.
                Difference: ${Math.abs(totals.totalDebits - totals.totalCredits).toFixed(2)}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={!totals.balanced || saving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={!totals.balanced || saving}
              variant="default"
            >
              <Check className="w-4 h-4 mr-2" />
              Save & Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

