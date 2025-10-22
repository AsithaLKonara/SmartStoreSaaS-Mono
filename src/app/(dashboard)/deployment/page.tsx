'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, GitBranch, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export default function DeploymentPage() {
  const deployments = [
    {
      id: '1',
      environment: 'Production',
      branch: 'main',
      commit: 'feat: Add email campaigns',
      status: 'success',
      url: 'https://smartstore-demo.vercel.app',
      deployedAt: '2 hours ago',
      duration: '45s',
    },
    {
      id: '2',
      environment: 'Staging',
      branch: 'develop',
      commit: 'fix: Update inventory logic',
      status: 'success',
      url: 'https://staging.smartstore-demo.vercel.app',
      deployedAt: '5 hours ago',
      duration: '38s',
    },
    {
      id: '3',
      environment: 'Production',
      branch: 'main',
      commit: 'feat: Add subscriptions',
      status: 'success',
      url: 'https://smartstore-demo.vercel.app',
      deployedAt: '1 day ago',
      duration: '42s',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deployment History</h1>
          <p className="text-muted-foreground">Track your deployment history and status</p>
        </div>
        <Button>
          <Rocket className="h-4 w-4 mr-2" />
          Deploy Now
        </Button>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Deployment</CardTitle>
          <CardDescription>Production environment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Live
                </Badge>
                <span className="text-sm font-medium">smartstore-demo.vercel.app</span>
                <Button size="sm" variant="ghost" onClick={() => window.open('https://smartstore-demo.vercel.app', '_blank')}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Last deployed 2 hours ago • Build #6 • Duration: 45s
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Deployments</h2>
        {deployments.map(deployment => (
          <Card key={deployment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GitBranch className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-base">{deployment.commit}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {deployment.branch} • {deployment.deployedAt}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={deployment.status === 'success' ? 'default' : 'destructive'}>
                  {deployment.status === 'success' ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Success</>
                  ) : (
                    'Failed'
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-muted-foreground">Environment: <strong>{deployment.environment}</strong></span>
                  <span className="text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {deployment.duration}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.open(deployment.url, '_blank')}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
