'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Package,
  Loader2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BillingDashboard {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  subscriptionMetrics: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    trialSubscriptions: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    averageOrderValue: number;
  };
}

export default function BillingPage() {
  const [dashboard, setDashboard] = useState<BillingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingDashboard();
  }, []);

  const loadBillingDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/billing/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }
      
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading billing dashboard:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadBillingDashboard();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-red-800 font-medium">Error loading billing data</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <Button 
            onClick={handleRefresh} 
            className="mt-3 bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No billing data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor your revenue and subscription metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(dashboard.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(dashboard.monthlyRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboard.activeSubscriptions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboard.pendingPayments}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Metrics</CardTitle>
            <CardDescription>Overview of your subscription base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Subscriptions</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dashboard.subscriptionMetrics.totalSubscriptions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</span>
                <span className="text-lg font-semibold text-green-600">
                  {dashboard.subscriptionMetrics.activeSubscriptions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</span>
                <span className="text-lg font-semibold text-red-600">
                  {dashboard.subscriptionMetrics.cancelledSubscriptions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Trial</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {dashboard.subscriptionMetrics.trialSubscriptions}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Metrics</CardTitle>
            <CardDescription>Detailed revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Yearly Revenue</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(dashboard.revenueMetrics.yearlyRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Order Value</span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency(dashboard.revenueMetrics.averageOrderValue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Growth</span>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-lg font-semibold text-green-600">+12.5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No recent transactions</p>
              </div>
            ) : (
              dashboard.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(transaction.status)} flex items-center space-x-1`}>
                    {getStatusIcon(transaction.status)}
                    <span>{transaction.status}</span>
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}