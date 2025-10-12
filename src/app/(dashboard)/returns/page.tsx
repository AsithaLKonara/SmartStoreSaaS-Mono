'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  User,
  FileText,
  Search,
  Filter
} from 'lucide-react';

interface ReturnRequest {
  id: string;
  orderNumber: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
  };
  products: Array<{
    name: string;
    quantity: number;
  }>;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'COMPLETED';
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  useEffect(() => {
    fetchReturns();
  }, [filter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const url = `/api/returns${filter !== 'all' ? `?status=${filter}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setReturns(data.returns || []);
      } else {
        // Mock data for demonstration
        setReturns([
          {
            id: 'ret_001',
            orderNumber: 'ORD-2024-001',
            orderId: 'ord_123',
            customer: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            products: [
              { name: 'Product A', quantity: 1 }
            ],
            reason: 'Product damaged during shipping',
            status: 'PENDING',
            refundAmount: 2500,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId: string) => {
    if (!confirm('Are you sure you want to approve this return request?')) return;

    try {
      const response = await fetch(`/api/returns/${returnId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Return request approved successfully!');
        fetchReturns();
      } else {
        alert('Failed to approve return request');
      }
    } catch (error) {
      alert('Error approving return request');
    }
  };

  const handleReject = async (returnId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/returns/${returnId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Return request rejected');
        fetchReturns();
      } else {
        alert('Failed to reject return request');
      }
    } catch (error) {
      alert('Error rejecting return request');
    }
  };

  const handleRefund = async (returnId: string, amount: number) => {
    if (!confirm(`Process refund of රු ${amount.toFixed(2)}?`)) return;

    try {
      const response = await fetch(`/api/returns/${returnId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        alert('Refund processed successfully!');
        fetchReturns();
      } else {
        alert('Failed to process refund');
      }
    } catch (error) {
      alert('Error processing refund');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-400' },
      APPROVED: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-400' },
      REJECTED: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-400' },
      REFUNDED: { variant: 'default' as const, icon: DollarSign, color: 'text-blue-400' },
      COMPLETED: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const filteredReturns = returns.filter(ret => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ret.orderNumber.toLowerCase().includes(search) ||
        ret.customer.name.toLowerCase().includes(search) ||
        ret.customer.email.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'PENDING').length,
    approved: returns.filter(r => r.status === 'APPROVED').length,
    rejected: returns.filter(r => r.status === 'REJECTED').length,
    refunded: returns.filter(r => r.status === 'REFUNDED').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Returns Management</h1>
          <p className="text-gray-400 mt-2">
            Manage product returns and process refunds
          </p>
        </div>
        <Badge className="text-lg px-4 py-2">
          {stats.pending} Pending
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400 mt-1">Total Returns</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-sm text-gray-400 mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              <p className="text-sm text-gray-400 mt-1">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              <p className="text-sm text-gray-400 mt-1">Rejected</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.refunded}</p>
              <p className="text-sm text-gray-400 mt-1">Refunded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by order number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'PENDING' ? 'default' : 'outline'}
                onClick={() => setFilter('PENDING')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'APPROVED' ? 'default' : 'outline'}
                onClick={() => setFilter('APPROVED')}
              >
                Approved
              </Button>
              <Button
                variant={filter === 'REJECTED' ? 'default' : 'outline'}
                onClick={() => setFilter('REJECTED')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Return Requests
          </CardTitle>
          <CardDescription className="text-gray-400">
            Review and process customer return requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredReturns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Order</TableHead>
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Products</TableHead>
                    <TableHead className="text-gray-400">Reason</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnReq) => (
                    <TableRow key={returnReq.id} className="border-gray-700">
                      <TableCell className="text-white font-medium">
                        {returnReq.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{returnReq.customer.name}</p>
                          <p className="text-sm text-gray-400">{returnReq.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {returnReq.products.map((p, i) => (
                          <div key={i} className="text-sm">
                            {p.name} (x{p.quantity})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {returnReq.reason}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        රු {returnReq.refundAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(returnReq.status)}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(returnReq.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {returnReq.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(returnReq.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(returnReq.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {returnReq.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              onClick={() => handleRefund(returnReq.id, returnReq.refundAmount)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Process Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <RotateCcw className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No return requests found</p>
              <p className="text-sm mt-2">Return requests will appear here when customers initiate returns</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

