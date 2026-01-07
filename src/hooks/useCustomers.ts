/**
 * Customers React Query Hooks
 * Cached API calls for customers data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateCustomers } from '@/lib/query-client';
import { logger } from '@/lib/logger';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch customers list
 */
export function useCustomers(filters?: { search?: string; active?: boolean }) {
  return useQuery({
    queryKey: queryKeys.customersList(filters),
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.active !== undefined) params.append('active', String(filters.active));
        
        const response = await fetch(`/api/customers?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch customers: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Fetch customers error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useCustomers', operation: 'fetchCustomers', filters }
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch a single customer
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customerDetail(id),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/customers/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch customer: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Fetch single customer error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useCustomers', operation: 'fetchCustomer', customerId: id }
        });
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to create a customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      try {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create customer: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Create customer error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useCustomers', operation: 'createCustomer', customerEmail: customer.email }
        });
        throw error;
      }
    },
    onSuccess: () => {
      invalidateCustomers(queryClient);
    },
    retry: 1,
  });
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update customer: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Update customer error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useCustomers', operation: 'updateCustomer', customerId: id }
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      invalidateCustomers(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.customerDetail(variables.id) });
    },
    retry: 1,
  });
}



