'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Save, X, Package, DollarSign, Tag, Archive } from 'lucide-react';
import { ProductForm } from '@/components/forms/ProductForm';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  categoryId?: string;
  isActive: boolean;
  weight?: number;
  dimensions?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Product not found');
          router.push('/dashboard/products');
          return;
        }
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data.product || data.data || data);
    } catch (error) {
      handleError(error, 'Fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (productData: any) => {
    try {
      setFormLoading(true);
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) throw new Error('Failed to update product');

      toast.success('Product updated successfully');
      await fetchProduct();
      setIsEditing(false);
    } catch (error) {
      handleError(error, 'Update product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete product');

      toast.success('Product deleted successfully');
      router.push('/dashboard/products');
    } catch (error) {
      handleError(error, 'Delete product');
    }
  };

  const toggleStatus = async () => {
    if (!product) return;

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      
      if (!response.ok) throw new Error('Failed to update product status');

      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`);
      await fetchProduct();
    } catch (error) {
      handleError(error, 'Update product status');
    }
  };

  if (loading) {
    return <PageLoader text="Loading product..." />;
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The product you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push('/dashboard/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Edit Product
                </h1>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <ProductForm
              product={product}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isLoading={formLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleStatus}>
            <Archive className="w-4 h-4 mr-2" />
            {product.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
          product.isActive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {product.isActive ? '✓ Active' : '✗ Inactive'}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Product Details
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Product Name</dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">{product.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">SKU</dt>
              <dd className="mt-1 text-base font-mono text-gray-900 dark:text-white">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</dt>
              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                {product.description || 'No description available'}
              </dd>
            </div>
            {product.tags && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  Tags
                </dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white">{product.tags}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Selling Price</dt>
                <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                  LKR {product.price?.toFixed(2)}
                </dd>
              </div>
              {product.cost !== undefined && (
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost Price</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    LKR {product.cost.toFixed(2)}
                  </dd>
                </div>
              )}
              {product.cost !== undefined && product.price && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Margin</dt>
                  <dd className="text-lg font-semibold text-green-600">
                    {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Inventory */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Inventory
            </h2>
            <dl className="space-y-3">
              {product.stock !== undefined && (
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Stock</dt>
                  <dd className={`text-2xl font-bold ${
                    product.stock === 0 ? 'text-red-600' :
                    product.stock < (product.minStock || 10) ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {product.stock}
                  </dd>
                </div>
              )}
              {product.minStock !== undefined && (
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Minimum Stock</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{product.minStock}</dd>
                </div>
              )}
              {product.stock !== undefined && product.minStock !== undefined && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  {product.stock === 0 ? (
                    <p className="text-sm text-red-600 font-semibold">⚠️ Out of Stock</p>
                  ) : product.stock < product.minStock ? (
                    <p className="text-sm text-yellow-600 font-semibold">⚠️ Low Stock Alert</p>
                  ) : (
                    <p className="text-sm text-green-600 font-semibold">✓ Stock Level OK</p>
                  )}
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Shipping Info */}
      {(product.weight || product.dimensions) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shipping Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.weight && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Weight</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white">{product.weight} kg</dd>
              </div>
            )}
            {product.dimensions && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Dimensions</dt>
                <dd className="mt-1 text-base text-gray-900 dark:text-white">{product.dimensions}</dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</dt>
            <dd className="mt-1 text-base text-gray-900 dark:text-white">
              {new Date(product.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</dt>
            <dd className="mt-1 text-base text-gray-900 dark:text-white">
              {new Date(product.updatedAt).toLocaleString()}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}

