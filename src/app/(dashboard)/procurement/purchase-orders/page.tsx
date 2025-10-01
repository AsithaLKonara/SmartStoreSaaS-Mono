'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, FileText, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  expectedDate: string;
  totalAmount: number;
  currency: string;
  supplier: {
    companyName: string;
    supplierCode: string;
  };
  _count: {
    items: number;
    invoices: number;
  };
}

export default function PurchaseOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session, filter]);

  const fetchOrders = async () => {
    try {
      let url = '/api/procurement/purchase-orders';
      if (filter !== 'all') url += `?status=${filter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'sent':
      case 'confirmed':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-purple-100 text-purple-800',
      partial: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-gray-600 mt-2">Manage purchase orders and track deliveries</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'sent', 'confirmed', 'partial', 'received'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{order.poNumber}</h3>
                      <p className="text-sm text-gray-600">{order.supplier.companyName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order Date</span>
                      <div className="font-medium">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Expected</span>
                      <div className="font-medium">
                        {order.expectedDate
                          ? new Date(order.expectedDate).toLocaleDateString()
                          : 'Not set'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Items</span>
                      <div className="font-medium">{order._count.items}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Invoices</span>
                      <div className="font-medium">{order._count.invoices}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {order.currency} {order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="mb-4">No purchase orders found</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Purchase Order
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

