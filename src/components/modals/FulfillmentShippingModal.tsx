'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Truck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface ShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  onComplete: () => void;
}

export function FulfillmentShippingModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  customerEmail,
  onComplete,
}: ShippingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    carrier: 'USPS',
    service: 'GROUND',
    trackingNumber: '',
    sendNotification: true,
  });

  if (!isOpen) return null;

  const carriers = [
    { value: 'USPS', label: 'USPS' },
    { value: 'FEDEX', label: 'FedEx' },
    { value: 'UPS', label: 'UPS' },
    { value: 'DHL', label: 'DHL' },
    { value: 'LOCAL', label: 'Local Courier' },
  ];

  const services = [
    { value: 'GROUND', label: 'Ground' },
    { value: 'PRIORITY', label: 'Priority' },
    { value: 'EXPRESS', label: 'Express' },
    { value: 'OVERNIGHT', label: 'Overnight' },
  ];

  const handleComplete = async () => {
    if (!formData.trackingNumber.trim()) {
      toast.error('Please enter tracking number');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/fulfillment/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to mark as shipped');

      toast.success('Order marked as shipped - Customer notified');
      onComplete();
      onClose();
    } catch (error) {
      logger.error({
        message: 'Shipping error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { orderId, orderNumber }
      });
      toast.error('Failed to mark order as shipped');
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
              <Truck className="w-5 h-5 mr-2" />
              Ship Order #{orderNumber}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enter shipping details
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Carrier */}
          <div>
            <Label htmlFor="carrier">Carrier *</Label>
            <select
              id="carrier"
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
            >
              {carriers.map((carrier) => (
                <option key={carrier.value} value={carrier.value}>
                  {carrier.label}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <Label htmlFor="service">Service Level *</Label>
            <select
              id="service"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              required
            >
              {services.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking Number */}
          <div>
            <Label htmlFor="trackingNumber">Tracking Number *</Label>
            <Input
              id="trackingNumber"
              type="text"
              value={formData.trackingNumber}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
              placeholder="1Z9999999999999999"
              required
            />
          </div>

          {/* Notification */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="sendNotification"
                checked={formData.sendNotification}
                onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <div className="ml-3">
                <Label htmlFor="sendNotification" className="font-medium text-gray-900 dark:text-white">
                  Send tracking email to customer
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Email will be sent to: {customerEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              onClick={handleComplete}
              disabled={loading || !formData.trackingNumber}
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
                  Mark as Shipped
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

