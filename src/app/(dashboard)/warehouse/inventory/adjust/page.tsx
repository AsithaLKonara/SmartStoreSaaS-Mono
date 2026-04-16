'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Package, 
  Warehouse, 
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export default function InventoryAdjustmentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: 0,
    type: 'adjustment' as const,
    reason: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, wareRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses')
      ]);
      
      const prodData = await prodRes.json();
      const wareData = await wareRes.json();
      
      if (prodData.success) setProducts(prodData.data || []);
      if (wareData.success) setWarehouses(wareData.data?.warehouses || wareData.data || []);
    } catch (error) {
      toast.error('Failed to load products or warehouses');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.warehouseId || formData.quantity === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/warehouses/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...formData,
           type: formData.quantity > 0 ? 'in' : 'out',
           quantity: Math.abs(formData.quantity)
        })
      });

      if (res.ok) {
        toast.success('Inventory adjusted successfully');
        router.push('/warehouse');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to adjust inventory');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Warehouse
      </Button>

      <div className="max-w-2xl mx-auto">
        <div className="glass-dark rounded-xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Adjust Inventory</h1>
              <p className="text-slate-400">Manual stock adjustment for discrepancies</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Product</Label>
              <select 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-slate-200"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              >
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse Location</Label>
              <select 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-slate-200"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              >
                <option value="">Select a warehouse</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Quantity Change</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="pl-10"
                    placeholder="e.g. 10 or -5"
                  />
                  {formData.quantity >= 0 ? (
                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  ) : (
                    <Minus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Positive for additions, negative for reductions</p>
              </div>

              <div className="space-y-2">
                <Label>Reason / Category</Label>
                <select 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-slate-200"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                >
                  <option value="">Select reason</option>
                  <option value="restock">Manual Restock</option>
                  <option value="damage">Damaged Goods</option>
                  <option value="return">Customer Return</option>
                  <option value="correction">Inventory Correction</option>
                  <option value="audit">Stock Audit</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                This action will permanently update the inventory stock levels and log a movement record for audit purposes.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Adjustment'}
              <Save className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
