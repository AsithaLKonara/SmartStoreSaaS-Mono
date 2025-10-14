/**
 * Products React Query Hooks
 * Cached API calls for products data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateProducts } from '@/lib/query-client';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch products list
 */
export function useProducts(filters?: { search?: string; category?: string; active?: boolean }) {
  return useQuery({
    queryKey: queryKeys.productsList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.active !== undefined) params.append('active', String(filters.active));
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single product
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.productDetail(id),
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      invalidateProducts(queryClient);
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: (_, variables) => {
      invalidateProducts(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(variables.id) });
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      invalidateProducts(queryClient);
    },
  });
}



