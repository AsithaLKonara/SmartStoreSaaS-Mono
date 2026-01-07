'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Package, Printer, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface PackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  onComplete: () => void;
}

export function FulfillmentPackingModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  items,
  onComplete,
}: PackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    boxSize: 'MEDIUM',
    weight: '',
    fragile: false,
    requiresSignature: false,
  });

  if (!isOpen) return null;

  const boxSizes = [
    { value: 'SMALL', label: 'Small (6x4x4")' },
    { value: 'MEDIUM', label: 'Medium (12x9x6")' },
    { value: 'LARGE', label: 'Large (18x14x8")' },
    { value: 'XLARGE', label: 'X-Large (24x18x12")' },
  ];

  const handleGenerateLabel = async () => {
    if (!formData.weight) {
      toast.error('Please enter package weight');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/fulfillment/${orderId}/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to generate label');

      const data = await response.json();
      
      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank');
      }

      toast.success('Shipping label generated');
    } catch (error) {
      logger.error({
        message: 'Label generation error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { orderId, orderNumber }
      });
      toast.error('Failed to generate shipping label');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!formData.weight) {
      toast.error('Please enter package weight');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/fulfillment/${orderId}/pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to complete packing');

      toast.success('Packing completed - Order ready for shipping');
      onComplete();
      onClose();
    } catch (error) {
      logger.error({
        message: 'Packing error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { orderId, orderNumber }
      });
      toast.error('Failed to complete packing');
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
              Packing Order #{orderNumber}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pack items and generate shipping label
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Items Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Items to Pack</h3>
            <ul className="space-y-1">
              {items.map((item, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {item.productName} (x{item.quantity})
                </li>
              ))}
            </ul>
          </div>

          {/* Box Size */}
          <div>
            <Label htmlFor="boxSize">Box Size *</Label>
            <select
              id="boxSize"
              value={formData.boxSize}
              onChange={(e) => setFormData({ ...formData, boxSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
            >
              {boxSizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div>
            <Label htmlFor="weight">Package Weight (lbs) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="5.5"
              required
            />
          </div>

          {/* Special Handling */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fragile"
                checked={formData.fragile}
                onChange={(e) => setFormData({ ...formData, fragile: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="fragile" className="ml-2">
                Fragile - Handle with care
              </Label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="signature"
                checked={formData.requiresSignature}
                onChange={(e) => setFormData({ ...formData, requiresSignature: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="signature" className="ml-2">
                Signature Required
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateLabel}
              disabled={loading || !formData.weight}
            >
              <Printer className="w-4 h-4 mr-2" />
              Generate Shipping Label
            </Button>
            <Button
              type="button"
              onClick={handleComplete}
              disabled={loading || !formData.weight}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Packing
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

