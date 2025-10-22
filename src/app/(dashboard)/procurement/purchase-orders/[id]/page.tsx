'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Package,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: Array<{
    id: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    unitPrice: number;
    receivedQuantity?: number;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  ORDERED: 'bg-purple-100 text-purple-800',
  PARTIALLY_RECEIVED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [params.id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/procurement/purchase-orders/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Purchase order not found');
          router.push('/dashboard/procurement/purchase-orders');
          return;
        }
        throw new Error('Failed to fetch purchase order');
      }

      const data = await response.json();
      setPo(data.purchaseOrder || data.data || data);
    } catch (error) {
      handleError(error, 'Fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this purchase order?')) return;

    try {
      const response = await fetch(`/api/procurement/purchase-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (!response.ok) throw new Error('Failed to approve PO');

      toast.success('Purchase order approved');
      await fetchPurchaseOrder();
    } catch (error) {
      handleError(error, 'Approve PO');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this purchase order?')) return;

    try {
      const response = await fetch(`/api/procurement/purchase-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (!response.ok) throw new Error('Failed to cancel PO');

      toast.success('Purchase order cancelled');
      await fetchPurchaseOrder();
    } catch (error) {
      handleError(error, 'Cancel PO');
    }
  };

  const handleReceive = () => {
    toast('Receiving workflow coming soon');
    // TODO: Implement receiving modal
  };

  if (loading) {
    return <PageLoader text="Loading purchase order..." />;
  }

  if (!po) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Purchase Order Not Found</h1>
          <Button onClick={() => router.push('/dashboard/procurement/purchase-orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Purchase Orders
          </Button>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              PO #{po.orderNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Created {formatDate(po.orderDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {po.status === 'DRAFT' && (
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {po.status === 'SUBMITTED' && (
            <Button onClick={handleApprove}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {(po.status === 'APPROVED' || po.status === 'ORDERED') && (
            <Button onClick={handleReceive}>
              <Package className="w-4 h-4 mr-2" />
              Receive Items
            </Button>
          )}
          {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusColors[po.status]}`}>
          {po.status.replace('_', ' ')}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Supplier
          </h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Name</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{po.supplier.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Code</dt>
              <dd className="font-mono text-gray-900 dark:text-white">{po.supplier.code}</dd>
            </div>
          </dl>
        </div>

        {/* Dates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Timeline
          </h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Order Date</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatDate(po.orderDate)}</dd>
            </div>
            {po.expectedDate && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Expected</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatDate(po.expectedDate)}</dd>
              </div>
            )}
            {po.receivedDate && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Received</dt>
                <dd className="font-medium text-green-600">{formatDate(po.receivedDate)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Total
          </h2>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(po.total)}
          </div>
          <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(po.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrency(po.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{formatCurrency(po.shipping)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Items ({po.items?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Ordered</th>
                {po.status !== 'DRAFT' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Received</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {po.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {item.product?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 font-mono">
                    {item.product?.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  {po.status !== 'DRAFT' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={item.receivedQuantity === item.quantity ? 'text-green-600 font-semibold' : 'text-yellow-600'}>
                        {item.receivedQuantity || 0}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {po.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-gray-600 dark:text-gray-400">{po.notes}</p>
        </div>
      )}
    </div>
  );
}

