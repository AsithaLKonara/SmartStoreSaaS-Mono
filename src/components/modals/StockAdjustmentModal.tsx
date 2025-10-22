'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  onComplete: () => void;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentStock,
  onComplete,
}: StockAdjustmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');

  if (!isOpen) return null;

  const calculateNewStock = () => {
    switch (adjustmentType) {
      case 'ADD':
        return currentStock + quantity;
      case 'REMOVE':
        return Math.max(0, currentStock - quantity);
      case 'SET':
        return quantity;
      default:
        return currentStock;
    }
  };

  const newStock = calculateNewStock();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for adjustment');
      return;
    }

    if (quantity < 0) {
      toast.error('Quantity must be positive');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/inventory/${productId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustmentType,
          quantity,
          reason,
          reference: reference || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to adjust stock');

      const data = await response.json();
      toast.success(`Stock adjusted successfully. New stock: ${newStock}`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Stock adjustment error:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Adjust Stock
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{productName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Stock Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Current Stock: <span className="font-bold text-lg">{currentStock}</span>
            </p>
          </div>

          {/* Adjustment Type */}
          <div>
            <Label htmlFor="adjustmentType">Adjustment Type *</Label>
            <select
              id="adjustmentType"
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
            >
              <option value="ADD">Add Stock (+)</option>
              <option value="REMOVE">Remove Stock (-)</option>
              <option value="SET">Set Stock Level (=)</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">
              {adjustmentType === 'SET' ? 'New Stock Level *' : 'Quantity *'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder={adjustmentType === 'SET' ? 'Enter new stock level' : 'Enter quantity'}
              required
            />
          </div>

          {/* New Stock Preview */}
          <div className={`${newStock < currentStock ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'} border rounded-lg p-4`}>
            <p className="text-sm font-semibold">
              New Stock: <span className="text-lg">{currentStock}</span>
              <span className="mx-2">→</span>
              <span className={`text-lg ${newStock < currentStock ? 'text-yellow-600' : 'text-green-600'}`}>
                {newStock}
              </span>
            </p>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
            >
              <option value="">-- Select Reason --</option>
              <option value="PURCHASE">Purchase Order Received</option>
              <option value="SALE">Sale/Order Fulfilled</option>
              <option value="DAMAGE">Damaged Goods</option>
              <option value="THEFT">Theft/Loss</option>
              <option value="RETURN">Customer Return</option>
              <option value="CORRECTION">Inventory Correction</option>
              <option value="TRANSFER">Warehouse Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO #, Order #, or other reference"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                'Adjust Stock'
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

