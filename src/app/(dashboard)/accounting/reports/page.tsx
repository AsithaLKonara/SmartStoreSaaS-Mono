'use client';

import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate and view financial reports</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline">Balance Sheet</Button>
          <Button variant="outline">Income Statement</Button>
          <Button variant="outline">Cash Flow Statement</Button>
          <Button variant="outline">Trial Balance</Button>
        </div>
      </div>
    </div>
  );
}