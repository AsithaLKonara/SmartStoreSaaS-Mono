'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DollarSign, TrendingUp, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Analytics {
  summary: {
    totalSpend: number;
    pendingAmount: number;
    pendingCount: number;
    activeSuppliers: number;
    openPOs: number;
  };
  topSuppliers: Array<{
    supplierName: string;
    supplierCode: string;
    totalSpend: number;
    invoiceCount: number;
  }>;
}

export default function ProcurementAnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchAnalytics();
    }
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/procurement/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching procurement analytics',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!analytics) return <div className="p-8">No data available</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Procurement Analytics</h1>
        <p className="text-gray-600 mt-2">Spend analysis and supplier performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.summary.totalSpend.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">All time paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <FileText className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.summary.pendingAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {analytics.summary.pendingCount} outstanding invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.activeSuppliers}</div>
            <p className="text-xs text-gray-600">In supplier database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Purchase Orders</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.openPOs}</div>
            <p className="text-xs text-gray-600">Pending delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Suppliers by Spend</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topSuppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No supplier data available</p>
          ) : (
            <div className="space-y-4">
              {analytics.topSuppliers.map((supplier, index) => (
                <div key={supplier.supplierCode} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <div className="font-semibold">{supplier.supplierName}</div>
                      <div className="text-sm text-gray-600">{supplier.supplierCode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">${supplier.totalSpend.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{supplier.invoiceCount} invoices</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

