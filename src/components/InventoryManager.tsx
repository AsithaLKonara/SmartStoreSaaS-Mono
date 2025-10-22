'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveTable } from '@/components/MobileTable';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { InventoryUtils } from '@/lib/inventory';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  location?: string;
  binLocation?: string;
  supplierId?: string;
  lastRestocked?: string;
  lastCounted?: string;
  status: 'active' | 'inactive' | 'discontinued';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  totalAlerts: number;
}

interface ReorderSuggestion {
  productId: string;
  item: InventoryItem;
  suggestedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch inventory error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/inventory/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data.statistics);
        setReorderSuggestions(data.data.reorderSuggestions);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('[InventoryManager] Fetch statistics error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch statistics');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setAdjusting(true);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustQuantity,
          reason: adjustReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Stock adjusted successfully');
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustQuantity(0);
        setAdjustReason('');
        await fetchInventory();
        await fetchStatistics();
      } else {
        throw new Error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('[InventoryManager] Adjust stock error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">
              {InventoryUtils.formatInventoryValue(statistics.totalValue)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock</h3>
            <p className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Out of Stock</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overstock</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.overstockCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.totalAlerts}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
            />
          </div>
          <div>
            <Label htmlFor="filter">Filter</Label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Items</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchInventory} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reorder Suggestions */}
      {reorderSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.productId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(suggestion.urgency)}`}>
                      {suggestion.urgency.toUpperCase()}
                    </span>
                    <span className="font-medium">{suggestion.item.name}</span>
                    <span className="text-sm text-gray-500">({suggestion.item.sku})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current: {suggestion.item.currentStock}</p>
                  <p className="font-semibold">Reorder: {suggestion.suggestedQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <ResponsiveTable
        data={items}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (value, item) => (
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{item.sku}</div>
                {item.location && (
                  <div className="text-xs text-gray-400">{item.location}</div>
                )}
              </div>
            )
          },
          {
            key: 'currentStock',
            label: 'Stock',
            render: (value, item) => (
              <div>
                <div className="font-semibold">{value}</div>
                <div className="text-sm text-gray-500">
                  Available: {item.availableStock}
                </div>
                {item.reservedStock > 0 && (
                  <div className="text-sm text-gray-500">
                    Reserved: {item.reservedStock}
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (value, item) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${InventoryUtils.getStockStatusColor(item)}`}>
                {InventoryUtils.getStockStatusLabel(item)}
              </span>
            )
          },
          {
            key: 'totalValue',
            label: 'Value',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          },
          {
            key: 'unitCost',
            label: 'Unit Cost',
            render: (value) => InventoryUtils.formatInventoryValue(value)
          }
        ]}
        actions={(item) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdjustModal(item)}
            >
              Adjust Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Navigate to item details
                window.location.href = `/inventory/${item.id}`;
              }}
            >
              View Details
            </Button>
          </>
        )}
        emptyMessage="No inventory items found."
      />

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adjust Stock - {selectedItem.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity Change</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter positive for increase, negative for decrease"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItem.currentStock}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || !adjustReason.trim()}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






