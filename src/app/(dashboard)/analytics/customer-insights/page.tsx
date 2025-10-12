'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Banknote,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  Eye,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CustomerInsight {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  lastOrderDate: string;
  customerLifetimeValue: number;
  segment: 'VIP' | 'Regular' | 'New' | 'At Risk';
  growthRate: number;
  preferredCategories: string[];
  avgDaysBetweenOrders: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  totalSpent: number;
  avgOrderValue: number;
  growthRate: number;
}

export default function CustomerInsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'individual'>('overview');
  const [dateRange, setDateRange] = useState('30days');
  const [segmentFilter, setSegmentFilter] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchCustomerInsights();
  }, [session, status, dateRange]);

  const fetchCustomerInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/customer-insights?dateRange=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        setSegments(data.segments);
      }
    } catch (error) {
      console.error('Error fetching customer insights:', error);
      toast.error('Failed to load customer insights');
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800';
      case 'Regular':
        return 'bg-blue-100 text-blue-800';
      case 'New':
        return 'bg-green-100 text-green-800';
      case 'At Risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGrowthIcon = (growthRate: number) => {
    return growthRate >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const filteredInsights = segmentFilter 
    ? insights.filter(insight => insight.segment === segmentFilter)
    : insights;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Insights</h1>
            <p className="text-gray-600">AI-powered customer analytics and segmentation</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(insights.reduce((sum, insight) => sum + insight.totalSpent, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(insights.reduce((sum, insight) => sum + insight.averageOrderValue, 0) / insights.length || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(insights.reduce((sum, insight) => sum + insight.growthRate, 0) / insights.length || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'segments', label: 'Segments', icon: PieChart },
              { id: 'individual', label: 'Individual', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Customer Segments Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {segments.map((segment) => (
                    <div key={segment.segment} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSegmentColor(segment.segment)}`}>
                          {segment.segment}
                        </span>
                        <span className="text-sm text-gray-600">{segment.count} customers</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-600">Revenue: </span>
                          <span className="font-medium">{formatCurrency(segment.totalSpent)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Avg Order: </span>
                          <span className="font-medium">{formatCurrency(segment.avgOrderValue)}</span>
                        </div>
                        <div className="text-sm flex items-center">
                          <span className="text-gray-600">Growth: </span>
                          {getGrowthIcon(segment.growthRate)}
                          <span className={`font-medium ml-1 ${segment.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {segment.growthRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Customers */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Customers by Revenue</h3>
                <div className="space-y-3">
                  {insights
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 10)
                    .map((insight, index) => (
                      <div key={insight.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{insight.name}</div>
                            <div className="text-sm text-gray-600">{insight.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(insight.totalSpent)}</div>
                          <div className="text-sm text-gray-600">{insight.totalOrders} orders</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'segments' && (
            <div className="space-y-6">
              {/* Segment Filter */}
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Segments</option>
                  <option value="VIP">VIP Customers</option>
                  <option value="Regular">Regular Customers</option>
                  <option value="New">New Customers</option>
                  <option value="At Risk">At Risk Customers</option>
                </select>
              </div>

              {/* Segment Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {segments.map((segment) => (
                  <div key={segment.segment} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">{segment.segment} Customers</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSegmentColor(segment.segment)}`}>
                        {segment.count} customers
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-semibold">{formatCurrency(segment.totalSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Order Value:</span>
                        <span className="font-semibold">{formatCurrency(segment.avgOrderValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Growth Rate:</span>
                        <div className="flex items-center">
                          {getGrowthIcon(segment.growthRate)}
                          <span className={`font-semibold ml-1 ${segment.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {segment.growthRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'individual' && (
            <div className="space-y-6">
              {/* Individual Customer Insights */}
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Customers</option>
                  <option value="VIP">VIP Customers</option>
                  <option value="Regular">Regular Customers</option>
                  <option value="New">New Customers</option>
                  <option value="At Risk">At Risk Customers</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredInsights.map((insight) => (
                  <div key={insight.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{insight.name}</h4>
                        <p className="text-gray-600">{insight.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSegmentColor(insight.segment)}`}>
                        {insight.segment}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Spent</div>
                        <div className="font-semibold">{formatCurrency(insight.totalSpent)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Orders</div>
                        <div className="font-semibold">{insight.totalOrders}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Avg Order Value</div>
                        <div className="font-semibold">{formatCurrency(insight.averageOrderValue)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Growth Rate</div>
                        <div className="flex items-center">
                          {getGrowthIcon(insight.growthRate)}
                          <span className={`font-semibold ml-1 ${insight.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {insight.growthRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Customer Lifetime Value</div>
                          <div className="font-semibold">{formatCurrency(insight.customerLifetimeValue)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Last Order</div>
                          <div className="font-semibold">{formatDate(insight.lastOrderDate)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Avg Days Between Orders</div>
                          <div className="font-semibold">{insight.avgDaysBetweenOrders} days</div>
                        </div>
                      </div>
                    </div>
                    
                    {insight.preferredCategories.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 mb-2">Preferred Categories</div>
                        <div className="flex flex-wrap gap-2">
                          {insight.preferredCategories.map((category) => (
                            <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
