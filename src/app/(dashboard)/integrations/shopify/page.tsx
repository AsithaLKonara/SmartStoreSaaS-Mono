'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Store,
  Settings,
  RefreshCw,
  Key,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  Layers,
  TestTube,
  Clock
} from 'lucide-react';

interface ShopifyConfig {
  shopName: string;
  accessToken: string;
  apiVersion: string;
  syncSettings: {
    products: boolean;
    orders: boolean;
    customers: boolean;
    inventory: boolean;
    collections: boolean;
  };
  syncFrequency: string;
}

export default function ShopifyIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [config, setConfig] = useState<ShopifyConfig>({
    shopName: '',
    accessToken: '',
    apiVersion: '2024-01',
    syncSettings: {
      products: true,
      orders: true,
      customers: false,
      inventory: true,
      collections: true
    },
    syncFrequency: 'hourly'
  });
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadConfiguration = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/setup?type=shopify');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig({ ...config, ...data.config });
          setIsConnected(data.connected || false);
          setLastSync(data.lastSync || null);
        }
      }
    } catch (error) {
      // Error handled silently - user sees UI feedback
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/integrations/shopify/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: config.shopName,
          accessToken: config.accessToken,
          apiVersion: config.apiVersion
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ 
          success: true, 
          message: `Connected to ${data.shopName || 'Shopify store'}! Shop ID: ${data.shopId || 'N/A'}` 
        });
        setIsConnected(true);
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed. Please check your credentials.' });
        setIsConnected(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to connect. Please check your shop name and access token.' });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/integrations/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'shopify',
          config: config
        })
      });

      if (response.ok) {
        alert('Shopify configuration saved successfully!');
        await testConnection();
      } else {
        const data = await response.json();
        alert(`Failed to save configuration: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerSync = async (type: string) => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          config: config
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Sync initiated! Processing ${data.itemsQueued || 0} items.`);
        setLastSync(new Date().toISOString());
      } else {
        const data = await response.json();
        alert(`Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to initiate sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading && !config.shopName) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Shopify Integration</h1>
          <p className="text-gray-400 mt-2">
            Sync products, orders, and inventory with your Shopify store
          </p>
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
              Not Connected
            </>
          )}
        </Badge>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div className={`p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-500/10 border-green-500 text-green-400' 
            : 'bg-red-500/10 border-red-500 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-medium">{testResult.message}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="configuration" className="data-[state=active]:bg-gray-700">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="sync" className="data-[state=active]:bg-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Settings
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-gray-700">
            <Key className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Store Connection
              </CardTitle>
              <CardDescription className="text-gray-400">
                Connect to your Shopify store using Admin API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shop Name */}
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-white">
                  Shop Name
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="shopName"
                    type="text"
                    placeholder="your-store"
                    value={config.shopName}
                    onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <span className="text-gray-400 whitespace-nowrap">.myshopify.com</span>
                </div>
                <p className="text-xs text-gray-400">
                  Your Shopify store name (without .myshopify.com)
                </p>
              </div>

              {/* Access Token */}
              <div className="space-y-2">
                <Label htmlFor="accessToken" className="text-white">
                  Admin API Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="shpat_..."
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Generate from: Shopify Admin → Apps → Develop apps → Create an app
                </p>
              </div>

              {/* API Version */}
              <div className="space-y-2">
                <Label htmlFor="apiVersion" className="text-white">API Version</Label>
                <select
                  id="apiVersion"
                  value={config.apiVersion}
                  onChange={(e) => setConfig({ ...config, apiVersion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="2024-01">2024-01 (Latest)</option>
                  <option value="2023-10">2023-10</option>
                  <option value="2023-07">2023-07</option>
                </select>
              </div>

              {/* Full Shop URL Display */}
              {config.shopName && (
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <Label className="text-white text-sm">Full Shop URL:</Label>
                  <p className="text-blue-400 mt-1">{config.shopName}.myshopify.com</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={testConnection}
                  disabled={isLoading || !config.shopName || !config.accessToken}
                  className="flex-1"
                  variant="outline"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button 
                  onClick={saveConfiguration}
                  disabled={isSaving || !config.shopName || !config.accessToken}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">How to Get Admin API Access Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-400">
              <p>1. Login to your Shopify admin</p>
              <p>2. Go to: <span className="text-blue-400">Settings → Apps and sales channels</span></p>
              <p>3. Click &quot;Develop apps&quot; button</p>
              <p>4. Click &quot;Create an app&quot;</p>
              <p>5. Name: &quot;SmartStore Integration&quot;</p>
              <p>6. Click &quot;Configure Admin API scopes&quot;</p>
              <p>7. Select required permissions (see Permissions tab)</p>
              <p>8. Click &quot;Install app&quot;</p>
              <p>9. Reveal and copy the Admin API access token</p>
              <p>10. Paste the token above</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Settings Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Synchronization Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure what data to sync and how often
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sync Options */}
              <div className="space-y-3">
                {/* Products */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-400" />
                    <div>
                      <Label className="text-white font-medium">Sync Products</Label>
                      <p className="text-sm text-gray-400">Import products from Shopify</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.syncSettings.products}
                    onChange={(e) => setConfig({
                      ...config,
                      syncSettings: { ...config.syncSettings, products: e.target.checked }
                    })}
                  />
                </div>

                {/* Collections */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label className="text-white font-medium">Sync Collections</Label>
                      <p className="text-sm text-gray-400">Import product collections</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.syncSettings.collections}
                    onChange={(e) => setConfig({
                      ...config,
                      syncSettings: { ...config.syncSettings, collections: e.target.checked }
                    })}
                  />
                </div>

                {/* Orders */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-green-400" />
                    <div>
                      <Label className="text-white font-medium">Sync Orders</Label>
                      <p className="text-sm text-gray-400">Import orders from Shopify</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.syncSettings.orders}
                    onChange={(e) => setConfig({
                      ...config,
                      syncSettings: { ...config.syncSettings, orders: e.target.checked }
                    })}
                  />
                </div>

                {/* Customers */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-5 h-5 text-yellow-400" />
                    <div>
                      <Label className="text-white font-medium">Sync Customers</Label>
                      <p className="text-sm text-gray-400">Import customer data</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.syncSettings.customers}
                    onChange={(e) => setConfig({
                      ...config,
                      syncSettings: { ...config.syncSettings, customers: e.target.checked }
                    })}
                  />
                </div>

                {/* Inventory */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-orange-400" />
                    <div>
                      <Label className="text-white font-medium">Sync Inventory</Label>
                      <p className="text-sm text-gray-400">Keep stock levels synchronized</p>
                    </div>
                  </div>
                  <Switch
                    checked={config.syncSettings.inventory}
                    onChange={(e) => setConfig({
                      ...config,
                      syncSettings: { ...config.syncSettings, inventory: e.target.checked }
                    })}
                  />
                </div>
              </div>

              {/* Sync Frequency */}
              <div className="space-y-2">
                <Label htmlFor="syncFrequency" className="text-white">Sync Frequency</Label>
                <select
                  id="syncFrequency"
                  value={config.syncFrequency}
                  onChange={(e) => setConfig({ ...config, syncFrequency: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="realtime">Real-time (Webhook-based)</option>
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Once Daily</option>
                  <option value="manual">Manual Only</option>
                </select>
              </div>

              {/* Last Sync Info */}
              {lastSync && (
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">
                    Last synced: <span className="text-white">{new Date(lastSync).toLocaleString()}</span>
                  </p>
                </div>
              )}

              {/* Manual Sync Buttons */}
              {isConnected && (
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button 
                    onClick={() => triggerSync('products')}
                    disabled={isSyncing || !config.syncSettings.products}
                    variant="outline"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Sync Products
                  </Button>
                  
                  <Button 
                    onClick={() => triggerSync('orders')}
                    disabled={isSyncing || !config.syncSettings.orders}
                    variant="outline"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Sync Orders
                  </Button>
                  
                  <Button 
                    onClick={() => triggerSync('customers')}
                    disabled={isSyncing || !config.syncSettings.customers}
                    variant="outline"
                  >
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Sync Customers
                  </Button>
                  
                  <Button 
                    onClick={() => triggerSync('all')}
                    disabled={isSyncing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {isSyncing ? 'Syncing...' : 'Sync All'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Required API Scopes
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your Shopify app needs these permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">read_products, write_products</span>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">read_orders, write_orders</span>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">read_customers, write_customers</span>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">read_inventory, write_inventory</span>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">read_product_listings</span>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">read_fulfillments, write_fulfillments</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a 
            href={config.shopName ? `https://${config.shopName}.myshopify.com/admin/settings/apps` : 'https://shopify.com'} 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Manage Apps in Shopify Admin
          </a>
          <a 
            href="https://shopify.dev/docs/api/admin-rest" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Shopify Admin API Documentation
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

