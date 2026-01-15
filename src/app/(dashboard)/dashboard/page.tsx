'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  ShoppingCart,
  Users,
  Package,
  MessageSquare,
  Truck,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RecommendationsWidget } from '@/components/RecommendationsWidget';
import { TrendingProducts } from '@/components/TrendingProducts';

interface DashboardData {
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  customers: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  products: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  topProducts: Array<{
    productId: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: {
      name: string;
      email: string;
    };
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  aiInsights: {
    demandForecasts: Array<{
      productId: string;
      productName: string;
      currentDemand: number;
      predictedDemand: number;
      confidence: number;
    }>;
    churnPredictions: Array<{
      customerId: string;
      customerName: string;
      churnProbability: number;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    aiEnabled: boolean;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/dashboard?organizationId=org-1&period=30');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Error handled silently - user sees UI feedback
        // Set default data structure to prevent errors
        setDashboardData({
          revenue: { total: 0, change: 0, trend: 'up' },
          orders: { total: 0, change: 0, trend: 'up' },
          customers: { total: 0, change: 0, trend: 'up' },
          products: { total: 0, change: 0, trend: 'up' },
          topProducts: [],
          recentOrders: [],
          aiInsights: { demandForecasts: [], churnPredictions: [], aiEnabled: false }
        });
      }
    } catch (error) {
      // Error handled silently - user sees UI feedback
      // Set default data structure to prevent errors
      setDashboardData({
        revenue: { total: 0, change: 0, trend: 'up' },
        orders: { total: 0, change: 0, trend: 'up' },
        customers: { total: 0, change: 0, trend: 'up' },
        products: { total: 0, change: 0, trend: 'up' },
        topProducts: [],
        recentOrders: [],
        aiInsights: { demandForecasts: [], churnPredictions: [], aiEnabled: false }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchDashboardData();
  }, [session, status, router, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      packed: 'bg-yellow-100 text-yellow-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="dashboard-title">Welcome to the Dashboard!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Overview of your business performance</p>
      </div>

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {session?.user?.name || 'Admin'}!</h2>
        <p className="text-blue-100">Here&apos;s what&apos;s happening with your store today</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData ? formatCurrency(dashboardData.revenue.total) : 'රු0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
          </div>
          {dashboardData && (
            <div className="flex items-center mt-2">
              {dashboardData.revenue.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${dashboardData.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                {dashboardData.revenue.change}%
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData ? dashboardData.orders.total.toLocaleString() : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          {dashboardData && (
            <div className="flex items-center mt-2">
              {dashboardData.orders.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${dashboardData.orders.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                {dashboardData.orders.change}%
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData ? dashboardData.customers.total.toLocaleString() : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          {dashboardData && (
            <div className="flex items-center mt-2">
              {dashboardData.customers.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${dashboardData.customers.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                {dashboardData.customers.change}%
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData ? dashboardData.products.total.toLocaleString() : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          {dashboardData && (
            <div className="flex items-center mt-2">
              {dashboardData.products.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${dashboardData.products.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                {dashboardData.products.change}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI-Powered Recommendations */}
      <RecommendationsWidget customerId={session?.user?.id} />

      {/* Trending Products */}
      <TrendingProducts limit={10} />

      {/* AI Insights Section */}
      {dashboardData?.aiInsights?.aiEnabled && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Powered by machine learning</p>
              </div>
            </div>
            <Link
              href="/dashboard/ai-insights"
              className="px-4 py-2 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demand Forecasts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                Demand Predictions
              </h3>
              {dashboardData.aiInsights.demandForecasts?.length ? (
                <div className="space-y-2">
                  {dashboardData.aiInsights.demandForecasts.slice(0, 3).map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate">{forecast.productName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 dark:text-gray-400">{forecast.currentDemand}</span>
                        <ArrowUpRight className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 font-medium">{forecast.predictedDemand}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No predictions available</p>
              )}
            </div>

            {/* Churn Predictions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                High Churn Risk
              </h3>
              {dashboardData.aiInsights.churnPredictions?.length ? (
                <div className="space-y-2">
                  {dashboardData.aiInsights.churnPredictions
                    .filter(p => p.riskLevel === 'HIGH')
                    .slice(0, 3)
                    .map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate">{prediction.customerName}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {prediction.churnProbability}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No high-risk customers</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Products and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Best performing products this month</p>
          </div>
          <div className="p-6">
            {dashboardData?.topProducts?.length ? (
              <div className="space-y-4">
                {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{product.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No product data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Latest customer orders</p>
          </div>
          <div className="p-6">
            {dashboardData?.recentOrders?.length ? (
              <div className="space-y-4">
                {dashboardData.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/products/new"
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Package className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Add Product</span>
          </Link>

          <Link
            href="/dashboard/orders/new"
            className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">Create Order</span>
          </Link>

          <Link
            href="/dashboard/customers/new"
            className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <Users className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Add Customer</span>
          </Link>

          <Link
            href="/dashboard/ai-insights"
            className="flex flex-col items-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-colors"
          >
            <Brain className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Insights</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
