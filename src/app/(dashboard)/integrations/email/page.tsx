'use client';

import { useState, useEffect } from 'react';
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
  Mail,
  Settings,
  FileText,
  Send,
  BarChart3,
  TestTube,
  Clock
} from 'lucide-react';

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  templates: {
    orderConfirmation: boolean;
    shippingNotification: boolean;
    passwordReset: boolean;
    welcomeEmail: boolean;
    invoiceEmail: boolean;
  };
}

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: string;
  timestamp: string;
}

export default function EmailIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [config, setConfig] = useState<EmailConfig>({
    apiKey: '',
    fromEmail: '',
    fromName: 'SmartStore',
    replyTo: '',
    templates: {
      orderConfirmation: true,
      shippingNotification: true,
      passwordReset: true,
      welcomeEmail: true,
      invoiceEmail: true
    }
  });
  const [testEmail, setTestEmail] = useState('');
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, bounced: 0, spam: 0 });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
    loadEmailLogs();
    loadEmailStats();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations/setup?type=email');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig({ ...config, ...data.config });
          setIsConnected(data.connected || false);
        }
      }
    } catch (error) {
      console.error('Error loading email configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await fetch('/api/email/logs');
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const loadEmailStats = async () => {
    try {
      const response = await fetch('/api/email/statistics');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading email stats:', error);
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.apiKey
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestResult({ success: true, message: 'SendGrid API key is valid! Email service ready.' });
        setIsConnected(true);
      } else {
        setTestResult({ success: false, message: data.error || 'Invalid API key. Please check your credentials.' });
        setIsConnected(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to verify API key. Please try again.' });
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
          type: 'email',
          config: config
        })
      });

      if (response.ok) {
        alert('Email configuration saved successfully!');
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

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    try {
      setIsSending(true);
      
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Test Email from SmartStore',
          html: '<h1>Test Email</h1><p>If you receive this, your email configuration is working correctly!</p>',
          from: config.fromEmail,
          fromName: config.fromName
        })
      });

      if (response.ok) {
        alert(`Test email sent to ${testEmail}! Check your inbox.`);
        await loadEmailLogs();
      } else {
        const data = await response.json();
        alert(`Failed to send test email: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to send test email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading && !config.apiKey) {
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
          <h1 className="text-3xl font-bold text-white">Email Service Integration</h1>
          <p className="text-gray-400 mt-2">
            Configure SendGrid for automated email notifications
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
            Email Logs
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
                SendGrid Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your SendGrid API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-white">
                  SendGrid API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="SG...."
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Get from: SendGrid Dashboard → Settings → API Keys
                </p>
              </div>

              {/* From Email */}
              <div className="space-y-2">
                <Label htmlFor="fromEmail" className="text-white">
                  From Email Address
                </Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@yourstore.com"
                  value={config.fromEmail}
                  onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Must be verified in SendGrid
                </p>
              </div>

              {/* From Name */}
              <div className="space-y-2">
                <Label htmlFor="fromName" className="text-white">
                  From Name
                </Label>
                <Input
                  id="fromName"
                  type="text"
                  placeholder="SmartStore"
                  value={config.fromName}
                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Reply-To */}
              <div className="space-y-2">
                <Label htmlFor="replyTo" className="text-white">
                  Reply-To Email
                </Label>
                <Input
                  id="replyTo"
                  type="email"
                  placeholder="support@yourstore.com"
                  value={config.replyTo}
                  onChange={(e) => setConfig({ ...config, replyTo: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={testConnection}
                  disabled={isLoading || !config.apiKey}
                  className="flex-1"
                  variant="outline"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <Button 
                  onClick={saveConfiguration}
                  disabled={isSaving || !config.apiKey || !config.fromEmail}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Email Sender */}
          {isConnected && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Test Email
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Test your email configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail" className="text-white">
                    Recipient Email
                  </Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <Button 
                  onClick={sendTestEmail}
                  disabled={isSending || !testEmail}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Test Email'}
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
                Email Templates
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enable or disable automated email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Order Confirmation */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Order Confirmation</Label>
                  <p className="text-sm text-gray-400">Sent when customer places an order</p>
                </div>
                <Switch
                  checked={config.templates.orderConfirmation}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, orderConfirmation: e.target.checked }
                  })}
                />
              </div>

              {/* Shipping Notification */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Shipping Notification</Label>
                  <p className="text-sm text-gray-400">Sent when order is shipped</p>
                </div>
                <Switch
                  checked={config.templates.shippingNotification}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, shippingNotification: e.target.checked }
                  })}
                />
              </div>

              {/* Password Reset */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Password Reset</Label>
                  <p className="text-sm text-gray-400">Sent when customer requests password reset</p>
                </div>
                <Switch
                  checked={config.templates.passwordReset}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, passwordReset: e.target.checked }
                  })}
                />
              </div>

              {/* Welcome Email */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Welcome Email</Label>
                  <p className="text-sm text-gray-400">Sent to new customers</p>
                </div>
                <Switch
                  checked={config.templates.welcomeEmail}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, welcomeEmail: e.target.checked }
                  })}
                />
              </div>

              {/* Invoice Email */}
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-medium">Invoice Email</Label>
                  <p className="text-sm text-gray-400">Sent with order invoices</p>
                </div>
                <Switch
                  checked={config.templates.invoiceEmail}
                  onChange={(e) => setConfig({
                    ...config,
                    templates: { ...config.templates, invoiceEmail: e.target.checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Logs Tab */}
        <TabsContent className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Emails
              </CardTitle>
              <CardDescription className="text-gray-400">
                Recently sent email log
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailLogs.length > 0 ? (
                <div className="space-y-2">
                  {emailLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{log.subject}</p>
                        <p className="text-sm text-gray-400">
                          To: {log.to} • {new Date(log.timestamp).toLocaleString()}
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
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No emails sent yet</p>
                  <p className="text-sm">Email logs will appear here</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{stats.bounced.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">Bounced</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.spam.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">Spam Reports</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a 
            href="https://app.sendgrid.com/settings/api_keys" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Create SendGrid API Key
          </a>
          <a 
            href="https://app.sendgrid.com/settings/sender_auth" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → Verify Sender Email
          </a>
          <a 
            href="https://docs.sendgrid.com/" 
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            → SendGrid Documentation
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

