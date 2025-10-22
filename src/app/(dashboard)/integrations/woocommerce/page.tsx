'use client';

import { useState, useEffect } from 'react';
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
  ShoppingBag,
  Settings,
  RefreshCw,
  Webhook,
  Package,
  ShoppingCart,
  Users as UsersIcon,
  Box,
  TestTube,
  Clock
} from 'lucide-react';

interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  apiVersion: string;
  syncSettings: {
    products: boolean;
    orders: boolean;
    customers: boolean;
    inventory: boolean;
  };
  syncFrequency: string;
}

interface SyncHistory {
  id: string;
  type: string;
  status: string;
  itemsProcessed: number;
  timestamp: string;
}

export default function WooCommerceIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [config, setConfig] = useState<WooCommerceConfig>({
    siteUrl: '',
    consumerKey: '',
    consumerSecret: '',
    apiVersion: 'wc/v3',
    syncSettings: {
      products: true,
      orders: true,
      customers: false,
      inventory: true
    },
    syncFrequency: 'hourly'
  });
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
    loadSyncHistory();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/setup?type=woocommerce');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig({ ...config, ...data.config });
          setIsConnected(data.connected || false);
          setLastSync(data.lastSync || null);
        }
      }
    } catch (error) {
      // Error loading WooCommerce configuration - could implement proper error handling
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const response = await fetch('/api/integrations/woocommerce/sync/history');
      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data.history || []);
      }
    } catch (error) {
      // Error loading sync history - could implement proper error handling
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/integrations/woocommerce/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: config.siteUrl,
          consumerKey: config.consumerKey,
          consumerSecret: config.consumerSecret,
          apiVersion: config.apiVersion
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ 
          success: true, 
          message: `Connected to ${data.storeName || 'WooCommerce store'}! Version: ${data.version || 'N/A'}` 
        });
        setIsConnected(true);
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed. Please check your credentials.' });
        setIsConnected(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to connect. Please check your store URL and credentials.' });
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
          type: 'woocommerce',
          config: config
        })
      });

      if (response.ok) {
        alert('WooCommerce configuration saved successfully!');
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
      
      const response = await fetch('/api/integrations/woocommerce/sync', {
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
        await loadSyncHistory();
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

  if (isLoading && !config.siteUrl) {
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
          <h1 className="text-3xl font-bold text-white">WooCommerce Integration</h1>
          <p className="text-gray-400 mt-2">
            Sync products, orders, and inventory with your WooCommerce store
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
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
            <Clock className="w-4 h-4 mr-2" />
            Sync History
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
                Enter your WooCommerce store details and API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Store URL */}
              <div className="space-y-2">
                <Label htmlFor="siteUrl" className="text-white">
                  Store URL
                </Label>
                <Input
                  id="siteUrl"
                  type="url"
                  placeholder="https://your-store.com"
                  value={config.siteUrl}
                  onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Your WooCommerce store&apos;s main URL (with https://)
                </p>
              </div>

              {/* Consumer Key */}
              <div className="space-y-2">
                <Label htmlFor="consumerKey" className="text-white">
                  Consumer Key
                </Label>
                <Input
                  id="consumerKey"
                  type="text"
                  placeholder="ck_..."
                  value={config.consumerKey}
                  onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Generate from: WooCommerce → Settings → Advanced → REST API
                </p>
              </div>

              {/* Consumer Secret */}
              <div className="space-y-2">
                <Label htmlFor="consumerSecret" className="text-white">
                  Consumer Secret
                </Label>
                <Input
                  id="consumerSecret"
                  type="password"
                  placeholder="cs_..."
                  value={config.consumerSecret}
                  onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Keep this secret! Never share publicly
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
                  <option value="wc/v3">WooCommerce REST API v3 (Recommended)</option>
                  <option value="wc/v2">WooCommerce REST API v2</option>
                  <option value="wc/v1">WooCommerce REST API v1</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={testConnection}
                  disabled={isLoading || !config.siteUrl || !config.consumerKey || !config.consumerSecret}
                  className="flex-1"
                  variant="outline"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button 
                  onClick={saveConfiguration}
                  disabled={isSaving || !config.siteUrl || !config.consumerKey || !config.consumerSecret}
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
              <CardTitle className="text-white">How to Get API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-400">
              <p>1. Login to your WooCommerce admin dashboard</p>
              <p>2. Go to: <span className="text-blue-400">WooCommerce → Settings → Advanced → REST API</span></p>
              <p>3. Click &quot;Add key&quot;</p>
              <p>4. Description: &quot;SmartStore Integration&quot;</p>
              <p>5. User: Select an admin user</p>
              <p>6. Permissions: Select &quot;Read/Write&quot;</p>
              <p>7. Click &quot;Generate API key&quot;</p>
              <p>8. Copy the Consumer Key and Consumer Secret</p>
              <p>9. Paste them above</p>
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
                      <p className="text-sm text-gray-400">Import products from WooCommerce</p>
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

                {/* Orders */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-green-400" />
                    <div>
                      <Label className="text-white font-medium">Sync Orders</Label>
                      <p className="text-sm text-gray-400">Import orders from WooCommerce</p>
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
                    <UsersIcon className="w-5 h-5 text-purple-400" />
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
                    <Box className="w-5 h-5 text-orange-400" />
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

        {/* Sync History Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Sync Operations
              </CardTitle>
              <CardDescription className="text-gray-400">
                History of synchronization attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncHistory.length > 0 ? (
                <div className="space-y-2">
                  {syncHistory.map((sync) => (
                    <div key={sync.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium capitalize">{sync.type} Sync</p>
                        <p className="text-sm text-gray-400">
                          {sync.itemsProcessed} items • {new Date(sync.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={sync.status === 'completed' ? 'default' : 'secondary'}>
                        {sync.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sync history available</p>
                  <p className="text-sm">Sync operations will appear here</p>
                </div>
              )}
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
            href={config.siteUrl ? `${config.siteUrl}/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys` : '#'} 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Generate API Keys in WooCommerce
          </a>
          <a 
            href="https://woocommerce.github.io/woocommerce-rest-api-docs/" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → WooCommerce REST API Documentation
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

