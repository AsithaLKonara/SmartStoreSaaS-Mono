'use client';

import { Button } from '@/components/ui/button';

export default function JournalEntriesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-white">Journal Entries</h1>
          <p className="text-slate-400 dark:text-gray-400">Record financial transactions</p>
        </div>
        <Button>Create Entry</Button>
      </div>

      <div className="glass-dark rounded-lg shadow p-6">
        <p className="text-slate-400 dark:text-gray-400">Journal entries interface coming soon...</p>
      </div>
    </div>
  );
}