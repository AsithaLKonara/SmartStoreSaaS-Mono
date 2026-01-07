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
  CreditCard,
  Settings,
  Webhook,
  DollarSign,
  Copy,
  TestTube,
  Smartphone,
  Building
} from 'lucide-react';

interface PayHereConfig {
  merchantId: string;
  merchantSecret: string;
  sandbox: boolean;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

export default function PayHereIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<PayHereConfig>({
    merchantId: '',
    merchantSecret: '',
    sandbox: true,
    currency: 'LKR',
    returnUrl: '',
    cancelUrl: '',
    notifyUrl: ''
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadConfiguration = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/setup?type=payhere');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig({ ...config, ...data.config });
          setIsConnected(data.connected || false);
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
    const baseUrl = window.location.origin;
    setConfig(prev => ({
      ...prev,
      returnUrl: `${baseUrl}/checkout/success`,
      cancelUrl: `${baseUrl}/checkout/cancel`,
      notifyUrl: `${baseUrl}/api/payments/payhere/notify`
    }));
  }, [loadConfiguration]);

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/payments/payhere/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: config.merchantId,
          merchantSecret: config.merchantSecret,
          sandbox: config.sandbox
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ success: true, message: 'Connection successful! PayHere is configured correctly.' });
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
          type: 'payhere',
          config: config
        })
      });

      if (response.ok) {
        alert('PayHere configuration saved successfully!');
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

  const initiateTestPayment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/payhere/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          orderId: `TEST-${Date.now()}`,
          items: 'Test Payment',
          currency: 'LKR'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
      } else {
        alert('Failed to initiate test payment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to initiate test payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (isLoading && !config.merchantId) {
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
          <h1 className="text-3xl font-bold text-white">PayHere Integration</h1>
          <p className="text-gray-400 mt-2">
            Configure PayHere payment gateway for Sri Lankan Rupee (LKR) payments
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
                Merchant Credentials
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your PayHere merchant credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Environment Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Sandbox Mode</Label>
                  <p className="text-sm text-gray-400">Use sandbox for testing</p>
                </div>
                <Switch
                  checked={config.sandbox}
                  onChange={(e) => setConfig({ ...config, sandbox: e.target.checked })}
                />
              </div>

              {config.sandbox && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">
                    ⚠️ <strong>Sandbox Mode Active:</strong> Test payments only. No real money will be charged.
                  </p>
                </div>
              )}

              {/* Merchant ID */}
              <div className="space-y-2">
                <Label htmlFor="merchantId" className="text-white">
                  Merchant ID
                </Label>
                <Input
                  id="merchantId"
                  type="text"
                  placeholder="1234567"
                  value={config.merchantId}
                  onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Get this from PayHere Dashboard → Settings → Domains & Credentials
                </p>
              </div>

              {/* Merchant Secret */}
              <div className="space-y-2">
                <Label htmlFor="merchantSecret" className="text-white">
                  Merchant Secret
                </Label>
                <Input
                  id="merchantSecret"
                  type="password"
                  placeholder="Enter your merchant secret"
                  value={config.merchantSecret}
                  onChange={(e) => setConfig({ ...config, merchantSecret: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Keep this secret! Never share or commit to version control
                </p>
              </div>

              {/* Currency Display */}
              <div className="space-y-2">
                <Label className="text-white">Currency</Label>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">LKR - Sri Lankan Rupee (රු)</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">PayHere supports LKR payments only</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={testConnection}
                  disabled={isLoading || !config.merchantId || !config.merchantSecret}
                  className="flex-1"
                  variant="outline"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button 
                  onClick={saveConfiguration}
                  disabled={isSaving || !config.merchantId || !config.merchantSecret}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>

              {/* Test Payment Button */}
              {isConnected && config.sandbox && (
                <Button 
                  onClick={initiateTestPayment}
                  disabled={isLoading}
                  className="w-full"
                  variant="secondary"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Initiate Test Payment (රු 100.00)
                </Button>
              )}
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
                Configure payment notification URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notify URL */}
              <div className="space-y-2">
                <Label className="text-white">Notify URL (Server-to-Server)</Label>
                <div className="flex gap-2">
                  <Input
                    value={config.notifyUrl}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => copyToClipboard(config.notifyUrl)}
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  Add this URL to PayHere Dashboard for payment notifications
                </p>
              </div>

              {/* Return URL */}
              <div className="space-y-2">
                <Label className="text-white">Return URL (Success)</Label>
                <Input
                  value={config.returnUrl}
                  onChange={(e) => setConfig({ ...config, returnUrl: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Customer returns here after successful payment
                </p>
              </div>

              {/* Cancel URL */}
              <div className="space-y-2">
                <Label className="text-white">Cancel URL</Label>
                <Input
                  value={config.cancelUrl}
                  onChange={(e) => setConfig({ ...config, cancelUrl: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Customer returns here if payment is cancelled
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  💡 <strong>Setup Instructions:</strong>
                  <br />1. Go to PayHere Dashboard → Settings → Domains & Credentials
                  <br />2. Add the Notify URL above
                  <br />3. Verify your domain is whitelisted
                  <br />4. Copy your Merchant ID and Secret
                  <br />5. Paste them in the Configuration tab
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
                Available Payment Methods
              </CardTitle>
              <CardDescription className="text-gray-400">
                PayHere supports multiple payment methods in Sri Lanka
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Credit/Debit Cards */}
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Credit & Debit Cards</Label>
                    <p className="text-sm text-gray-400">Visa, Mastercard, Amex</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Enabled by default
                </div>
              </div>

              {/* Mobile Banking */}
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Mobile Banking</Label>
                    <p className="text-sm text-gray-400">Dialog eZ Cash, mCash, etc.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Enabled by default
                </div>
              </div>

              {/* Internet Banking */}
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Internet Banking</Label>
                    <p className="text-sm text-gray-400">All major Sri Lankan banks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Enabled by default
                </div>
              </div>

              {/* Transaction Fee Info */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <Label className="text-white font-medium">Transaction Fees</Label>
                <div className="mt-2 space-y-1 text-sm text-gray-400">
                  <p>• Credit Cards: 3.5% + LKR 5.00</p>
                  <p>• Mobile Banking: 2.5% (min LKR 10)</p>
                  <p>• Internet Banking: 1.5% (min LKR 10)</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Fees are approximate. Check PayHere pricing for exact rates.
                </p>
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
            href="https://www.payhere.lk/merchant/register" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Register as PayHere Merchant
          </a>
          <a 
            href="https://www.payhere.lk/merchant/settings" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Get Merchant Credentials
          </a>
          <a 
            href="https://support.payhere.lk/" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → PayHere Documentation
          </a>
        </CardContent>
      </Card>

      {/* Settlement Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Settlement Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>• Settlement Period: T+2 business days</p>
          <p>• Payout Currency: LKR to local bank account</p>
          <p>• Minimum Settlement: LKR 1,000</p>
          <p>• Settlement Frequency: Daily (if minimum met)</p>
        </CardContent>
      </Card>
    </div>
  );
}

