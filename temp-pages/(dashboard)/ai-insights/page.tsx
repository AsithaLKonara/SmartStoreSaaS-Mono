'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Package, 
  Target, 
  BarChart3, 
  Lightbulb,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote,
  ShoppingCart,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AIInsights {
  demandForecasts: Array<{
    productId: string;
    productName: string;
    currentDemand: number;
    predictedDemand: number;
    confidence: number;
    factors: string[];
  }>;
  churnPredictions: Array<{
    customerId: string;
    customerName: string;
    churnProbability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    lastOrderDate: string;
    totalSpent: number;
    preventionActions: string[];
  }>;
  revenueForecasts: Array<{
    period: string;
    predictedRevenue: number;
    confidence: number;
    growthRate: number;
  }>;
  customerRecommendations: Array<{
    customerId: string;
    customerName: string;
    recommendations: Array<{
      productId: string;
      productName: string;
      score: number;
      reason: string;
    }>;
  }>;
  aiEnabled: boolean;
}

interface AutomationStats {
  abandonedCartRecovery: {
    total: number;
    recovered: number;
    conversionRate: number;
  };
  birthdayCampaigns: {
    total: number;
    sent: number;
    opened: number;
    conversionRate: number;
  };
  reEngagement: {
    total: number;
    engaged: number;
    conversionRate: number;
  };
  customerSegments: Array<{
    name: string;
    count: number;
    value: number;
  }>;
}

export default function AIInsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [automationStats, setAutomationStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchAIInsights();
    fetchAutomationStats();
  }, [session, status]);

  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard?organizationId=org-1&period=30');
      if (response.ok) {
        const data = await response.json();
        if (data.aiInsights) {
          setInsights(data.aiInsights);
        }
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchAutomationStats = async () => {
    try {
      const response = await fetch('/api/ai/automation');
      if (response.ok) {
        const data = await response.json();
        setAutomationStats(data);
      }
    } catch (error) {
      console.error('Error fetching automation stats:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'LOW': return CheckCircle;
      case 'MEDIUM': return AlertTriangle;
      case 'HIGH': return AlertTriangle;
      default: return Clock;
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
            <p className="text-gray-600 dark:text-gray-400">Powered by machine learning and predictive analytics</p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 dark:text-green-200 font-medium">
            AI Engine Active - Real-time insights available
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-8">
        {[
          { id: 'overview', name: 'Overview', icon: BarChart3 },
          { id: 'predictions', name: 'Predictions', icon: TrendingUp },
          { id: 'recommendations', name: 'Recommendations', icon: Target },
          { id: 'automation', name: 'Automation', icon: Zap }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Demand Predictions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {insights?.demandForecasts?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Churn Risk</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {insights?.churnPredictions?.filter(p => p.riskLevel === 'HIGH').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue Forecast</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {insights?.revenueForecasts?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Recommendations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {insights?.customerRecommendations?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Engine Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Engine Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Recommendation Engine</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Predictive Analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Marketing Automation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* Demand Forecasts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demand Predictions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered demand forecasting for top products</p>
            </div>
            <div className="p-6">
              {insights?.demandForecasts?.length ? (
                <div className="space-y-4">
                  {insights.demandForecasts.slice(0, 5).map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{forecast.productName}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>Current: {forecast.currentDemand}</span>
                          <span>Predicted: {forecast.predictedDemand}</span>
                          <span>Confidence: {forecast.confidence}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {forecast.predictedDemand > forecast.currentDemand ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            forecast.predictedDemand > forecast.currentDemand ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {forecast.predictedDemand > forecast.currentDemand ? 'Increase' : 'Decrease'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No demand predictions available</p>
                </div>
              )}
            </div>
          </div>

          {/* Churn Predictions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Churn Risk</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">High-risk customers identified by AI</p>
            </div>
            <div className="p-6">
              {insights?.churnPredictions?.length ? (
                <div className="space-y-4">
                  {insights.churnPredictions.slice(0, 5).map((prediction, index) => {
                    const RiskIcon = getRiskIcon(prediction.riskLevel);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">{prediction.customerName}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(prediction.riskLevel)}`}>
                              {prediction.riskLevel}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Risk: {prediction.churnProbability}%</span>
                            <span>Last Order: {formatDate(prediction.lastOrderDate)}</span>
                            <span>Total Spent: {formatCurrency(prediction.totalSpent)}</span>
                          </div>
                        </div>
                        <RiskIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No churn predictions available</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Forecasts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Forecasts</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered revenue predictions</p>
            </div>
            <div className="p-6">
              {insights?.revenueForecasts?.length ? (
                <div className="space-y-4">
                  {insights.revenueForecasts.map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{forecast.period}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>Predicted: {formatCurrency(forecast.predictedRevenue)}</span>
                          <span>Confidence: {forecast.confidence}%</span>
                          <span>Growth: {forecast.growthRate > 0 ? '+' : ''}{forecast.growthRate}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {forecast.growthRate > 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            forecast.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {forecast.growthRate > 0 ? 'Growth' : 'Decline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No revenue forecasts available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Product Recommendations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Personalized product suggestions for top customers</p>
            </div>
            <div className="p-6">
              {insights?.customerRecommendations?.length ? (
                <div className="space-y-6">
                  {insights.customerRecommendations.map((customer, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">{customer.customerName}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {customer.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">{rec.productName}</h5>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Score: {rec.score.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{rec.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recommendations available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          {/* Automation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Abandoned Cart</h3>
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              {automationStats?.abandonedCartRecovery ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                    <span className="font-medium">{automationStats.abandonedCartRecovery.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Recovered</span>
                    <span className="font-medium text-green-600">{automationStats.abandonedCartRecovery.recovered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Conversion</span>
                    <span className="font-medium">{automationStats.abandonedCartRecovery.conversionRate}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Birthday Campaigns</h3>
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              {automationStats?.birthdayCampaigns ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                    <span className="font-medium">{automationStats.birthdayCampaigns.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                    <span className="font-medium text-blue-600">{automationStats.birthdayCampaigns.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Opened</span>
                    <span className="font-medium text-green-600">{automationStats.birthdayCampaigns.opened}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Re-engagement</h3>
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              {automationStats?.reEngagement ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                    <span className="font-medium">{automationStats.reEngagement.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engaged</span>
                    <span className="font-medium text-green-600">{automationStats.reEngagement.engaged}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Conversion</span>
                    <span className="font-medium">{automationStats.reEngagement.conversionRate}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              )}
            </div>
          </div>

          {/* Customer Segments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Customer Segments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automatically generated customer segments</p>
            </div>
            <div className="p-6">
              {automationStats?.customerSegments?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {automationStats.customerSegments.map((segment, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{segment.name}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Customers</span>
                          <span className="font-medium">{segment.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Value</span>
                          <span className="font-medium">{formatCurrency(segment.value)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No customer segments available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
