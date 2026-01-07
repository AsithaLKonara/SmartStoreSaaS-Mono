'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'products' | 'orders' | 'customers';
  selectedIds: string[];
  onComplete: () => void;
}

export function BulkOperationsModal({
  isOpen,
  onClose,
  entityType,
  selectedIds,
  onComplete,
}: BulkOperationsModalProps) {
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  if (!isOpen) return null;

  const operations = {
    products: [
      { value: 'update_status', label: 'Update Status', fields: [{ name: 'isActive', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }] },
      { value: 'update_price', label: 'Update Prices', fields: [{ name: 'priceChange', type: 'number', label: 'Price Change (%)', placeholder: '10 for +10%, -10 for -10%' }] },
      { value: 'change_category', label: 'Change Category', fields: [{ name: 'categoryId', type: 'text', label: 'Category ID' }] },
      { value: 'delete', label: 'Delete Selected', fields: [] },
    ],
    orders: [
      { value: 'update_status', label: 'Update Status', fields: [{ name: 'status', type: 'select', options: [{ value: 'CONFIRMED', label: 'Confirmed' }, { value: 'CANCELLED', label: 'Cancelled' }] }] },
      { value: 'export', label: 'Export Selected', fields: [] },
      { value: 'delete', label: 'Delete Selected', fields: [] },
    ],
    customers: [
      { value: 'add_to_segment', label: 'Add to Segment', fields: [{ name: 'segmentId', type: 'text', label: 'Segment ID' }] },
      { value: 'send_email', label: 'Send Bulk Email', fields: [{ name: 'subject', type: 'text', label: 'Subject' }, { name: 'message', type: 'textarea', label: 'Message' }] },
      { value: 'export', label: 'Export Selected', fields: [] },
      { value: 'delete', label: 'Delete Selected', fields: [] },
    ],
  };

  const currentOperations = operations[entityType] || [];
  const selectedOperation = currentOperations.find(op => op.value === operation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!operation) {
      toast.error('Please select an operation');
      return;
    }

    if (operation === 'delete' && !confirm(`Delete ${selectedIds.length} ${entityType}? This cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          entityType,
          ids: selectedIds,
          data: formData,
        }),
      });

      if (!response.ok) throw new Error('Bulk operation failed');

      const data = await response.json();
      toast.success(`Successfully processed ${selectedIds.length} ${entityType}`);
      onComplete();
      onClose();
    } catch (error) {
      logger.error({
        message: 'Bulk operation error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { entityType, operation: operationType, selectedIds: selectedIds.length }
      });
      toast.error('Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bulk Operations ({selectedIds.length} selected)
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="operation">Choose Operation *</Label>
            <select
              id="operation"
              value={operation}
              onChange={(e) => {
                setOperation(e.target.value);
                setFormData({});
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
            >
              <option value="">-- Select Operation --</option>
              {currentOperations.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Fields */}
          {selectedOperation?.fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label || field.name} *</Label>
              {field.type === 'select' ? (
                <select
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  required
                >
                  <option value="">-- Select --</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  placeholder={field.placeholder}
                  required
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  required
                />
              )}
            </div>
          ))}

          {/* Warning for delete */}
          {operation === 'delete' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                ⚠️ Warning: This will permanently delete {selectedIds.length} {entityType}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !operation}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Apply Operation'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

