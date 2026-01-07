'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, Package, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface PickingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    location: string;
  }>;
  onComplete: () => void;
}

export function FulfillmentPickingModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  items,
  onComplete,
}: PickingModalProps) {
  const [loading, setLoading] = useState(false);
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const togglePicked = (itemId: string) => {
    const newPicked = new Set(pickedItems);
    if (newPicked.has(itemId)) {
      newPicked.delete(itemId);
    } else {
      newPicked.add(itemId);
    }
    setPickedItems(newPicked);
  };

  const allPicked = items.length > 0 && pickedItems.size === items.length;

  const handleComplete = async () => {
    if (!allPicked) {
      toast.error('Please pick all items before continuing');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/fulfillment/${orderId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picked: true }),
      });

      if (!response.ok) throw new Error('Failed to complete picking');

      toast.success('Picking completed - Order moved to packing');
      onComplete();
      onClose();
    } catch (error) {
      logger.error({
        message: 'Picking error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { orderId, orderNumber }
      });
      toast.error('Failed to complete picking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Picking Order #{orderNumber}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Check off items as you pick them
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Progress
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {pickedItems.size} / {items.length} items
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(pickedItems.size / items.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => {
              const isPicked = pickedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => togglePicked(item.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isPicked
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isPicked
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isPicked && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isPicked ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {item.productName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          SKU: {item.sku} · Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                          📍 Location: {item.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={handleComplete}
              disabled={loading || !allPicked}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Picking ({pickedItems.size}/{items.length})
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

