'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Calculator, 
  Package, 
  Settings,
  Download,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

export default function DocumentationPage() {
  const sections = [
    {
      title: 'Getting Started',
      description: 'Quick start guide for new users',
      icon: <BookOpen className="h-5 w-5" />,
      items: [
        { title: 'First Login', description: 'How to access your account', status: 'ready' },
        { title: 'Dashboard Overview', description: 'Understanding the main dashboard', status: 'ready' },
        { title: 'User Roles', description: 'Admin, Manager, and User permissions', status: 'ready' },
        { title: 'Basic Setup', description: 'Initial configuration steps', status: 'ready' }
      ]
    },
    {
      title: 'E-commerce Management',
      description: 'Managing your online store',
      icon: <ShoppingCart className="h-5 w-5" />,
      items: [
        { title: 'Product Management', description: 'Adding and managing products', status: 'ready' },
        { title: 'Order Processing', description: 'Handling customer orders', status: 'ready' },
        { title: 'Customer Management', description: 'Managing customer relationships', status: 'ready' },
        { title: 'Inventory Tracking', description: 'Stock management and alerts', status: 'ready' }
      ]
    },
    {
      title: 'Accounting System',
      description: 'Financial management and reporting',
      icon: <Calculator className="h-5 w-5" />,
      items: [
        { title: 'Chart of Accounts', description: 'Setting up your accounting structure', status: 'ready' },
        { title: 'Journal Entries', description: 'Recording financial transactions', status: 'ready' },
        { title: 'Financial Reports', description: 'P&L, Balance Sheet, Cash Flow', status: 'ready' },
        { title: 'Tax Management', description: 'Handling taxes and compliance', status: 'ready' }
      ]
    },
    {
      title: 'Procurement System',
      description: 'Supplier and purchase management',
      icon: <Package className="h-5 w-5" />,
      items: [
        { title: 'Supplier Management', description: 'Managing vendor relationships', status: 'ready' },
        { title: 'Purchase Orders', description: 'Creating and tracking orders', status: 'ready' },
        { title: 'Procurement Analytics', description: 'Data-driven purchasing insights', status: 'ready' },
        { title: 'Cost Tracking', description: 'Monitoring procurement costs', status: 'ready' }
      ]
    },
    {
      title: 'Analytics & Reporting',
      description: 'Business intelligence and insights',
      icon: <BarChart3 className="h-5 w-5" />,
      items: [
        { title: 'Sales Analytics', description: 'Understanding sales performance', status: 'ready' },
        { title: 'Customer Insights', description: 'Customer behavior analysis', status: 'ready' },
        { title: 'Inventory Reports', description: 'Stock and turnover analysis', status: 'ready' },
        { title: 'Financial Reports', description: 'Comprehensive financial analysis', status: 'ready' }
      ]
    },
    {
      title: 'System Administration',
      description: 'System settings and maintenance',
      icon: <Settings className="h-5 w-5" />,
      items: [
        { title: 'User Management', description: 'Managing team members', status: 'ready' },
        { title: 'System Settings', description: 'Configuring application settings', status: 'ready' },
        { title: 'Backup & Recovery', description: 'Data protection and restoration', status: 'ready' },
        { title: 'Monitoring', description: 'System health and performance', status: 'ready' }
      ]
    }
  ];

  const quickLinks = [
    {
      title: 'API Documentation',
      description: 'Complete API reference',
      href: '/api/health',
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      title: 'System Status',
      description: 'Current system health',
      href: '/monitoring',
      icon: <HelpCircle className="h-4 w-4" />
    },
    {
      title: 'Data Export',
      description: 'Download your data',
      href: '/api/backup/export',
      icon: <Download className="h-4 w-4" />
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case 'coming-soon':
        return <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>;
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800">Beta</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">SmartStore SaaS Documentation</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Complete guide to using your SmartStore SaaS platform. 
          Everything you need to know to manage your business effectively.
        </p>
        <div className="flex justify-center space-x-4">
          <Badge className="bg-blue-100 text-blue-800">Version 1.2.0</Badge>
          <Badge className="bg-green-100 text-green-800">100% Functional</Badge>
          <Badge className="bg-purple-100 text-purple-800">Production Ready</Badge>
        </div>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Quick Links</span>
          </CardTitle>
          <CardDescription>
            Essential resources and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={() => window.open(link.href, '_blank')}
              >
                <div className="flex items-center space-x-2">
                  {link.icon}
                  <span className="font-medium">{link.title}</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  {link.description}
                </p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {section.icon}
                <span>{section.title}</span>
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started Guide</CardTitle>
          <CardDescription>
            Step-by-step instructions for new users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Login to Your Account</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your credentials to access the dashboard. Demo credentials are available for testing.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Explore the Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Familiarize yourself with the main dashboard and navigation menu.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Set Up Your Business</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add products, configure settings, and customize your store.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Start Managing Operations</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Begin processing orders, managing customers, and tracking analytics.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Get support and assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">System Status</h4>
              <p className="text-sm text-muted-foreground">
                Check current system health and performance
              </p>
              <Button variant="outline" size="sm" onClick={() => window.open('/monitoring', '_blank')}>
                View Status
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Data Export</h4>
              <p className="text-sm text-muted-foreground">
                Download your data for backup or migration
              </p>
              <Button variant="outline" size="sm" onClick={() => window.open('/api/backup/export', '_blank')}>
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
