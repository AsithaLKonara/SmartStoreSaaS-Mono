/**
 * Customers React Query Hooks
 * Cached API calls for customers data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateCustomers } from '@/lib/query-client';

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
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.active !== undefined) params.append('active', String(filters.active));
      
      const response = await fetch(`/api/customers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single customer
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customerDetail(id),
    queryFn: async () => {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      return response.json();
    },
    onSuccess: () => {
      invalidateCustomers(queryClient);
    },
  });
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateCustomers(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.customerDetail(variables.id) });
    },
  });
}



