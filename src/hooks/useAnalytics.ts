/**
 * Analytics React Query Hooks
 * Cached API calls for analytics data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

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
  topProducts: Array<any>;
  recentOrders: Array<any>;
  aiInsights: any;
}

/**
 * Hook to fetch dashboard analytics
 * Data is cached for 5 minutes
 */
export function useDashboardAnalytics(organizationId: string = 'org-1', period: number = 30) {
  return useQuery({
    queryKey: queryKeys.analyticsDashboard(),
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard?organizationId=${organizationId}&period=${period}`);
      
      if (!response.ok) {
        // Return default data instead of throwing
        return {
          revenue: { total: 0, change: 0, trend: 'up' as const },
          orders: { total: 0, change: 0, trend: 'up' as const },
          customers: { total: 0, change: 0, trend: 'up' as const },
          products: { total: 0, change: 0, trend: 'up' as const },
          topProducts: [],
          recentOrders: [],
          aiInsights: { demandForecasts: [], churnPredictions: [], aiEnabled: false }
        };
      }
      
      const data: DashboardData = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
}

/**
 * Hook to fetch revenue analytics
 */
export function useRevenueAnalytics(period: string = '30d') {
  return useQuery({
    queryKey: queryKeys.analyticsRevenue(period),
    queryFn: async () => {
      const response = await fetch(`/api/analytics/revenue?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch revenue');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch enhanced analytics
 */
export function useEnhancedAnalytics(timeRange: string = '30d', organizationId?: string) {
  return useQuery({
    queryKey: ['analytics', 'enhanced', timeRange, organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/enhanced?period=${timeRange}&organizationId=${organizationId || ''}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!organizationId, // Only fetch if organizationId is provided
  });
}

/**
 * Hook to invalidate analytics cache
 */
export function useInvalidateAnalytics() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  };
}



