'use client';

import { Button } from '@/components/ui/button';

export default function PurchaseOrdersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage purchase orders</p>
        </div>
        <Button>Create Order</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">Purchase orders interface coming soon...</p>
      </div>
    </div>
  );
}