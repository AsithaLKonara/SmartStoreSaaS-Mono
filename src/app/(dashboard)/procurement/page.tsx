'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Package, FileText, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProcurementDashboard() {
  const { data: session } = useSession();

  const modules = [
    {
      title: 'Suppliers',
      description: 'Manage your supplier database',
      icon: Package,
      href: '/procurement/suppliers',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Purchase Orders',
      description: 'Create and track purchase orders',
      icon: FileText,
      href: '/procurement/purchase-orders',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Supplier Invoices',
      description: 'Manage supplier invoices and payments',
      icon: DollarSign,
      href: '/procurement/invoices',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'RFQ Management',
      description: 'Request for Quotations',
      icon: MessageSquare,
      href: '/procurement/rfq',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Analytics',
      description: 'Procurement insights and spend analysis',
      icon: TrendingUp,
      href: '/procurement/analytics',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Procurement Management</h1>
        <p className="text-gray-600 mt-2">Supplier, PO, and RFQ management</p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Open Module
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">Active Suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">Open Purchase Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-gray-600">Pending Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">Active RFQs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

