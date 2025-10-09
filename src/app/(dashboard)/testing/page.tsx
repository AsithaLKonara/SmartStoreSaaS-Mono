'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export default function TestingPage() {
  const [running, setRunning] = useState(false);

  const testSuites = [
    {
      name: 'API Endpoints',
      tests: 243,
      passed: 240,
      failed: 3,
      duration: '12.5s',
      status: 'passed',
    },
    {
      name: 'Integration Tests',
      tests: 45,
      passed: 44,
      failed: 1,
      duration: '8.2s',
      status: 'passed',
    },
    {
      name: 'Authentication',
      tests: 28,
      passed: 28,
      failed: 0,
      duration: '3.1s',
      status: 'passed',
    },
    {
      name: 'Database Operations',
      tests: 67,
      passed: 65,
      failed: 2,
      duration: '5.7s',
      status: 'passed',
    },
  ];

  const runTests = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Testing Dashboard</h1>
          <p className="text-muted-foreground">Automated testing and quality assurance</p>
        </div>
        <Button onClick={runTests} disabled={running}>
          {running ? (
            <><Clock className="h-4 w-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><PlayCircle className="h-4 w-4 mr-2" /> Run All Tests</>
          )}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">383</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">377</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">6</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.4%</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Suites */}
      <div className="grid gap-4">
        {testSuites.map(suite => (
          <Card key={suite.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  {suite.name}
                </CardTitle>
                <Badge variant={suite.status === 'passed' ? 'default' : 'destructive'}>
                  {suite.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{suite.passed} passed</span>
                  </div>
                  {suite.failed > 0 && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{suite.failed} failed</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{suite.duration}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {suite.tests} tests
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
