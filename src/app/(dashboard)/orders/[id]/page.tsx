'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Printer, 
  Truck, 
  XCircle, 
  Package,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { formatCurrency, formatDate, formatPhoneNumber } from '@/lib/utils';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface OrderDetails {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  items: Array<{
    id: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-yellow-100 text-yellow-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Order not found');
          router.push('/dashboard/orders');
          return;
        }
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order || data.data || data);
    } catch (error) {
      handleError(error, 'Fetch order');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    toast.success('Print functionality coming soon');
    // TODO: Implement PDF generation
  };

  const handleTrack = () => {
    toast.success('Tracking functionality coming soon');
    // TODO: Implement tracking modal
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      toast.success('Order cancelled successfully');
      await fetchOrder();
    } catch (error) {
      handleError(error, 'Cancel order');
    }
  };

  if (loading) {
    return <PageLoader text="Loading order details..." />;
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push('/dashboard/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
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
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Created {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintInvoice}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
            <>
              <Button variant="outline" onClick={handleTrack}>
                <Truck className="w-4 h-4 mr-2" />
                Track
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span className="font-semibold">Status: {order.status.replace('_', ' ')}</span>
          <span className="mx-2">|</span>
          <span>Payment: {order.paymentStatus}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Customer
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.customer?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {order.customer?.phone ? formatPhoneNumber(order.customer.phone) : 'N/A'}
              </p>
            </div>
            {order.shippingAddress && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Shipping Address
                </p>
                <p className="font-medium text-gray-900 dark:text-white">{order.shippingAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Status
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Order Status</p>
              <p className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                {order.status.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
              <p className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.paymentStatus}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
          <div className="space-y-2">
            {order.subtotal && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.tax !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="font-medium">{formatCurrency(order.tax)}</span>
              </div>
            )}
            {order.shipping !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-medium">{formatCurrency(order.shipping)}</span>
              </div>
            )}
            {order.discount && order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-medium">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Items ({order.items?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.product?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {item.product?.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-white">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.quantity * item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notes</h2>
          <p className="text-gray-600 dark:text-gray-400">{order.notes}</p>
        </div>
      )}
    </div>
  );
}

