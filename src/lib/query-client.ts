/**
 * React Query Client Configuration
 * Implements API caching and data fetching optimization
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default query options for optimal performance
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: How long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,
    
    // Cache time: How long unused data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000, // Previously cacheTime in v4
    
    // Retry failed requests
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch settings
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
    refetchOnReconnect: true,
    refetchOnMount: false,
    
    // Enable suspense for better loading states
    suspense: false,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
  },
};

/**
 * Create a new QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

/**
 * Singleton QueryClient for client-side
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient();
  }

  // Browser: reuse the same query client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}

/**
 * Query keys factory for consistent caching
 */
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  currentUser: () => [...queryKeys.auth, 'current'] as const,
  
  // Products
  products: ['products'] as const,
  productsList: (filters?: any) => [...queryKeys.products, 'list', filters] as const,
  productDetail: (id: string) => [...queryKeys.products, 'detail', id] as const,
  
  // Orders
  orders: ['orders'] as const,
  ordersList: (filters?: any) => [...queryKeys.orders, 'list', filters] as const,
  orderDetail: (id: string) => [...queryKeys.orders, 'detail', id] as const,
  
  // Customers
  customers: ['customers'] as const,
  customersList: (filters?: any) => [...queryKeys.customers, 'list', filters] as const,
  customerDetail: (id: string) => [...queryKeys.customers, 'detail', id] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  analyticsDashboard: () => [...queryKeys.analytics, 'dashboard'] as const,
  analyticsRevenue: (period: string) => [...queryKeys.analytics, 'revenue', period] as const,
  
  // Categories
  categories: ['categories'] as const,
  categoriesList: () => [...queryKeys.categories, 'list'] as const,
  
  // Inventory
  inventory: ['inventory'] as const,
  inventoryList: (filters?: any) => [...queryKeys.inventory, 'list', filters] as const,
  
  // Settings
  settings: ['settings'] as const,
  settingsOrg: () => [...queryKeys.settings, 'organization'] as const,
} as const;

/**
 * Prefetch helpers
 */
export async function prefetchProducts(queryClient: QueryClient, filters?: any) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.productsList(filters),
    queryFn: () => fetch('/api/products').then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  });
}

export async function prefetchOrders(queryClient: QueryClient, filters?: any) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.ordersList(filters),
    queryFn: () => fetch('/api/orders').then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  });
}

export async function prefetchAnalytics(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.analyticsDashboard(),
    queryFn: () => fetch('/api/analytics/dashboard').then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Invalidate queries helpers
 */
export function invalidateProducts(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.products });
}

export function invalidateOrders(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.orders });
}

export function invalidateCustomers(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.customers });
}

export function invalidateAnalytics(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
}



