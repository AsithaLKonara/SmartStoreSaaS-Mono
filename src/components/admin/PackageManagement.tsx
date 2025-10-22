'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';

interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  trialDays: number;
  maxUsers: number;
  maxProducts: number;
  maxOrders: number;
  features: string[];
  isActive: boolean;
  subscribers: number;
}

export function PackageManagement() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      // Simulate API call
      const mockPackages: PackageData[] = [
        {
          id: '1',
          name: 'Starter',
          description: 'Perfect for small businesses just getting started',
          price: 2999,
          billingCycle: 'monthly',
          trialDays: 14,
          maxUsers: 2,
          maxProducts: 100,
          maxOrders: 500,
          features: ['Basic Orders', 'Analytics'],
          isActive: true,
          subscribers: 15,
        },
        {
          id: '2',
          name: 'Professional',
          description: 'Ideal for growing businesses with advanced needs',
          price: 9999,
          billingCycle: 'monthly',
          trialDays: 14,
          maxUsers: 10,
          maxProducts: 1000,
          maxOrders: 5000,
          features: ['Advanced Orders', 'Inventory Management', 'Courier Integration', 'Analytics', 'WhatsApp Integration'],
          isActive: true,
          subscribers: 8,
        },
        {
          id: '3',
          name: 'Enterprise',
          description: 'Complete solution for large businesses',
          price: 29999,
          billingCycle: 'monthly',
          trialDays: 14,
          maxUsers: 100,
          maxProducts: 10000,
          maxOrders: 50000,
          features: ['All Features', 'White-label', 'API Access', 'Custom Integrations'],
          isActive: true,
          subscribers: 3,
        },
      ];
      setPackages(mockPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Package Management</h2>
          <p className="text-gray-600">Create and manage subscription packages</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">
              {packages.filter(p => p.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.reduce((sum, pkg) => sum + pkg.subscribers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all packages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {packages.reduce((sum, pkg) => sum + (pkg.price * pkg.subscribers), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Recurring monthly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {Math.round(packages.reduce((sum, pkg) => sum + pkg.price, 0) / packages.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per package
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </div>
                {pkg.isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">
                    <XCircle className="w-3 h-3 mr-1" />Inactive
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">LKR {pkg.price.toLocaleString()}</div>
                <div className="text-sm text-gray-500">per {pkg.billingCycle}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Max Users:</span>
                  <span className="font-medium">{pkg.maxUsers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Products:</span>
                  <span className="font-medium">{pkg.maxProducts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Orders:</span>
                  <span className="font-medium">{pkg.maxOrders.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Trial Days:</span>
                  <span className="font-medium">{pkg.trialDays}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subscribers:</span>
                  <span className="font-medium">{pkg.subscribers}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {pkg.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


