'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  Brain, 
  Shield, 
  Settings, 
  Bell, 
  CreditCard,
  Save,
  Edit,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization settings, users, and preferences
          </p>
        </div>
      </div>

      <Tabs className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Update your organization details and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" defaultValue="SmartStore Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" defaultValue="smartstore.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" defaultValue="Leading e-commerce platform for modern businesses" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Current Plan</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">PRO</Badge>
                    <span className="text-sm text-muted-foreground">$29/month</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and permissions
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: 'Admin User', email: 'admin@smartstore.com', role: 'ADMIN', status: 'Active' },
                  { name: 'John Doe', email: 'john@smartstore.com', role: 'STAFF', status: 'Active' },
                  { name: 'Jane Smith', email: 'jane@smartstore.com', role: 'STAFF', status: 'Inactive' }
                ].map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure AI models, preferences, and automation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommendation Engine</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recLimit">Recommendation Limit</Label>
                    <Input id="recLimit" type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recThreshold">Similarity Threshold</Label>
                    <Input id="recThreshold" type="number" defaultValue="0.7" step="0.1" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="collaborative" defaultChecked />
                  <Label htmlFor="collaborative">Enable Collaborative Filtering</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="contentBased" defaultChecked />
                  <Label htmlFor="contentBased">Enable Content-Based Filtering</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Predictive Analytics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="forecastPeriod">Forecast Period (days)</Label>
                    <Input id="forecastPeriod" type="number" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confidenceLevel">Confidence Level</Label>
                    <Input id="confidenceLevel" type="number" defaultValue="0.95" step="0.05" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="demandForecast" defaultChecked />
                  <Label htmlFor="demandForecast">Enable Demand Forecasting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="churnPrediction" defaultChecked />
                  <Label htmlFor="churnPrediction">Enable Churn Prediction</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Marketing Automation</h3>
                <div className="flex items-center space-x-2">
                  <Switch id="abandonedCart" defaultChecked />
                  <Label htmlFor="abandonedCart">Abandoned Cart Recovery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="birthdayCampaigns" defaultChecked />
                  <Label htmlFor="birthdayCampaigns">Birthday Campaigns</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="reEngagement" defaultChecked />
                  <Label htmlFor="reEngagement">Re-engagement Campaigns</Label>
                </div>
              </div>

              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>
                Configure security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Password Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Length</Label>
                    <Input id="minLength" type="number" defaultValue="8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDays">Password Expiry (days)</Label>
                    <Input id="expiryDays" type="number" defaultValue="90" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="requireUppercase" defaultChecked />
                  <Label htmlFor="requireUppercase">Require Uppercase</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="requireNumbers" defaultChecked />
                  <Label htmlFor="requireNumbers">Require Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="requireSymbols" defaultChecked />
                  <Label htmlFor="requireSymbols">Require Symbols</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Multi-Factor Authentication</h3>
                <div className="flex items-center space-x-2">
                  <Switch id="mfaEnabled" defaultChecked />
                  <Label htmlFor="mfaEnabled">Enable MFA for all users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="mfaRequired" defaultChecked />
                  <Label htmlFor="mfaRequired">MFA required for admin accounts</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Session Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
                    <Input id="maxSessions" type="number" defaultValue="3" />
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>
                Manage your external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">WooCommerce</h3>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Connected</Badge>
                      <span className="text-sm text-muted-foreground">Last sync: 2 hours ago</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Site URL:</span>
                      <p className="text-muted-foreground">https://store.smartstore.com</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant="default" className="ml-2">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">WhatsApp Business</h3>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Not Connected</Badge>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect your WhatsApp Business account to enable customer messaging
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Courier Services</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Aramex', status: 'Connected', lastSync: '1 hour ago' },
                    { name: 'DHL Express', status: 'Connected', lastSync: '30 minutes ago' },
                    { name: 'FedEx', status: 'Not Connected', lastSync: 'Never' }
                  ].map((courier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{courier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last sync: {courier.lastSync}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={courier.status === 'Connected' ? 'default' : 'secondary'}>
                          {courier.status}
                        </Badge>
                        {courier.status === 'Connected' ? (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order Updates</p>
                      <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Inventory Alerts</p>
                      <p className="text-sm text-muted-foreground">Low stock and out-of-stock notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Analytics Reports</p>
                      <p className="text-sm text-muted-foreground">Weekly and monthly performance reports</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Campaigns</p>
                      <p className="text-sm text-muted-foreground">Campaign performance and results</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SMS Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order Confirmations</p>
                      <p className="text-sm text-muted-foreground">SMS confirmation for new orders</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delivery Updates</p>
                      <p className="text-sm text-muted-foreground">Real-time delivery status updates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Push Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Real-time Alerts</p>
                      <p className="text-sm text-muted-foreground">Instant notifications for critical events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">AI Insights</p>
                      <p className="text-sm text-muted-foreground">Important AI-generated insights and recommendations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription plan and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Plan</h3>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xl font-bold">PRO Plan</h4>
                      <p className="text-muted-foreground">$29/month</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Users:</span>
                      <span>5 of 10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Products:</span>
                      <span>Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Features:</span>
                      <span>Full Access</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Support:</span>
                      <span>Priority</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1">Change Plan</Button>
                    <Button variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Badge variant="default">Default</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Billing History</h3>
                <div className="space-y-3">
                  {[
                    { date: 'Dec 1, 2024', amount: '$29.00', status: 'Paid', invoice: 'INV-001' },
                    { date: 'Nov 1, 2024', amount: '$29.00', status: 'Paid', invoice: 'INV-002' },
                    { date: 'Oct 1, 2024', amount: '$29.00', status: 'Paid', invoice: 'INV-003' }
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">Invoice: {invoice.invoice}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{invoice.amount}</span>
                        <Badge variant="default">{invoice.status}</Badge>
                        <Button variant="ghost" size="sm">Download</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
