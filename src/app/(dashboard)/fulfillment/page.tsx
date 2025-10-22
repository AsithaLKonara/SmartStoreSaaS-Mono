'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PackageCheck,
  Package,
  ShoppingCart,
  Truck,
  CheckCircle,
  Clock,
  Users,
  Printer,
  Play,
  BarChart3
} from 'lucide-react';

interface FulfillmentOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    location: string;
  }>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'PICKING' | 'PACKING' | 'READY' | 'SHIPPED';
  assignedTo: string | null;
  totalAmount: number;
  createdAt: string;
}

export default function FulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchFulfillmentOrders();
  }, [filter]);

  const fetchFulfillmentOrders = async () => {
    try {
      setLoading(true);
      const url = `/api/fulfillment${filter !== 'all' ? `?status=${filter}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        // Mock data for demonstration
        setOrders([
          {
            id: 'ful_001',
            orderNumber: 'ORD-2024-001',
            customer: {
              name: 'John Doe',
              email: 'john.doe@smartstore.test',
              phone: '+94771234567'
            },
            items: [
              { productName: 'Product A', quantity: 2, location: 'A-01-03' },
              { productName: 'Product B', quantity: 1, location: 'B-05-12' }
            ],
            priority: 'HIGH',
            status: 'PENDING',
            assignedTo: null,
            totalAmount: 5000,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ful_002',
            orderNumber: 'ORD-2024-002',
            customer: {
              name: 'Jane Smith',
              email: 'jane.smith@smartstore.test',
              phone: '+94771234568'
            },
            items: [
              { productName: 'Product C', quantity: 1, location: 'C-02-05' }
            ],
            priority: 'MEDIUM',
            status: 'PICKING',
            assignedTo: 'Staff User',
            totalAmount: 3000,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching fulfillment orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const startPicking = async (orderId: string) => {
    try {
      const response = await fetch(`/api/fulfillment/${orderId}/pick`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Picking started!');
        fetchFulfillmentOrders();
      } else {
        alert('Failed to start picking');
      }
    } catch (error) {
      alert('Error starting picking');
    }
  };

  const startPacking = async (orderId: string) => {
    try {
      const response = await fetch(`/api/fulfillment/${orderId}/pack`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Packing started!');
        fetchFulfillmentOrders();
      } else {
        alert('Failed to start packing');
      }
    } catch (error) {
      alert('Error starting packing');
    }
  };

  const generateLabel = async (orderId: string) => {
    try {
      const response = await fetch(`/api/fulfillment/${orderId}/label`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.labelUrl) {
          window.open(data.labelUrl, '_blank');
        } else {
          alert('Shipping label generated!');
        }
        fetchFulfillmentOrders();
      } else {
        alert('Failed to generate label');
      }
    } catch (error) {
      alert('Error generating label');
    }
  };

  const markShipped = async (orderId: string) => {
    if (!confirm('Mark this order as shipped?')) return;

    try {
      const response = await fetch(`/api/fulfillment/${orderId}/ship`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Order marked as shipped!');
        fetchFulfillmentOrders();
      } else {
        alert('Failed to mark as shipped');
      }
    } catch (error) {
      alert('Error marking as shipped');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      LOW: 'bg-gray-500/20 text-gray-300',
      MEDIUM: 'bg-yellow-500/20 text-yellow-300',
      HIGH: 'bg-orange-500/20 text-orange-300',
      URGENT: 'bg-red-500/20 text-red-300',
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || ''}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { color: 'bg-gray-500/20 text-gray-300', icon: Clock },
      PICKING: { color: 'bg-blue-500/20 text-blue-300', icon: Package },
      PACKING: { color: 'bg-purple-500/20 text-purple-300', icon: PackageCheck },
      READY: { color: 'bg-green-500/20 text-green-300', icon: CheckCircle },
      SHIPPED: { color: 'bg-green-600/20 text-green-400', icon: Truck },
    };

    const statusConfig = config[status as keyof typeof config];
    if (!statusConfig) return null;

    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color + ' flex items-center gap-1'}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    picking: orders.filter(o => o.status === 'PICKING').length,
    packing: orders.filter(o => o.status === 'PACKING').length,
    ready: orders.filter(o => o.status === 'READY').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Fulfillment Center</h1>
          <p className="text-gray-400 mt-2">
            Manage order picking, packing, and shipping
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="text-lg px-4 py-2 bg-blue-500/20 text-blue-300">
            {stats.pending} Pending
          </Badge>
          <Badge className="text-lg px-4 py-2 bg-purple-500/20 text-purple-300">
            {stats.picking + stats.packing} In Progress
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-300">{stats.pending}</p>
              <p className="text-sm text-gray-400 mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.picking}</p>
              <p className="text-sm text-gray-400 mt-1">Picking</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.packing}</p>
              <p className="text-sm text-gray-400 mt-1">Packing</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.ready}</p>
              <p className="text-sm text-gray-400 mt-1">Ready</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.shipped}</p>
              <p className="text-sm text-gray-400 mt-1">Shipped</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Orders
            </Button>
            <Button
              variant={filter === 'PENDING' ? 'default' : 'outline'}
              onClick={() => setFilter('PENDING')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'PICKING' ? 'default' : 'outline'}
              onClick={() => setFilter('PICKING')}
            >
              Picking
            </Button>
            <Button
              variant={filter === 'PACKING' ? 'default' : 'outline'}
              onClick={() => setFilter('PACKING')}
            >
              Packing
            </Button>
            <Button
              variant={filter === 'READY' ? 'default' : 'outline'}
              onClick={() => setFilter('READY')}
            >
              Ready to Ship
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fulfillment Queue */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5" />
            Fulfillment Queue
          </CardTitle>
          <CardDescription className="text-gray-400">
            Orders ready for picking, packing, and shipping
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Order</TableHead>
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Items</TableHead>
                    <TableHead className="text-gray-400">Priority</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Assigned To</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-gray-700">
                      <TableCell className="text-white font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{order.customer.name}</p>
                          <p className="text-sm text-gray-400">{order.customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-gray-300">
                              {item.productName} (x{item.quantity})
                              <span className="text-gray-500 ml-2">{item.location}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(order.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {order.assignedTo || <span className="text-gray-500">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => startPicking(order.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start Pick
                            </Button>
                          )}
                          {order.status === 'PICKING' && (
                            <Button
                              size="sm"
                              onClick={() => startPacking(order.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Package className="w-3 h-3 mr-1" />
                              Start Pack
                            </Button>
                          )}
                          {order.status === 'PACKING' || order.status === 'READY' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateLabel(order.id)}
                              >
                                <Printer className="w-3 h-3 mr-1" />
                                Label
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => markShipped(order.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Truck className="w-3 h-3 mr-1" />
                                Ship
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <PackageCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No orders in fulfillment queue</p>
              <p className="text-sm mt-2">Orders ready for fulfillment will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">View Statistics</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              <span className="text-sm">Assign Orders</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Printer className="w-6 h-6" />
              <span className="text-sm">Batch Labels</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Truck className="w-6 h-6" />
              <span className="text-sm">Ship Multiple</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

