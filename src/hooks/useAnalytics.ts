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
      try {
        const response = await fetch(`/api/analytics/dashboard?organizationId=${organizationId}&period=${period}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch dashboard analytics: ${response.status}`);
        }
        
        const data: DashboardData = await response.json();
        return data;
      } catch (error) {
        console.error('[useAnalytics] Dashboard fetch error:', error);
        // Return default data as fallback
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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    retry: 2, // Retry failed requests twice
  });
}

/**
 * Hook to fetch revenue analytics
 */
export function useRevenueAnalytics(period: string = '30d') {
  return useQuery({
    queryKey: queryKeys.analyticsRevenue(period),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/analytics/revenue?period=${period}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch revenue analytics: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.error('[useAnalytics] Revenue fetch error:', error);
        throw error; // Re-throw to let React Query handle it
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch enhanced analytics
 */
export function useEnhancedAnalytics(timeRange: string = '30d', organizationId?: string) {
  return useQuery({
    queryKey: ['analytics', 'enhanced', timeRange, organizationId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/analytics/enhanced?period=${timeRange}&organizationId=${organizationId || ''}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch enhanced analytics: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.error('[useAnalytics] Enhanced analytics fetch error:', error);
        throw error; // Re-throw to let React Query handle it
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!organizationId, // Only fetch if organizationId is provided
    retry: 2,
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



