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
  CreditCard,
  Settings,
  Webhook,
  DollarSign,
  Copy,
  TestTube
} from 'lucide-react';

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
  currency: string;
  statementDescriptor: string;
  paymentMethods: {
    cards: boolean;
    applePay: boolean;
    googlePay: boolean;
    ach: boolean;
  };
}

export default function StripeIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<StripeConfig>({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    testMode: true,
    currency: 'USD',
    statementDescriptor: 'SmartStore',
    paymentMethods: {
      cards: true,
      applePay: false,
      googlePay: false,
      ach: false
    }
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
    setWebhookUrl(`${window.location.origin}/api/webhooks/stripe`);
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/setup?type=stripe');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
          setIsConnected(data.connected || false);
        }
      }
    } catch (error) {
      // Error loading Stripe configuration - could implement proper error handling
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/payments/stripe/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishableKey: config.publishableKey,
          secretKey: config.secretKey,
          testMode: config.testMode
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ success: true, message: 'Connection successful! Stripe is configured correctly.' });
        setIsConnected(true);
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed. Please check your credentials.' });
        setIsConnected(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection. Please try again.' });
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
          type: 'stripe',
          config: config
        })
      });

      if (response.ok) {
        alert('Stripe configuration saved successfully!');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (isLoading && !config.publishableKey) {
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
          <h1 className="text-3xl font-bold text-white">Stripe Integration</h1>
          <p className="text-gray-400 mt-2">
            Configure Stripe payment gateway for credit card processing
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
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-gray-700">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="data-[state=active]:bg-gray-700">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment Methods
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                API Credentials
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your Stripe API keys from the Stripe Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Test Mode</Label>
                  <p className="text-sm text-gray-400">Use test API keys for development</p>
                </div>
                <Switch
                  checked={config.testMode}
                  onChange={(e) => setConfig({ ...config, testMode: e.target.checked })}
                />
              </div>

              {/* Publishable Key */}
              <div className="space-y-2">
                <Label htmlFor="publishableKey" className="text-white">
                  Publishable Key {config.testMode && '(Test)'}
                </Label>
                <Input
                  id="publishableKey"
                  type="text"
                  placeholder={config.testMode ? "pk_test_..." : "pk_live_..."}
                  value={config.publishableKey}
                  onChange={(e) => setConfig({ ...config, publishableKey: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Find this in: Stripe Dashboard → Developers → API keys
                </p>
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-white">
                  Secret Key {config.testMode && '(Test)'}
                </Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder={config.testMode ? "sk_test_..." : "sk_live_..."}
                  value={config.secretKey}
                  onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Keep this secret! Never share or commit to version control
                </p>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-white">Default Currency</Label>
                <select
                  id="currency"
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>

              {/* Statement Descriptor */}
              <div className="space-y-2">
                <Label htmlFor="statementDescriptor" className="text-white">
                  Statement Descriptor
                </Label>
                <Input
                  id="statementDescriptor"
                  type="text"
                  placeholder="e.g., SmartStore"
                  maxLength={22}
                  value={config.statementDescriptor}
                  onChange={(e) => setConfig({ ...config, statementDescriptor: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  This appears on customer credit card statements (max 22 characters)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={testConnection}
                  disabled={isLoading || !config.publishableKey || !config.secretKey}
                  className="flex-1"
                  variant="outline"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button 
                  onClick={saveConfiguration}
                  disabled={isSaving || !config.publishableKey || !config.secretKey}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure webhooks to receive real-time payment updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label className="text-white">Webhook Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => copyToClipboard(webhookUrl)}
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  Add this URL to your Stripe Dashboard → Developers → Webhooks
                </p>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <Label htmlFor="webhookSecret" className="text-white">
                  Webhook Signing Secret
                </Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  placeholder="whsec_..."
                  value={config.webhookSecret}
                  onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Get this from Stripe after creating the webhook endpoint
                </p>
              </div>

              {/* Events to Listen */}
              <div className="space-y-2">
                <Label className="text-white">Events to Listen For</Label>
                <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    payment_intent.succeeded
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    payment_intent.payment_failed
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    charge.refunded
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    customer.subscription.updated
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  💡 <strong>Setup Instructions:</strong>
                  <br />1. Go to Stripe Dashboard → Developers → Webhooks
                  <br />2. Click &quot;Add endpoint&quot;
                  <br />3. Paste the webhook URL above
                  <br />4. Select the events listed
                  <br />5. Copy the signing secret and paste it here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Enabled Payment Methods
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose which payment methods customers can use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cards */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Credit & Debit Cards</Label>
                    <p className="text-sm text-gray-400">Visa, Mastercard, Amex, etc.</p>
                  </div>
                </div>
                <Switch
                  checked={config.paymentMethods.cards}
                  onChange={(e) => setConfig({
                    ...config,
                    paymentMethods: { ...config.paymentMethods, cards: e.target.checked }
                  })}
                />
              </div>

              {/* Apple Pay */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🍎</span>
                  </div>
                  <div>
                    <Label className="text-white font-medium">Apple Pay</Label>
                    <p className="text-sm text-gray-400">One-touch payments on Apple devices</p>
                  </div>
                </div>
                <Switch
                  checked={config.paymentMethods.applePay}
                  onChange={(e) => setConfig({
                    ...config,
                    paymentMethods: { ...config.paymentMethods, applePay: e.target.checked }
                  })}
                />
              </div>

              {/* Google Pay */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">G</span>
                  </div>
                  <div>
                    <Label className="text-white font-medium">Google Pay</Label>
                    <p className="text-sm text-gray-400">Fast checkout with Google Pay</p>
                  </div>
                </div>
                <Switch
                  checked={config.paymentMethods.googlePay}
                  onChange={(e) => setConfig({
                    ...config,
                    paymentMethods: { ...config.paymentMethods, googlePay: e.target.checked }
                  })}
                />
              </div>

              {/* ACH Direct Debit */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">ACH Direct Debit</Label>
                    <p className="text-sm text-gray-400">Bank transfers (US only)</p>
                  </div>
                </div>
                <Switch
                  checked={config.paymentMethods.ach}
                  onChange={(e) => setConfig({
                    ...config,
                    paymentMethods: { ...config.paymentMethods, ach: e.target.checked }
                  })}
                />
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
            href="https://dashboard.stripe.com/apikeys" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Get API Keys from Stripe Dashboard
          </a>
          <a 
            href="https://dashboard.stripe.com/webhooks" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Configure Webhooks
          </a>
          <a 
            href="https://stripe.com/docs" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Stripe Documentation
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

