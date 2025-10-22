'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

interface Product {
  id?: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost?: number;
  categoryId?: string;
  isActive: boolean;
  stock?: number;
  minStock?: number;
}

interface ProductFormProps {
  product?: Product;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSave, onCancel, isLoading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    sku: '',
    price: 0,
    cost: 0,
    categoryId: '',
    isActive: true,
    stock: 0,
    minStock: 0,
    ...product
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({ ...product });
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.cost && formData.cost < 0) {
      newErrors.cost = 'Cost cannot be negative';
    }

    if (formData.stock !== undefined && formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (formData.minStock !== undefined && formData.minStock < 0) {
      newErrors.minStock = 'Minimum stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      await onSave(formData);
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="md:col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter product name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* SKU */}
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            type="text"
            value={formData.sku}
            onChange={(e) => handleInputChange('sku', e.target.value)}
            placeholder="Enter SKU"
            className={errors.sku ? 'border-red-500' : ''}
          />
          {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            value={formData.categoryId || ''}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home">Home & Garden</option>
          </select>
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>

        {/* Cost */}
        <div>
          <Label htmlFor="cost">Cost</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost || ''}
            onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={errors.cost ? 'border-red-500' : ''}
          />
          {errors.cost && <p className="text-red-500 text-sm mt-1">{errors.cost}</p>}
        </div>

        {/* Stock */}
        <div>
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock || ''}
            onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
            placeholder="0"
            className={errors.stock ? 'border-red-500' : ''}
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
        </div>

        {/* Minimum Stock */}
        <div>
          <Label htmlFor="minStock">Minimum Stock</Label>
          <Input
            id="minStock"
            type="number"
            min="0"
            value={formData.minStock || ''}
            onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
            placeholder="0"
            className={errors.minStock ? 'border-red-500' : ''}
          />
          {errors.minStock && <p className="text-red-500 text-sm mt-1">{errors.minStock}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter product description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Active Status */}
        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isActive">Product is active</Label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
}


