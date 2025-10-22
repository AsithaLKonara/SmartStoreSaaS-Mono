'use client';

import { useState, useEffect } from 'react';
import { PageLoader, TableLoader } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductForm } from '@/components/forms/ProductForm';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { ExportDialog } from '@/components/ExportDialog';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { SearchQuery } from '@/lib/search';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost?: number;
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    query: '',
    filters: {},
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 10,
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (query: SearchQuery = {
    query: '',
    filters: {},
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 10,
  }) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (query.query) params.append('search', query.query);
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sort) params.append('sort', query.sort);
      if (query.order) params.append('order', query.order);
      
      // Add filters
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          params.append(`filters[${key}]`, String(value));
        });
      }
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      setFormLoading(true);
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
      }

      await fetchProducts(searchQuery); // Refresh the list
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      handleError(error, 'Product save');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    // Navigate to product detail page
    window.location.href = `/dashboard/products/${product.id}`;
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      await fetchProducts(searchQuery); // Refresh the list
      toast.success('Product deleted successfully');
    } catch (error) {
      handleError(error, 'Product delete');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSearch = (query: SearchQuery) => {
    setSearchQuery(query);
    fetchProducts(query);
  };

  const handleSearchReset = () => {
    setSearchQuery({
      query: '',
      filters: {},
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      limit: 10,
    });
    fetchProducts();
  };

  if (loading) {
    return <PageLoader text="Loading products..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchProducts()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="products-page">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-gray-600 mt-2">
              {editingProduct ? 'Update product information' : 'Create a new product in your catalog'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <ProductForm
              product={editingProduct || undefined}
              onSave={handleSaveProduct}
              onCancel={handleCancelForm}
              isLoading={formLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="products-page">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="products-title">Products</h1>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </Button>
          <Button 
            data-testid="add-product-button"
            onClick={() => setShowForm(true)}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Advanced Search */}
      <div className="mb-6">
        <AdvancedSearch
          entityType="products"
          onSearch={handleSearch}
          onReset={handleSearchReset}
          placeholder="Search products by name, SKU, or description..."
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search products..."
                className="mt-1"
                data-testid="search-input"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        data={products}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                {item.description && (
                  <div className="text-sm text-gray-500">{item.description}</div>
                )}
              </div>
            )
          },
          {
            key: 'sku',
            label: 'SKU'
          },
          {
            key: 'price',
            label: 'Price',
            render: (value) => `LKR ${value.toFixed(2)}`
          },
          {
            key: 'isActive',
            label: 'Status',
            render: (value) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {value ? 'Active' : 'Inactive'}
              </span>
            )
          }
        ]}
        actions={(product) => (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleEditProduct(product)}
            >
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleDeleteProduct(product.id)}
            >
              Delete
            </Button>
          </>
        )}
        emptyMessage="No products found."
        data-testid="product-list"
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        entityType="products"
        currentFilters={searchQuery}
      />
    </div>
  );
}