'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Settings, CheckCircle, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function WhatsAppIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Call real API to verify WhatsApp connection
      const response = await fetch('/api/integrations/whatsapp/verify');
      const data = await response.json();
      
      if (data.success && data.connected) {
        setIsConnected(true);
      } else {
        logger.error({
          message: 'WhatsApp connection failed',
          error: new Error(data.error || 'Connection failed'),
          context: { phoneNumber }
        });
        alert('Failed to connect WhatsApp. Please check your credentials.');
      }
    } catch (error) {
      logger.error({
        message: 'Failed to connect WhatsApp',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { phoneNumber }
      });
      alert('Failed to connect WhatsApp. Please check your configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setPhoneNumber('');
    setAccessToken('');
    setWebhookUrl('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Integration</h1>
          <p className="text-gray-600">Connect your WhatsApp Business account to send messages and receive notifications</p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Connected
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Disconnected
            </>
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Current WhatsApp Business account status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            {isConnected && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phone Number</span>
                  <span className="text-sm text-gray-600">{phoneNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Webhook URL</span>
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">{webhookUrl}</span>
                </div>
              </>
            )}

            <div className="pt-4">
              {!isConnected ? (
                <Button onClick={handleConnect} disabled={isLoading} className="w-full">
                  {isLoading ? "Connecting..." : "Connect WhatsApp"}
                </Button>
              ) : (
                <Button onClick={handleDisconnect} variant="outline" className="w-full">
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Configure your WhatsApp Business settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={isConnected}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-reply">Auto Reply</Label>
              <Switch id="auto-reply" />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Notifications</Label>
              <Switch id="notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Message Templates
          </CardTitle>
          <CardDescription>
            Manage your WhatsApp message templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No message templates configured</p>
            <p className="text-sm">Create templates to send structured messages to your customers</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>
            Latest WhatsApp messages and interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent messages</p>
            <p className="text-sm">Messages will appear here once you start using WhatsApp</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
