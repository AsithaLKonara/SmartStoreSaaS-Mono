'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
  usage: Array<{
    id: string;
    order: {
      id: string;
      orderNumber: string;
      total: number;
      createdAt: string;
    };
    customer: {
      id: string;
      name: string;
      email: string;
    };
    discountAmount: number;
    usedAt: string;
  }>;
}

interface CouponManagerProps {
  onCouponSelect?: (coupon: Coupon) => void;
}

export default function CouponManager({ onCouponSelect }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE' as const,
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    isActive: true,
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCoupon ? '/api/coupons' : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingCoupon?.id,
          minOrderAmount: formData.minOrderAmount || null,
          maxDiscountAmount: formData.maxDiscountAmount || null,
          usageLimit: formData.usageLimit || null,
          validFrom: formData.validFrom || null,
          validTo: formData.validTo || null
        }),
      });

      if (response.ok) {
        const coupon = await response.json();
        if (editingCoupon) {
          setCoupons(coupons.map(c => c.id === coupon.id ? coupon : c));
        } else {
          setCoupons([coupon, ...coupons]);
        }
        resetForm();
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      isActive: true,
      validFrom: '',
      validTo: ''
    });
    setEditingCoupon(null);
    setShowCreateForm(false);
  };

  const editCoupon = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : ''
    });
    setEditingCoupon(coupon);
    setShowCreateForm(true);
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/coupons?id=${couponId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCoupons(coupons.filter(c => c.id !== couponId));
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && coupon.isActive) ||
                         (filterActive === 'inactive' && !coupon.isActive);
    return matchesSearch && matchesFilter;
  });

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { status: 'inactive', color: 'text-gray-500' };
    if (coupon.validFrom && now < new Date(coupon.validFrom)) return { status: 'upcoming', color: 'text-yellow-500' };
    if (coupon.validTo && now > new Date(coupon.validTo)) return { status: 'expired', color: 'text-red-500' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { status: 'limit-reached', color: 'text-red-500' };
    return { status: 'active', color: 'text-green-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Coupon Management
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Coupons</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coupon Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Order Amount
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Discount Amount
                </label>
                <input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid To
                </label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingCoupon ? 'Update' : 'Create'} Coupon
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No coupons found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterActive !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first coupon to start offering discounts'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCoupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <div key={coupon.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {coupon.name}
                      </h3>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.status.toUpperCase()}
                      </span>
                      {coupon.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCouponCode(coupon.code)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {coupon.type === 'PERCENTAGE' && `${coupon.value}% off`}
                        {coupon.type === 'FIXED_AMOUNT' && `${formatCurrency(coupon.value)} off`}
                        {coupon.type === 'FREE_SHIPPING' && 'Free shipping'}
                      </div>
                    </div>

                    {coupon.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {coupon.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Used:</span>
                        <span className="ml-1 font-medium">
                          {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                        </span>
                      </div>
                      {coupon.minOrderAmount && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Min Order:</span>
                          <span className="ml-1 font-medium">{formatCurrency(coupon.minOrderAmount)}</span>
                        </div>
                      )}
                      {coupon.validFrom && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">From:</span>
                          <span className="ml-1 font-medium">
                            {new Date(coupon.validFrom).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {coupon.validTo && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">To:</span>
                          <span className="ml-1 font-medium">
                            {new Date(coupon.validTo).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editCoupon(coupon)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit coupon"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {onCouponSelect && (
                      <button
                        onClick={() => onCouponSelect(coupon)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
  usage: Array<{
    id: string;
    order: {
      id: string;
      orderNumber: string;
      total: number;
      createdAt: string;
    };
    customer: {
      id: string;
      name: string;
      email: string;
    };
    discountAmount: number;
    usedAt: string;
  }>;
}

interface CouponManagerProps {
  onCouponSelect?: (coupon: Coupon) => void;
}

export default function CouponManager({ onCouponSelect }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE' as const,
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    isActive: true,
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCoupon ? '/api/coupons' : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingCoupon?.id,
          minOrderAmount: formData.minOrderAmount || null,
          maxDiscountAmount: formData.maxDiscountAmount || null,
          usageLimit: formData.usageLimit || null,
          validFrom: formData.validFrom || null,
          validTo: formData.validTo || null
        }),
      });

      if (response.ok) {
        const coupon = await response.json();
        if (editingCoupon) {
          setCoupons(coupons.map(c => c.id === coupon.id ? coupon : c));
        } else {
          setCoupons([coupon, ...coupons]);
        }
        resetForm();
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      isActive: true,
      validFrom: '',
      validTo: ''
    });
    setEditingCoupon(null);
    setShowCreateForm(false);
  };

  const editCoupon = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : ''
    });
    setEditingCoupon(coupon);
    setShowCreateForm(true);
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/coupons?id=${couponId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCoupons(coupons.filter(c => c.id !== couponId));
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && coupon.isActive) ||
                         (filterActive === 'inactive' && !coupon.isActive);
    return matchesSearch && matchesFilter;
  });

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { status: 'inactive', color: 'text-gray-500' };
    if (coupon.validFrom && now < new Date(coupon.validFrom)) return { status: 'upcoming', color: 'text-yellow-500' };
    if (coupon.validTo && now > new Date(coupon.validTo)) return { status: 'expired', color: 'text-red-500' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { status: 'limit-reached', color: 'text-red-500' };
    return { status: 'active', color: 'text-green-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Coupon Management
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Coupons</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coupon Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Order Amount
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Discount Amount
                </label>
                <input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid To
                </label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingCoupon ? 'Update' : 'Create'} Coupon
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No coupons found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterActive !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first coupon to start offering discounts'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCoupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <div key={coupon.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {coupon.name}
                      </h3>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.status.toUpperCase()}
                      </span>
                      {coupon.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCouponCode(coupon.code)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {coupon.type === 'PERCENTAGE' && `${coupon.value}% off`}
                        {coupon.type === 'FIXED_AMOUNT' && `${formatCurrency(coupon.value)} off`}
                        {coupon.type === 'FREE_SHIPPING' && 'Free shipping'}
                      </div>
                    </div>

                    {coupon.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {coupon.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Used:</span>
                        <span className="ml-1 font-medium">
                          {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                        </span>
                      </div>
                      {coupon.minOrderAmount && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Min Order:</span>
                          <span className="ml-1 font-medium">{formatCurrency(coupon.minOrderAmount)}</span>
                        </div>
                      )}
                      {coupon.validFrom && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">From:</span>
                          <span className="ml-1 font-medium">
                            {new Date(coupon.validFrom).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {coupon.validTo && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">To:</span>
                          <span className="ml-1 font-medium">
                            {new Date(coupon.validTo).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editCoupon(coupon)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit coupon"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {onCouponSelect && (
                      <button
                        onClick={() => onCouponSelect(coupon)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
  usage: Array<{
    id: string;
    order: {
      id: string;
      orderNumber: string;
      total: number;
      createdAt: string;
    };
    customer: {
      id: string;
      name: string;
      email: string;
    };
    discountAmount: number;
    usedAt: string;
  }>;
}

interface CouponManagerProps {
  onCouponSelect?: (coupon: Coupon) => void;
}

export default function CouponManager({ onCouponSelect }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE' as const,
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    isActive: true,
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/coupons');
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCoupon ? '/api/coupons' : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingCoupon?.id,
          minOrderAmount: formData.minOrderAmount || null,
          maxDiscountAmount: formData.maxDiscountAmount || null,
          usageLimit: formData.usageLimit || null,
          validFrom: formData.validFrom || null,
          validTo: formData.validTo || null
        }),
      });

      if (response.ok) {
        const coupon = await response.json();
        if (editingCoupon) {
          setCoupons(coupons.map(c => c.id === coupon.id ? coupon : c));
        } else {
          setCoupons([coupon, ...coupons]);
        }
        resetForm();
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      isActive: true,
      validFrom: '',
      validTo: ''
    });
    setEditingCoupon(null);
    setShowCreateForm(false);
  };

  const editCoupon = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : ''
    });
    setEditingCoupon(coupon);
    setShowCreateForm(true);
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/coupons?id=${couponId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCoupons(coupons.filter(c => c.id !== couponId));
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && coupon.isActive) ||
                         (filterActive === 'inactive' && !coupon.isActive);
    return matchesSearch && matchesFilter;
  });

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { status: 'inactive', color: 'text-gray-500' };
    if (coupon.validFrom && now < new Date(coupon.validFrom)) return { status: 'upcoming', color: 'text-yellow-500' };
    if (coupon.validTo && now > new Date(coupon.validTo)) return { status: 'expired', color: 'text-red-500' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { status: 'limit-reached', color: 'text-red-500' };
    return { status: 'active', color: 'text-green-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Coupon Management
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Coupons</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coupon Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Order Amount
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Discount Amount
                </label>
                <input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid To
                </label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingCoupon ? 'Update' : 'Create'} Coupon
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No coupons found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterActive !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first coupon to start offering discounts'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCoupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <div key={coupon.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {coupon.name}
                      </h3>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.status.toUpperCase()}
                      </span>
                      {coupon.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCouponCode(coupon.code)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {coupon.type === 'PERCENTAGE' && `${coupon.value}% off`}
                        {coupon.type === 'FIXED_AMOUNT' && `${formatCurrency(coupon.value)} off`}
                        {coupon.type === 'FREE_SHIPPING' && 'Free shipping'}
                      </div>
                    </div>

                    {coupon.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {coupon.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Used:</span>
                        <span className="ml-1 font-medium">
                          {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                        </span>
                      </div>
                      {coupon.minOrderAmount && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Min Order:</span>
                          <span className="ml-1 font-medium">{formatCurrency(coupon.minOrderAmount)}</span>
                        </div>
                      )}
                      {coupon.validFrom && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">From:</span>
                          <span className="ml-1 font-medium">
                            {new Date(coupon.validFrom).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {coupon.validTo && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">To:</span>
                          <span className="ml-1 font-medium">
                            {new Date(coupon.validTo).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editCoupon(coupon)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit coupon"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {onCouponSelect && (
                      <button
                        onClick={() => onCouponSelect(coupon)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
