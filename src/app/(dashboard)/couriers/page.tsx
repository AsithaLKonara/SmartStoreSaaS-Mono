'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface CourierService {
  id: string;
  name: string;
  type: string;
  price: number;
  estimatedDays: number;
  coverage: string[];
  isActive: boolean;
  description: string;
}

interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  status: string;
  courierService: string;
  trackingNumber: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  createdAt: string;
}

export default function CouriersPage() {
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    type: 'standard',
    price: 0,
    estimatedDays: 1,
    coverage: [''],
    description: ''
  });

  useEffect(() => {
    fetchCourierData();
  }, []);

  const fetchCourierData = async () => {
    try {
      setLoading(true);
      
      // Fetch courier services
      const servicesResponse = await fetch('/api/courier/services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        if (servicesData.success) {
          setCourierServices(servicesData.data || []);
        }
      } else {
        // Mock data for development
        setCourierServices([
          {
            id: '1',
            name: 'Standard Delivery',
            type: 'standard',
            price: 5.99,
            estimatedDays: 3,
            coverage: ['Colombo', 'Gampaha', 'Kalutara'],
            isActive: true,
            description: 'Standard delivery within 3 business days'
          },
          {
            id: '2',
            name: 'Express Delivery',
            type: 'express',
            price: 12.99,
            estimatedDays: 1,
            coverage: ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle'],
            isActive: true,
            description: 'Express delivery within 1 business day'
          },
          {
            id: '3',
            name: 'Same Day Delivery',
            type: 'same-day',
            price: 19.99,
            estimatedDays: 0,
            coverage: ['Colombo'],
            isActive: true,
            description: 'Same day delivery within Colombo'
          }
        ]);
      }

      // Fetch deliveries
      const deliveriesResponse = await fetch('/api/courier/deliveries');
      if (deliveriesResponse.ok) {
        const deliveriesData = await deliveriesResponse.json();
        if (deliveriesData.success) {
          setDeliveries(deliveriesData.data || []);
        }
      } else {
        // Mock data for development
        setDeliveries([
          {
            id: '1',
            orderId: 'ORD-001',
            customerName: 'John Doe',
            address: '123 Main St, Colombo 03',
            status: 'delivered',
            courierService: 'Standard Delivery',
            trackingNumber: 'TRK-001',
            estimatedDelivery: '2024-01-18',
            actualDelivery: '2024-01-17',
            createdAt: '2024-01-15'
          },
          {
            id: '2',
            orderId: 'ORD-002',
            customerName: 'Jane Smith',
            address: '456 Park Ave, Gampaha',
            status: 'in-transit',
            courierService: 'Express Delivery',
            trackingNumber: 'TRK-002',
            estimatedDelivery: '2024-01-19',
            createdAt: '2024-01-18'
          },
          {
            id: '3',
            orderId: 'ORD-003',
            customerName: 'Bob Johnson',
            address: '789 Oak St, Kandy',
            status: 'pending',
            courierService: 'Standard Delivery',
            trackingNumber: 'TRK-003',
            estimatedDelivery: '2024-01-21',
            createdAt: '2024-01-18'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching courier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    try {
      const response = await fetch('/api/courier/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewService({
          name: '',
          type: 'standard',
          price: 0,
          estimatedDays: 1,
          coverage: [''],
          description: ''
        });
        fetchCourierData();
      }
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in-transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'in-transit': return <Truck className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deliveryStats = {
    total: deliveries.length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    inTransit: deliveries.filter(d => d.status === 'in-transit').length,
    pending: deliveries.filter(d => d.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courier Management</h1>
          <p className="text-gray-600">Manage delivery services and track shipments</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchCourierData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveryStats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{deliveryStats.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              Currently shipping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{deliveryStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting pickup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="deliveries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Management</CardTitle>
              <CardDescription>Track and manage all deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search deliveries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{delivery.customerName}</p>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusIcon(delivery.status)}
                            <span className="ml-1 capitalize">{delivery.status.replace('-', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">Order: {delivery.orderId}</p>
                        <p className="text-sm text-gray-500">Tracking: {delivery.trackingNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{delivery.courierService}</p>
                        <p className="text-sm text-gray-500">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {delivery.address}
                        </p>
                        <p className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Est: {delivery.estimatedDelivery}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDeliveries.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' : 'No deliveries have been created yet.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Courier Services</CardTitle>
              <CardDescription>Manage available delivery services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courierServices.map((service) => (
                  <Card key={service.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">{formatCurrency(service.price)}</span>
                          <span className="text-sm text-gray-500">
                            {service.estimatedDays === 0 ? 'Same day' : `${service.estimatedDays} day${service.estimatedDays > 1 ? 's' : ''}`}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Coverage Areas:</h4>
                          <div className="flex flex-wrap gap-1">
                            {service.coverage.map((area, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {courierServices.length === 0 && (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courier services</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first courier service.</p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Package Tracking</CardTitle>
              <CardDescription>Track individual packages and shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder="Enter tracking number..."
                    className="flex-1"
                  />
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Track
                  </Button>
                </div>

                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Enter tracking number</h3>
                  <p className="text-gray-500">Enter a tracking number above to view package status and delivery timeline.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Courier Service</CardTitle>
              <CardDescription>Create a new delivery service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Name</label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                    placeholder="e.g., Standard Delivery"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Service Type</label>
                  <select
                    value={newService.type}
                    onChange={(e) => setNewService({...newService, type: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="same-day">Same Day</option>
                    <option value="overnight">Overnight</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Estimated Days</label>
                  <Input
                    type="number"
                    value={newService.estimatedDays}
                    onChange={(e) => setNewService({...newService, estimatedDays: parseInt(e.target.value)})}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Coverage Areas</label>
                <div className="space-y-2">
                  {newService.coverage.map((area, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={area}
                        onChange={(e) => {
                          const newCoverage = [...newService.coverage];
                          newCoverage[index] = e.target.value;
                          setNewService({...newService, coverage: newCoverage});
                        }}
                        placeholder="Enter coverage area"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newCoverage = newService.coverage.filter((_, i) => i !== index);
                          setNewService({...newService, coverage: newCoverage});
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewService({...newService, coverage: [...newService.coverage, '']})}
                  >
                    Add Area
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="Service description"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateService}>
                  Create Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
