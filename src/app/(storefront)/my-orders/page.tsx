'use client';

import { useState, useEffect } from 'react';
import { Package, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: any[];
}

export default function PortalOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/customer-portal/orders');
      if (response.ok) {
        const result = await response.json();
        // successResponse returns { success: true, data: { orders: [...] } }
        const rawOrders = result.data?.orders || [];
        const formattedOrders = rawOrders.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: Number(o.total) || 0,
          status: o.status,
          createdAt: o.createdAt,
          items: o.orderItems || []
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching orders',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-purple-100 text-purple-800';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="loading-spinner w-8 h-8"></div></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-10 px-4 md:px-0">
      <div>
        <h1 className="text-4xl font-bold text-white flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Package className="w-8 h-8 text-primary" />
          </div>
          Order <span className="text-gradient">History</span>
        </h1>
        <p className="text-white/40 mt-2 ml-16">Track your premium shipments and past purchases.</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="glass-dark rounded-3xl border border-white/5 p-8 transition-all hover:border-white/10 group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">#{order.orderNumber}</h3>
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${getStatusColor(order.status).replace('bg-', 'bg-opacity-10 border-').replace('text-', 'text-')}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-white/30 font-mono">Placed on {formatDate(order.createdAt)} • Secure Payment</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-sm font-semibold transition-all active:scale-95 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  View Details
                </button>
                <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-white active:scale-95">
                  <Download className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-3 overflow-hidden">
                    {[1, 2].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full bg-white/5 border-2 border-[#0e0918] flex items-center justify-center">
                          <Package className="w-4 h-4 text-white/20" />
                       </div>
                    ))}
                 </div>
                 <p className="text-sm text-white/40">{order.items?.length || 0} Exclusive Premium Items</p>
              </div>
              <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(order.total)}</p>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="glass-dark rounded-3xl border border-white/5 p-20 text-center space-y-6">
          <div className="relative inline-block">
             <Package className="w-24 h-24 text-white/5 mx-auto" />
             <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full -z-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">No orders found</h2>
            <p className="text-white/40 max-w-sm mx-auto">You haven't placed any premium orders yet. Every journey starts with a single click.</p>
          </div>
          <button 
            onClick={() => router.push('/shop')}
            className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all glow active:scale-95"
          >
            Start Shopping Now
          </button>
        </div>
      )}
    </div>
  );
}

