'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  ShoppingCart,
  User,
  Package,
  Banknote,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export default function NewOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    orderNumber: '',
    notes: '',
    shippingAddress: '',
    paymentMethod: 'COD' as 'COD' | 'ONLINE' | 'BANK_TRANSFER' | 'STRIPE' | 'PAYPAL' | 'PAYHERE',
    status: 'PENDING' as 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchCustomers();
    fetchProducts();
    generateOrderNumber();
  }, [session, status]);

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setOrderData(prev => ({ ...prev, orderNumber: `ORD-${timestamp}-${random}` }));
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Cannot add more items. Insufficient stock.');
        return;
      }
      setOrderItems(prev => prev.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      if (product.stock === 0) {
        toast.error('Product is out of stock.');
        return;
      }
      setOrderItems(prev => [...prev, {
        productId: product.id,
        product,
        quantity: 1,
        price: product.price,
        total: product.price
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      toast.error('Cannot add more items. Insufficient stock.');
      return;
    }

    setOrderItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderData.orderNumber,
          customerId: selectedCustomer.id,
          items: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: getTotalAmount(),
          notes: orderData.notes,
          shippingAddress: orderData.shippingAddress || selectedCustomer.address,
          paymentMethod: orderData.paymentMethod,
          status: orderData.status
        })
      });

      if (response.ok) {
        toast.success('Order created successfully!');
        router.push('/orders');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Order</h1>
          <p className="text-gray-600">Order #{orderData.orderNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer
            </h2>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customers.filter(customer => 
                  customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  customer.phone.includes(searchTerm)
                ).map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </div>
                ))}
              </div>

              {selectedCustomer && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-900">Selected Customer</div>
                  <div className="text-sm text-green-700">{selectedCustomer.name}</div>
                  <div className="text-sm text-green-600">{selectedCustomer.email}</div>
                  <div className="text-sm text-green-600">{selectedCustomer.phone}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Products
            </h2>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addProductToOrder(product)}
                    disabled={product.stock === 0}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Order
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      {orderItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Order Items
          </h2>

          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-gray-600">SKU: {item.product.sku}</div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(item.total)}</div>
                    <div className="text-sm text-gray-500">{formatCurrency(item.price)} each</div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">Total Amount:</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalAmount())}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Order Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Address
            </label>
            <textarea
              value={orderData.shippingAddress}
              onChange={(e) => setOrderData(prev => ({ ...prev, shippingAddress: e.target.value }))}
              placeholder={selectedCustomer?.address || "Enter shipping address..."}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={orderData.paymentMethod}
              onChange={(e) => setOrderData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="COD">Cash on Delivery</option>
              <option value="ONLINE">Online Payment</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="STRIPE">Stripe</option>
              <option value="PAYPAL">PayPal</option>
              <option value="PAYHERE">PayHere</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={orderData.status}
              onChange={(e) => setOrderData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={orderData.notes}
              onChange={(e) => setOrderData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Order notes..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateOrder}
          disabled={loading || !selectedCustomer || orderItems.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : 'Create Order'}
        </Button>
      </div>
    </div>
  );
}
