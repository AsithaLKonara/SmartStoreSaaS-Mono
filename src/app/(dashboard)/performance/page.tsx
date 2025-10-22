'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Activity, Zap, Clock, Server, Database, AlertCircle } from 'lucide-react';
import { SuperAdminOnly } from '@/components/auth/RoleProtectedPage';

function PerformancePageContent() {
  const [metrics, setMetrics] = useState({
    responseTime: 145,
    uptime: 99.98,
    requests: 15420,
    errors: 12,
    cpuUsage: 32,
    memoryUsage: 68,
    dbConnections: 15,
    cacheHitRate: 94.5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <p className="text-muted-foreground">Real-time system performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
            <Badge className="bg-green-100 text-green-800 mt-2">Excellent</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime}%</div>
            <Badge className="bg-green-100 text-green-800 mt-2">Stable</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Requests/Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.requests.toLocaleString()}</div>
            <Badge className="bg-blue-100 text-blue-800 mt-2">Normal</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Errors (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errors}</div>
            <Badge className="bg-yellow-100 text-yellow-800 mt-2">Low</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Server Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>CPU Usage</Label>
                <span className="text-sm font-medium">{metrics.cpuUsage}%</span>
              </div>
              <Progress value={metrics.cpuUsage} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Memory Usage</Label>
                <span className="text-sm font-medium">{metrics.memoryUsage}%</span>
              </div>
              <Progress value={metrics.memoryUsage} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Active Connections</Label>
                <span className="text-sm font-medium">{metrics.dbConnections}/100</span>
              </div>
              <Progress value={(metrics.dbConnections / 100) * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Cache Hit Rate</Label>
                <span className="text-sm font-medium">{metrics.cacheHitRate}%</span>
              </div>
              <Progress value={metrics.cacheHitRate} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  return (
    <SuperAdminOnly showUnauthorized={true}>
      <PerformancePageContent />
    </SuperAdminOnly>
  );
}
