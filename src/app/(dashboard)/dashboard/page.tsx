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
      // Only fetch if session exists and role is allowed to see analytics
      const userRole = session?.user?.role;
      if (userRole === 'CUSTOMER') {
        setLoading(false);
        return;
      }

      const orgId = session?.user?.organizationId || 'org-1';
      const response = await fetch(`/api/analytics/dashboard?organizationId=${orgId}&period=30`);
      if (response.ok) {
        const result = await response.json();
        // Unpack data from successResponse wrapper
        setDashboardData(result.data || result);
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
      router.push('/login');
      return;
    }

    // Secondary security: if a customer somehow lands on the admin dashboard, send them to marketplace
    if (session.user?.role === 'CUSTOMER') {
      router.push('/marketplace');
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
      default: return 'text-gray-600 bg-white/5';
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
      {/* Page Title & Context Switching */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white text-shadow-glow" data-testid="dashboard-title">
            {session?.user?.role === 'ACCOUNTANT' ? 'Financial Control Center' : 
             session?.user?.role === 'WAREHOUSE' ? 'Logistics Command' : 
             'Digital Command Center'}
          </h1>
          <p className="text-slate-400 mt-1">
            {session?.user?.role === 'ACCOUNTANT' ? 'Real-time fiscal monitoring and payable tracking.' : 
             session?.user?.role === 'WAREHOUSE' ? 'Global inventory distribution and facility health.' : 
             'Overview of your multi-tenant business performance.'}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            {session?.user?.role || 'User'} Mode
          </span>
        </div>
      </div>

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {session?.user?.name || 'Admin'}!</h2>
        <p className="text-blue-100">Here&apos;s what&apos;s happening with your store today</p>
      </div>

      {/* Key Metrics - Conditional Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Revenue / Volume */}
        <div className="glass-dark rounded-3xl p-6 shadow-sm border border-white/5 group hover:border-indigo-500/50 transition-all" data-testid="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                {session?.user?.role === 'WAREHOUSE' ? 'Active SKUs' : 'Gross Volume'}
              </p>
              <p className="text-3xl font-black text-white mt-1 tabular-nums">
                {session?.user?.role === 'WAREHOUSE' ? 
                  (dashboardData?.products?.total?.toLocaleString() || '0') : 
                  (dashboardData?.revenue ? formatCurrency(dashboardData.revenue.total) : 'රු0')
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              {session?.user?.role === 'WAREHOUSE' ? <Package className="w-6 h-6 text-indigo-500" /> : <Banknote className="w-6 h-6 text-indigo-500" />}
            </div>
          </div>
          <div className="flex items-center mt-4">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Current Period</span>
          </div>
        </div>

        {/* Metric 2: Orders / Low Stock */}
        <div className="glass-dark rounded-3xl p-6 shadow-sm border border-white/5 group hover:border-rose-500/50 transition-all" data-testid="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                {session?.user?.role === 'WAREHOUSE' ? 'Stock Alerts' : 'Total Orders'}
              </p>
              <p className={`text-3xl font-black mt-1 tabular-nums ${session?.user?.role === 'WAREHOUSE' ? 'text-rose-500' : 'text-white'}`}>
                {session?.user?.role === 'WAREHOUSE' ? '12' : (dashboardData?.orders?.total?.toLocaleString() || '0')}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              session?.user?.role === 'WAREHOUSE' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-blue-500/10 border-blue-500/20'
            }`}>
              {session?.user?.role === 'WAREHOUSE' ? <AlertTriangle className="w-6 h-6 text-rose-500" /> : <ShoppingCart className="w-6 h-6 text-blue-500" />}
            </div>
          </div>
          <div className="flex items-center mt-4">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Requires Attention</span>
          </div>
        </div>

        {/* Metric 3: Customers / Movements */}
        <div className="glass-dark rounded-3xl p-6 shadow-sm border border-white/5 group hover:border-emerald-500/50 transition-all" data-testid="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                {session?.user?.role === 'WAREHOUSE' ? 'Logistics Flow' : 'Growth Rate'}
              </p>
              <p className="text-3xl font-black text-white mt-1 tabular-nums">
                {session?.user?.role === 'WAREHOUSE' ? '86%' : '+12.4%'}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              {session?.user?.role === 'WAREHOUSE' ? <Truck className="w-6 h-6 text-emerald-500" /> : <Users className="w-6 h-6 text-emerald-500" />}
            </div>
          </div>
          <div className="flex items-center mt-4">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Rolling Avg</span>
          </div>
        </div>

        {/* Metric 4: Health / Capacity */}
        <div className="glass-dark rounded-3xl p-6 shadow-sm border border-white/5 group hover:border-amber-500/50 transition-all" data-testid="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                System Health
              </p>
              <p className="text-3xl font-black text-white mt-1 tabular-nums">
                OPTIMAL
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
              <Brain className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="flex items-center mt-4">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Auto-Pilot Engaged</span>
          </div>
        </div>
      </div>

      {/* AI-Powered Recommendations */}
      <RecommendationsWidget
        customerId={session?.user?.id}
        organizationId={session?.user?.organizationId || 'org-1'}
      />

      {/* Trending Products */}
      <TrendingProducts limit={10} />

      {/* AI Insights Section */}
      {dashboardData?.aiInsights?.aiEnabled && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Insights</h2>
                <p className="text-sm text-slate-400">Powered by machine learning</p>
              </div>
            </div>
            <Link
              href="/dashboard/ai-insights"
              className="px-4 py-2 glass border border-white/10 text-white rounded-lg hover:glass-dark/10 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demand Forecasts */}
            <div className="glass-dark rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h3 className="font-semibold text-white dark:text-white mb-3 flex items-center">
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
            <div className="glass-dark rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h3 className="font-semibold text-white dark:text-white mb-3 flex items-center">
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
        <div className="glass-dark rounded-lg shadow-sm border border-white/5">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">Top Products</h2>
            <p className="text-sm text-slate-400">Best performing products this month</p>
          </div>
          <div className="p-6">
            {dashboardData?.topProducts?.length ? (
              <div className="space-y-4">
                {dashboardData.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 glass-dark/5 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-400">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{product.name}</h3>
                        <p className="text-sm text-slate-400">{product.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No product data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="glass-dark rounded-lg shadow-sm border border-white/5">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white dark:text-white">Recent Orders</h2>
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
                        <h3 className="font-medium text-white dark:text-white">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white dark:text-white">{formatCurrency(order.totalAmount)}</p>
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
      <div className="glass-dark rounded-lg shadow-sm border border-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/products/new"
            className="flex flex-col items-center p-4 glass-dark/5 rounded-lg hover:glass-dark/10 border border-white/5 transition-colors"
          >
            <Package className="w-6 h-6 text-primary mb-2" />
            <span className="text-sm font-medium text-slate-200">Add Product</span>
          </Link>

          <Link
            href="/dashboard/orders/new"
            className="flex flex-col items-center p-4 glass-dark/5 rounded-lg hover:glass-dark/10 border border-white/5 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-green-500 mb-2" />
            <span className="text-sm font-medium text-slate-200">Create Order</span>
          </Link>

          <Link
            href="/dashboard/customers/new"
            className="flex flex-col items-center p-4 glass-dark/5 rounded-lg hover:glass-dark/10 border border-white/5 transition-colors"
          >
            <Users className="w-6 h-6 text-accent mb-2" />
            <span className="text-sm font-medium text-slate-200">Add Customer</span>
          </Link>

          <Link
            href="/dashboard/ai-insights"
            className="flex flex-col items-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg hover:from-primary/20 hover:to-accent/20 border border-white/10 transition-colors"
          >
            <Brain className="w-6 h-6 text-primary mb-2" />
            <span className="text-sm font-medium text-slate-200">AI Insights</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
