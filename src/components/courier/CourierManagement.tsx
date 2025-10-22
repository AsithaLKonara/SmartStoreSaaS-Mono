'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, Clock } from 'lucide-react';

export function CourierManagement() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Courier Management</h1>
        <p className="text-gray-600">Manage couriers and delivery tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Couriers</p>
              <p className="text-2xl font-bold">Loading...</p>
            </div>
            <Truck className="h-10 w-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Deliveries</p>
              <p className="text-2xl font-bold">Loading...</p>
            </div>
            <Package className="h-10 w-10 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Delivery Time</p>
              <p className="text-2xl font-bold">Loading...</p>
            </div>
            <Clock className="h-10 w-10 text-green-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-600">Connect to <code>/api/couriers</code> endpoint to view courier data</p>
        <Button className="mt-4" variant="outline">
          View Full Courier List
        </Button>
      </Card>
    </div>
  );
}




