
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Database, Users, ShoppingCart, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { SuperAdminOnly } from '@/components/auth/RoleProtectedPage';

interface SystemStatus {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
  responseTime: number;
  database: {
    connected: boolean;
    responseTime: number;
    users: number;
    organizations: number;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  checks: {
    database: boolean;
    memory: boolean;
    uptime: boolean;
  };
}

interface Metrics {
  period: string;
  business: {
    orders: {
      total: number;
      revenue: number;
      averageValue: number;
    };
    customers: {
      total: number;
      conversionRate: number;
    };
    products: {
      total: number;
      active: number;
    };
  };
  system: {
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
    uptime: number;
    nodeVersion: string;
  };
}

function MonitoringPageContent() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics?period=24h');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchSystemStatus(), fetchMetrics()]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading && !systemStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system health, performance metrics, and status monitoring
          </p>
        </div>
        <Button onClick={refreshData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {systemStatus && getStatusIcon(systemStatus.status)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(systemStatus?.status || 'unknown')}>
                {systemStatus?.status.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Response: {systemStatus?.responseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus ? formatUptime(systemStatus.uptime) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Version: {systemStatus?.version || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.database.responseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus?.database.users} users, {systemStatus?.database.organizations} orgs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.memory.heapUsed}MB
            </div>
            <p className="text-xs text-muted-foreground">
              of {systemStatus?.memory.heapTotal}MB total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders (24h)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.business.orders.total}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ${metrics.business.orders.averageValue}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (24h)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.business.orders.revenue}</div>
              <p className="text-xs text-muted-foreground">
                Total revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers (24h)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.business.customers.total}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.business.customers.conversionRate}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.business.products.total}</div>
              <p className="text-xs text-muted-foreground">
                Active products
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Checks</CardTitle>
          <CardDescription>
            Detailed system component status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Connection</span>
              <div className="flex items-center space-x-2">
                {systemStatus?.checks.database ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {systemStatus?.checks.database ? 'Healthy' : 'Unhealthy'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Memory Usage</span>
              <div className="flex items-center space-x-2">
                {systemStatus?.checks.memory ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {systemStatus?.checks.memory ? 'Healthy' : 'High Usage'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Uptime</span>
              <div className="flex items-center space-x-2">
                {systemStatus?.checks.uptime ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {systemStatus?.checks.uptime ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Refresh */}
      <div className="text-center text-sm text-muted-foreground">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <SuperAdminOnly showUnauthorized={true}>
      <MonitoringPageContent />
    </SuperAdminOnly>
  );
}