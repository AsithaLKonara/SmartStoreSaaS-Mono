'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Users,
  Calendar,
  Settings
} from 'lucide-react';

interface PackagePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 'monthly',
    features: [''],
    isActive: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      
      // Fetch packages from API
      const response = await fetch('/api/admin/packages');
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setPackages(data.data || []);
        }
      } else {
        // Mock data for development
        setPackages([
          {
            id: '1',
            name: 'Starter Plan',
            description: 'Perfect for small businesses getting started',
            price: 29.99,
            duration: 'monthly',
            features: ['Up to 100 products', 'Basic analytics', 'Email support'],
            isActive: true,
            userCount: 45,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'Professional Plan',
            description: 'Advanced features for growing businesses',
            price: 99.99,
            duration: 'monthly',
            features: ['Unlimited products', 'Advanced analytics', 'Priority support', 'AI features'],
            isActive: true,
            userCount: 23,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-10'
          },
          {
            id: '3',
            name: 'Enterprise Plan',
            description: 'Complete solution for large enterprises',
            price: 299.99,
            duration: 'monthly',
            features: ['Everything in Professional', 'Custom integrations', 'Dedicated support', 'White-label options'],
            isActive: true,
            userCount: 8,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-05'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPackage),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          setNewPackage({
            name: '',
            description: '',
            price: 0,
            duration: 'monthly',
            features: [''],
            isActive: true
          });
          fetchPackages();
        }
      }
    } catch (error) {
      console.error('Error creating package:', error);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPackages();
      }
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalRevenue = packages.reduce((sum, pkg) => sum + (pkg.price * pkg.userCount), 0);
  const totalUsers = packages.reduce((sum, pkg) => sum + pkg.userCount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Package Management</h1>
          <p className="text-gray-600">Manage subscription packages and pricing plans</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">
              Active subscription plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Subscribed users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Recurring revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Packages</CardTitle>
          <CardDescription>Manage your subscription packages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{formatCurrency(pkg.price)}</span>
                      <span className="text-sm text-gray-500">/{pkg.duration}</span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{pkg.userCount} users</span>
                      <span>{new Date(pkg.updatedAt).toLocaleDateString()}</span>
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first package.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Package</CardTitle>
              <CardDescription>Add a new subscription package</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                  placeholder="Enter package name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                  placeholder="Enter package description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({...newPackage, price: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <select
                    id="duration"
                    value={newPackage.duration}
                    onChange={(e) => setNewPackage({...newPackage, duration: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  {newPackage.features.map((feature, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...newPackage.features];
                          newFeatures[index] = e.target.value;
                          setNewPackage({...newPackage, features: newFeatures});
                        }}
                        placeholder="Enter feature"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFeatures = newPackage.features.filter((_, i) => i !== index);
                          setNewPackage({...newPackage, features: newFeatures});
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPackage({...newPackage, features: [...newPackage.features, '']})}
                  >
                    Add Feature
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePackage}>
                  Create Package
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
