'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Webhook, Plus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const sampleWebhooks = [
    {
      id: '1',
      name: 'Stripe Webhook',
      url: 'https://smartstore-demo.vercel.app/api/webhooks/stripe',
      events: ['payment.succeeded', 'payment.failed'],
      status: 'active',
      lastTriggered: '2 minutes ago',
    },
    {
      id: '2',
      name: 'WooCommerce Webhook',
      url: 'https://smartstore-demo.vercel.app/api/webhooks/woocommerce/org123',
      events: ['order.created', 'order.updated'],
      status: 'active',
      lastTriggered: '1 hour ago',
    },
    {
      id: '3',
      name: 'WhatsApp Webhook',
      url: 'https://smartstore-demo.vercel.app/api/webhooks/whatsapp',
      events: ['message.received', 'message.delivered'],
      status: 'active',
      lastTriggered: '5 minutes ago',
    },
  ];

  useEffect(() => {
    setWebhooks(sampleWebhooks);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground">Manage your webhook endpoints and monitor events</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Webhook</CardTitle>
            <CardDescription>Add a new webhook endpoint to receive events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Webhook Name</Label>
              <Input placeholder="My Webhook" />
            </div>
            <div>
              <Label>Endpoint URL</Label>
              <Input placeholder="https://your-domain.com/webhook" />
            </div>
            <div>
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['order.created', 'order.updated', 'payment.succeeded', 'product.created'].map(event => (
                  <label key={event} className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button>Create Webhook</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {webhooks.map(webhook => (
          <Card key={webhook.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Webhook className="h-5 w-5" />
                  <div>
                    <CardTitle>{webhook.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{webhook.url}</CardDescription>
                  </div>
                </div>
                <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                  {webhook.status === 'active' ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Events:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {webhook.events.map((event: string) => (
                      <Badge key={event} variant="outline">{event}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last triggered: {webhook.lastTriggered}
                  </span>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
