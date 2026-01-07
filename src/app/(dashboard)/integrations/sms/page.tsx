'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  Settings,
  FileText,
  Send,
  BarChart3,
  TestTube,
  Clock,
  DollarSign,
  Shield
} from 'lucide-react';

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromPhoneNumber: string;
  messagingServiceSid: string;
  templates: {
    orderConfirmation: boolean;
    shippingUpdate: boolean;
    deliveryNotification: boolean;
    otpVerification: boolean;
  };
}

interface SMSLog {
  id: string;
  to: string;
  message: string;
  status: string;
  cost: number;
  timestamp: string;
}

export default function SMSIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [config, setConfig] = useState<SMSConfig>({
    accountSid: '',
    authToken: '',
    fromPhoneNumber: '',
    messagingServiceSid: '',
    templates: {
      orderConfirmation: true,
      shippingUpdate: true,
      deliveryNotification: true,
      otpVerification: true
    }
  });
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from SmartStore! If you receive this, your SMS configuration is working correctly.');
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, failed: 0, totalCost: 0 });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadConfiguration = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/setup?type=sms');
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

  const loadSMSLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/sms/logs');
      if (response.ok) {
        const data = await response.json();
        setSmsLogs(data.logs || []);
      }
    } catch (error) {
      // Error handled silently - user sees UI feedback
    }
  }, []);

  const loadSMSStats = useCallback(async () => {
    try {
      const response = await fetch('/api/sms/statistics');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      // Error handled silently - user sees UI feedback
    }
  }, [stats]);

  useEffect(() => {
    loadConfiguration();
    loadSMSLogs();
    loadSMSStats();
  }, [loadConfiguration, loadSMSLogs, loadSMSStats]);

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSid: config.accountSid,
          authToken: config.authToken
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ success: true, message: 'Twilio credentials verified! SMS service ready.' });
        setIsConnected(true);
      } else {
        setTestResult({ success: false, message: data.error || 'Invalid credentials. Please check your Account SID and Auth Token.' });
        setIsConnected(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to verify credentials. Please try again.' });
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
          type: 'sms',
          config: config
        })
      });

      if (response.ok) {
        alert('SMS configuration saved successfully!');
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

  const sendTestSMS = async () => {
    if (!testPhone) {
      alert('Please enter a phone number');
      return;
    }

    if (!testMessage) {
      alert('Please enter a message');
      return;
    }

    try {
      setIsSending(true);
      
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage
        })
      });

      if (response.ok) {
        alert(`Test SMS sent to ${testPhone}! Check your phone.`);
        await loadSMSLogs();
        await loadSMSStats();
      } else {
        const data = await response.json();
        alert(`Failed to send SMS: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to send SMS. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading && !config.accountSid) {
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
          <h1 className="text-3xl font-bold text-white">SMS Service Integration</h1>
          <p className="text-gray-400 mt-2">
            Configure Twilio for SMS notifications and OTP verification
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
          <TabsTrigger value="templates" className="data-[state=active]:bg-gray-700">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-gray-700">
            <Clock className="w-4 h-4 mr-2" />
            SMS Logs
          </TabsTrigger>
          <TabsTrigger value="statistics" className="data-[state=active]:bg-gray-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Twilio Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your Twilio account credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account SID */}
              <div className="space-y-2">
                <Label htmlFor="accountSid" className="text-white">
                  Account SID
                </Label>
                <Input
                  id="accountSid"
                  type="text"
                  placeholder="AC..."
                  value={config.accountSid}
                  onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Get from: Twilio Console → Account Info
                </p>
              </div>

              {/* Auth Token */}
              <div className="space-y-2">
                <Label htmlFor="authToken" className="text-white">
                  Auth Token
                </Label>
                <Input
                  id="authToken"
                  type="password"
                  placeholder="Enter auth token"
                  value={config.authToken}
                  onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Keep this secret! Never share publicly
                </p>
              </div>

              {/* From Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="fromPhone" className="text-white">
                  From Phone Number
                </Label>
                <Input
                  id="fromPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={config.fromPhoneNumber}
                  onChange={(e) => setConfig({ ...config, fromPhoneNumber: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Your Twilio phone number (with country code)
                </p>
              </div>

              {/* Messaging Service SID (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="messagingSid" className="text-white">
                  Messaging Service SID <span className="text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="messagingSid"
                  type="text"
                  placeholder="MG..."
                  value={config.messagingServiceSid}
                  onChange={(e) => setConfig({ ...config, messagingServiceSid: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  For advanced features like sender pools
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={testConnection}
                  disabled={isLoading || !config.accountSid || !config.authToken}
                  className="flex-1"
                  variant="outline"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button 
                  onClick={saveConfiguration}
                  disabled={isSaving || !config.accountSid || !config.authToken || !config.fromPhoneNumber}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test SMS Sender */}
          {isConnected && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Test SMS
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Test your SMS configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testPhone" className="text-white">
                    Recipient Phone Number
                  </Label>
                  <Input
                    id="testPhone"
                    type="tel"
                    placeholder="+1234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400">Include country code (e.g., +1 for US, +94 for Sri Lanka)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testMessage" className="text-white">
                    Message
                  </Label>
                  <Textarea
                    id="testMessage"
                    placeholder="Enter test message"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    maxLength={160}
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    {testMessage.length}/160 characters
                  </p>
                </div>
                
                <Button 
                  onClick={sendTestSMS}
                  disabled={isSending || !testPhone}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Test SMS'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                SMS Templates
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enable or disable automated SMS notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Order Confirmation */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Order Confirmation</Label>
                  <p className="text-sm text-gray-400">Sent when customer places an order</p>
                  <p className="text-xs text-gray-500 mt-1">
                    &quot;Your order #ORDER_ID has been confirmed. Total: AMOUNT&quot;
                  </p>
                </div>
                <Switch
                  checked={config.templates.orderConfirmation}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, orderConfirmation: e.target.checked }
                  })}
                />
              </div>

              {/* Shipping Update */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Shipping Update</Label>
                  <p className="text-sm text-gray-400">Sent when order is shipped</p>
                  <p className="text-xs text-gray-500 mt-1">
                    &quot;Your order #ORDER_ID has been shipped. Track: TRACKING_URL&quot;
                  </p>
                </div>
                <Switch
                  checked={config.templates.shippingUpdate}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, shippingUpdate: e.target.checked }
                  })}
                />
              </div>

              {/* Delivery Notification */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Delivery Notification</Label>
                  <p className="text-sm text-gray-400">Sent when order is out for delivery</p>
                  <p className="text-xs text-gray-500 mt-1">
                    &quot;Your order #ORDER_ID is out for delivery today!&quot;
                  </p>
                </div>
                <Switch
                  checked={config.templates.deliveryNotification}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, deliveryNotification: e.target.checked }
                  })}
                />
              </div>

              {/* OTP Verification */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <div>
                    <Label className="text-white font-medium">OTP Verification</Label>
                    <p className="text-sm text-gray-400">For 2FA and account verification</p>
                    <p className="text-xs text-gray-500 mt-1">
                      &quot;Your verification code is: CODE&quot;
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.templates.otpVerification}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, otpVerification: e.target.checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Logs Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent SMS Messages
              </CardTitle>
              <CardDescription className="text-gray-400">
                Recently sent SMS log
              </CardDescription>
            </CardHeader>
            <CardContent>
              {smsLogs.length > 0 ? (
                <div className="space-y-2">
                  {smsLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white font-medium">To: {log.to}</p>
                        <p className="text-sm text-gray-400 truncate">{log.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleString()} • ${log.cost.toFixed(4)}
                        </p>
                      </div>
                      <Badge variant={log.status === 'delivered' ? 'default' : 'secondary'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No SMS sent yet</p>
                  <p className="text-sm">SMS logs will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{stats.sent.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">Sent</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.delivered.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">Delivered</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.failed.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">Failed</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">${stats.totalCost.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-1">Total Cost</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                SMS Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-400">
              <p>• United States: $0.0079 per SMS</p>
              <p>• United Kingdom: $0.0106 per SMS</p>
              <p>• Sri Lanka: $0.0450 per SMS</p>
              <p>• India: $0.0082 per SMS</p>
              <p className="text-xs text-gray-500 mt-2">
                Prices may vary. Check Twilio pricing for exact rates.
              </p>
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
            href="https://console.twilio.com/" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Twilio Console
          </a>
          <a 
            href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Buy Twilio Phone Number
          </a>
          <a 
            href="https://www.twilio.com/docs/sms" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Twilio SMS Documentation
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

