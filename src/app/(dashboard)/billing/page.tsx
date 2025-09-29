'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Download, 
  Calendar,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Receipt
} from 'lucide-react';

interface BillingInfo {
  currentPlan: {
    name: string;
    price: number;
    features: string[];
    status: string;
    nextBilling: string;
  };
  usage: {
    users: number;
    maxUsers: number;
    products: string;
    aiFeatures: string;
    support: string;
  };
  statistics: {
    totalOrders: number;
    totalRevenue: number;
    monthlyRecurring: number;
  };
  paymentMethods: any[];
  billingHistory: any[];
  settings: {
    autoRenew: boolean;
    invoiceEmail: string;
  };
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  downloadUrl: string;
}

export default function BillingPage() {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch billing dashboard data
      const response = await fetch('/api/billing/dashboard');
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setBillingInfo(data.data);
          
          // Mock invoices data
          setInvoices([
            {
              id: 'INV-001',
              date: '2024-01-15',
              amount: 99.99,
              status: 'paid',
              description: 'Professional Plan - January 2024',
              downloadUrl: '#'
            },
            {
              id: 'INV-002',
              date: '2023-12-15',
              amount: 99.99,
              status: 'paid',
              description: 'Professional Plan - December 2023',
              downloadUrl: '#'
            },
            {
              id: 'INV-003',
              date: '2023-11-15',
              amount: 99.99,
              status: 'paid',
              description: 'Professional Plan - November 2023',
              downloadUrl: '#'
            }
          ]);
        }
      } else {
        // Mock data for development
        setBillingInfo({
          currentPlan: {
            name: 'Professional Plan',
            price: 99.99,
            features: ['Unlimited Products', 'AI Analytics', 'Priority Support'],
            status: 'active',
            nextBilling: '2024-02-15'
          },
          usage: {
            users: 5,
            maxUsers: 100,
            products: 'Unlimited',
            aiFeatures: 'Full Access',
            support: 'Priority'
          },
          statistics: {
            totalOrders: 1250,
            totalRevenue: 156750.00,
            monthlyRecurring: 99.99
          },
          paymentMethods: [],
          billingHistory: [],
          settings: {
            autoRenew: true,
            invoiceEmail: 'admin@example.com'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load billing information</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
          <Button>
            <CreditCard className="h-4 w-4 mr-2" />
            Update Payment Method
          </Button>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{billingInfo.currentPlan.name}</CardTitle>
              <CardDescription>Current subscription plan</CardDescription>
            </div>
            <Badge variant={billingInfo.currentPlan.status === 'active' ? 'default' : 'secondary'}>
              {billingInfo.currentPlan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(billingInfo.currentPlan.price)}</div>
              <p className="text-sm text-gray-500">per month</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {billingInfo.currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Next billing:</h4>
              <p className="text-sm text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(billingInfo.currentPlan.nextBilling).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingInfo.statistics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingInfo.statistics.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Orders processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingInfo.statistics.monthlyRecurring)}</div>
            <p className="text-xs text-muted-foreground">
              MRR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment information</CardDescription>
              </CardHeader>
              <CardContent>
                {billingInfo.paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {billingInfo.paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                          <div>
                            <p className="font-medium">**** **** **** {method.last4}</p>
                            <p className="text-sm text-gray-500">{method.brand}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
                    <p className="text-gray-500 mb-4">Add a payment method to manage your subscription</p>
                    <Button>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common billing tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Download className="h-6 w-6 mb-2" />
                    Download Invoice
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <CreditCard className="h-6 w-6 mb-2" />
                    Update Payment
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Package className="h-6 w-6 mb-2" />
                    Change Plan
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your recent invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <p className="font-medium">{invoice.description}</p>
                        <p className="text-sm text-gray-500">Invoice #{invoice.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        <p className="text-sm text-gray-500">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>Current usage of your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Users</span>
                      <span className="text-sm text-gray-500">{billingInfo.usage.users}/{billingInfo.usage.maxUsers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(billingInfo.usage.users / billingInfo.usage.maxUsers) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Products</span>
                      <span className="text-sm text-gray-500">{billingInfo.usage.products}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">AI Features</span>
                    <Badge variant="default">{billingInfo.usage.aiFeatures}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Support Level</span>
                    <Badge variant="default">{billingInfo.usage.support}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Manage your billing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-renewal</h4>
                  <p className="text-sm text-gray-500">Automatically renew your subscription</p>
                </div>
                <Badge variant={billingInfo.settings.autoRenew ? "default" : "secondary"}>
                  {billingInfo.settings.autoRenew ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Invoice Email</h4>
                <p className="text-sm text-gray-600">{billingInfo.settings.invoiceEmail}</p>
                <Button size="sm" variant="outline" className="mt-2">
                  Change Email
                </Button>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
                <Button variant="destructive" size="sm">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
