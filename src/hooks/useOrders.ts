/**
 * Orders React Query Hooks
 * Cached API calls for orders data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateOrders } from '@/lib/query-client';

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
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (orders change more frequently)
  });
}

/**
 * Hook to fetch a single order
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orderDetail(id),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      return response.json();
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create an order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (order: Partial<Order>) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: () => {
      invalidateOrders(queryClient);
    },
  });
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateOrders(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(variables.id) });
    },
  });
}



