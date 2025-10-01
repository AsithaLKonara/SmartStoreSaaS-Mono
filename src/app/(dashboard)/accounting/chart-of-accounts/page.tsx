'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash, ChevronRight, ChevronDown, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    accountType: 'ASSET',
    accountSubType: 'CURRENT_ASSET',
    parentId: '',
    currency: 'USD',
    taxEnabled: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
              <Button size="sm" variant="ghost" onClick={() => openEditModal(account)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
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

  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      accountType: 'ASSET',
      accountSubType: 'CURRENT_ASSET',
      parentId: '',
      currency: 'USD',
      taxEnabled: false
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      description: '',
      accountType: account.accountType,
      accountSubType: account.accountSubType,
      parentId: '',
      currency: 'USD',
      taxEnabled: false
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);

    try {
      const url = editingAccount 
        ? `/api/accounting/accounts/${editingAccount.id}`
        : '/api/accounting/accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        fetchAccounts(); // Refresh the list
      } else {
        setError(data.message || 'Failed to save account');
      }
    } catch (error) {
      setError('Error saving account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const response = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchAccounts(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete account');
      }
    } catch (error) {
      alert('Error deleting account');
    }
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
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
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

      {/* Add/Edit Account Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Account Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., 1000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cash"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Account description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountType">Account Type *</Label>
                <select
                  id="accountType"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <Label htmlFor="accountSubType">Account Sub Type *</Label>
                <select
                  id="accountSubType"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.accountSubType}
                  onChange={(e) => setFormData({ ...formData, accountSubType: e.target.value })}
                >
                  <option value="CURRENT_ASSET">Current Asset</option>
                  <option value="FIXED_ASSET">Fixed Asset</option>
                  <option value="CURRENT_LIABILITY">Current Liability</option>
                  <option value="LONG_TERM_LIABILITY">Long Term Liability</option>
                  <option value="OWNERS_EQUITY">Owner's Equity</option>
                  <option value="SALES_REVENUE">Sales Revenue</option>
                  <option value="OPERATING_EXPENSE">Operating Expense</option>
                  <option value="NON_OPERATING_EXPENSE">Non Operating Expense</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="LKR">LKR</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="taxEnabled"
                  checked={formData.taxEnabled}
                  onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
                />
                <Label htmlFor="taxEnabled">Tax Enabled</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : (editingAccount ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

