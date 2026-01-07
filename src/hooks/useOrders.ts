/**
 * Orders React Query Hooks
 * Cached API calls for orders data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateOrders } from '@/lib/query-client';
import { logger } from '@/lib/logger';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  total: number;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch orders list
 */
export function useOrders(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.ordersList(filters),
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        
        const response = await fetch(`/api/orders?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch orders: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Fetch orders error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useOrders', operation: 'fetchOrders', filters }
        });
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (orders change more frequently)
    retry: 2,
  });
}

/**
 * Hook to fetch a single order
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orderDetail(id),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch order: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Fetch single order error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useOrders', operation: 'fetchOrder', orderId: id }
        });
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to create an order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (order: Partial<Order>) => {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create order: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Create order error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useOrders', operation: 'createOrder', customerId: order.customerId }
        });
        throw error;
      }
    },
    onSuccess: () => {
      invalidateOrders(queryClient);
    },
    retry: 1,
  });
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      try {
        const response = await fetch(`/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update order status: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Update order status error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useOrders', operation: 'updateOrderStatus', orderId: id, status }
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      invalidateOrders(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(variables.id) });
    },
    retry: 1,
  });
}



