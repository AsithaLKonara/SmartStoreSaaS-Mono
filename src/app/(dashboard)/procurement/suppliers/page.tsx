'use client';

import { Button } from '@/components/ui/button';

export default function SuppliersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-white">Suppliers</h1>
          <p className="text-slate-400 dark:text-gray-400">Manage your supplier relationships</p>
        </div>
        <Button>Add Supplier</Button>
      </div>

      <div className="glass-dark rounded-lg shadow p-6">
        <p className="text-slate-400 dark:text-gray-400">Suppliers management interface coming soon...</p>
      </div>
    </div>
  );
}