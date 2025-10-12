'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText,
  ExternalLink,
  Download
} from 'lucide-react';

export default function DocumentationPage() {
  const docCategories = [
    {
      title: 'API Documentation',
      description: 'Complete API reference with 243 endpoints',
      items: [
        { name: 'Authentication API', path: '/api/auth', status: 'complete' },
        { name: 'Products API', path: '/api/products', status: 'complete' },
        { name: 'Orders API', path: '/api/orders', status: 'complete' },
        { name: 'Payments API', path: '/api/payments', status: 'complete' },
        { name: 'Integrations API', path: '/api/integrations', status: 'complete' },
      ],
    },
    {
      title: 'User Guides',
      description: 'Step-by-step guides for all features',
      items: [
        { name: 'Getting Started', path: '/docs', status: 'complete' },
        { name: 'Product Management', path: '/docs/products', status: 'complete' },
        { name: 'Order Processing', path: '/docs/orders', status: 'complete' },
        { name: 'Customer Management', path: '/docs/customers', status: 'complete' },
        { name: 'Analytics & Reports', path: '/docs/analytics', status: 'complete' },
      ],
    },
    {
      title: 'Integration Guides',
      description: 'Third-party integration documentation',
      items: [
        { name: 'Stripe Setup', path: '/docs/stripe', status: 'complete' },
        { name: 'WhatsApp Integration', path: '/docs/whatsapp', status: 'complete' },
        { name: 'WooCommerce Sync', path: '/docs/woocommerce', status: 'complete' },
        { name: 'Shopify Integration', path: '/docs/shopify', status: 'complete' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documentation Hub</h1>
          <p className="text-muted-foreground">Complete documentation for SmartStore SaaS</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Platform Overview
          </CardTitle>
          <CardDescription>Complete e-commerce SaaS platform with 60+ features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">243</div>
              <div className="text-sm text-muted-foreground">API Endpoints</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">67</div>
              <div className="text-sm text-muted-foreground">Pages</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">11</div>
              <div className="text-sm text-muted-foreground">Integrations</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Categories */}
      <div className="grid gap-6">
        {docCategories.map(category => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle>{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.items.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.path}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50">
                        {item.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <span className="font-medium mb-1">API Health Check</span>
              <span className="text-xs text-muted-foreground">/api/health</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <span className="font-medium mb-1">System Status</span>
              <span className="text-xs text-muted-foreground">/api/monitoring/status</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <span className="font-medium mb-1">Integration Setup</span>
              <span className="text-xs text-muted-foreground">SETUP-INTEGRATIONS.md</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
