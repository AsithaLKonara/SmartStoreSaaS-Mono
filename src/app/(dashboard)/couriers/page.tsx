'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  User,
  Package,
  Calendar,
  Star,
  Navigation,
  Users,
  UserPlus,
  RefreshCw,
  UserCheck,
  Loader2,
  ArrowLeft,
  Printer,
  TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';


interface Courier {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  isOnline: boolean;
  rating?: number;
  totalDeliveries?: number;
}

interface Delivery {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: 'PENDING' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'RETURNED';
  estimatedDeliveryTime: Date;
  trackingNumber: string;
  courierId?: string;
  courierName?: string;
  notes?: string;
  createdAt: Date;
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliverySearchTerm, setDeliverySearchTerm] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>('all');
  const [showAddCourier, setShowAddCourier] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [updatingDelivery, setUpdatingDelivery] = useState<Delivery | null>(null);
  const [courierForm, setCourierForm] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [deliveryStatusForm, setDeliveryStatusForm] = useState({
    status: 'PENDING' as 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'DISPATCHED' | 'RETURNED',
    notes: ''
  });

  useEffect(() => {
    loadCouriers();
    loadDeliveries();
  }, []);

  const loadCouriers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/couriers');
      if (!response.ok) throw new Error('Failed to fetch couriers');
      
      const data = await response.json();
      setCouriers(data.data || []);
    } catch (error) {
      toast.error('Failed to load couriers');
      // Fallback to empty array if API not ready
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      // Mock data - replace with actual API call
      const mockDeliveries: Delivery[] = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'Alice Johnson',
          customerPhone: '+94771234569',
          address: '123 Main St, Colombo 03',
          status: 'PENDING',
          estimatedDeliveryTime: new Date(Date.now() + 3600000),
          trackingNumber: 'TRK-001',
          notes: 'Fragile items',
          createdAt: new Date()
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerName: 'Bob Smith',
          customerPhone: '+94771234570',
          address: '456 Oak Ave, Kandy',
          status: 'PROCESSING',
          estimatedDeliveryTime: new Date(Date.now() + 7200000),
          trackingNumber: 'TRK-002',
          courierId: '1',
          courierName: 'John Silva',
          createdAt: new Date()
        }
      ];
      setDeliveries(mockDeliveries);
    } catch (error) {
      toast.error('Failed to load deliveries');
    }
  };

  const handleRefresh = () => {
    loadCouriers();
    loadDeliveries();
  };

  const handleViewCourier = (courier: Courier) => {
    setSelectedCourier(courier);
  };

  const handleEditCourier = (courier: Courier) => {
    setEditingCourier(courier);
    setCourierForm({
      name: courier.name,
      phone: courier.phone,
      email: courier.email,
      status: courier.status
    });
    setShowAddCourier(true);
  };

  const handleDeleteCourier = async (courierId: string) => {
    if (confirm('Are you sure you want to delete this courier?')) {
      try {
        // API call to delete courier
        setCouriers(couriers.filter(c => c.id !== courierId));
      } catch (error) {
        console.error('Error deleting courier:', error);
      }
    }
  };

  const handleSubmitCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourier) {
        // Update existing courier
        setCouriers(couriers.map(c => 
          c.id === editingCourier.id 
            ? { ...c, ...courierForm }
            : c
        ));
      } else {
        // Add new courier
        const newCourier: Courier = {
          id: Date.now().toString(),
          ...courierForm,
          isOnline: false,
          rating: 0,
          totalDeliveries: 0
        };
        setCouriers([...couriers, newCourier]);
      }
      
      setShowAddCourier(false);
      setEditingCourier(null);
      setCourierForm({ name: '', phone: '', email: '', status: 'ACTIVE' });
    } catch (error) {
      console.error('Error saving courier:', error);
    }
  };

  const handleViewDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
  };

  const handlePrintLabel = (delivery: Delivery) => {
    // Print label functionality
    console.log('Printing label for delivery:', delivery);
  };

  const handleUpdateDeliveryStatus = (delivery: Delivery) => {
    setUpdatingDelivery(delivery);
    setDeliveryStatusForm({
      status: delivery.status,
      notes: delivery.notes || ''
    });
  };

  const handleUpdateDeliveryStatusSubmit = async () => {
    if (!updatingDelivery) return;
    
    try {
      setDeliveries(deliveries.map(d => 
        d.id === updatingDelivery.id 
          ? { ...d, ...deliveryStatusForm }
          : d
      ));
      setUpdatingDelivery(null);
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const filteredCouriers = couriers.filter(courier => {
    const matchesSearch = courier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courier.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || courier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.orderNumber.toLowerCase().includes(deliverySearchTerm.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(deliverySearchTerm.toLowerCase());
    const matchesStatus = deliveryStatusFilter === 'all' || delivery.status === deliveryStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    const totalCouriers = couriers.length;
    const activeCouriers = couriers.filter(c => c.status === 'ACTIVE').length;
    const onlineCouriers = couriers.filter(c => c.isOnline).length;
    const totalDeliveries = deliveries.length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;
    const processingDeliveries = deliveries.filter(d => d.status === 'PROCESSING').length;
    const dispatchedDeliveries = deliveries.filter(d => d.status === 'DISPATCHED').length;
    const deliveredDeliveries = deliveries.filter(d => d.status === 'DELIVERED').length;
    const returnedDeliveries = deliveries.filter(d => d.status === 'RETURNED').length;

    return {
      totalCouriers,
      activeCouriers,
      onlineCouriers,
      totalDeliveries,
      pendingDeliveries,
      processingDeliveries,
      dispatchedDeliveries,
      deliveredDeliveries,
      returnedDeliveries
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courier Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage couriers and track deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddCourier(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Courier
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Couriers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCouriers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Couriers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCouriers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online Couriers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onlineCouriers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Couriers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Couriers</CardTitle>
          <CardDescription>Manage your courier team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search couriers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Couriers List */}
            <div className="space-y-3">
              {filteredCouriers.map((courier) => (
                <div key={courier.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        {courier.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{courier.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{courier.phone}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={courier.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {courier.status}
                          </Badge>
                          {courier.isOnline && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCourier(courier)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCourier(courier)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCourier(courier.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCouriers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No couriers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Courier Modal */}
      {showAddCourier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingCourier ? 'Edit Courier' : 'Add New Courier'}
            </h2>
            <form onSubmit={handleSubmitCourier}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={courierForm.name}
                    onChange={(e) => setCourierForm({...courierForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={courierForm.phone}
                    onChange={(e) => setCourierForm({...courierForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={courierForm.email}
                    onChange={(e) => setCourierForm({...courierForm, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={courierForm.status} onValueChange={(value) => setCourierForm({...courierForm, status: value as 'ACTIVE' | 'INACTIVE'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddCourier(false);
                  setEditingCourier(null);
                  setCourierForm({name: '', phone: '', email: '', status: 'ACTIVE'});
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingCourier ? 'Update' : 'Add'} Courier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Courier Modal */}
      {selectedCourier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Courier Details</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  {selectedCourier.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCourier.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedCourier.phone}</p>
                  <p className="text-gray-600 dark:text-gray-400">{selectedCourier.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedCourier.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {selectedCourier.status}
                  </Badge>
                </div>
                <div>
                  <Label>Online Status</Label>
                  <Badge variant={selectedCourier.isOnline ? 'default' : 'secondary'}>
                    {selectedCourier.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div>
                  <Label>Rating</Label>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span>{selectedCourier.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <Label>Total Deliveries</Label>
                  <p className="text-lg font-semibold">{selectedCourier.totalDeliveries || 0}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setSelectedCourier(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setSelectedCourier(null);
                  handleEditCourier(selectedCourier);
                }} className="bg-blue-600 hover:bg-blue-700">
                  Edit Courier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}