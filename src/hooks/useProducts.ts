/**
 * Products React Query Hooks
 * Cached API calls for products data
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateProducts } from '@/lib/query-client';
import { logger } from '@/lib/logger';

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
      try {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.active !== undefined) params.append('active', String(filters.active));
        
        const response = await fetch(`/api/products?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch products: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Fetch products error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useProducts', operation: 'fetchProducts', filters }
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch a single product
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.productDetail(id),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch product: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Fetch single product error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useProducts', operation: 'fetchProduct', productId: id }
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
 * Hook to create a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create product: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Create product error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useProducts', operation: 'createProduct', productName: product.name }
        });
        throw error;
      }
    },
    onSuccess: () => {
      invalidateProducts(queryClient);
    },
    retry: 1,
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update product: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Update product error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useProducts', operation: 'updateProduct', productId: id }
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      invalidateProducts(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(variables.id) });
    },
    retry: 1,
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete product: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        logger.error({
          message: 'Delete product error',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { hook: 'useProducts', operation: 'deleteProduct', productId: id }
        });
        throw error;
      }
    },
    onSuccess: () => {
      invalidateProducts(queryClient);
    },
    retry: 1,
  });
}



