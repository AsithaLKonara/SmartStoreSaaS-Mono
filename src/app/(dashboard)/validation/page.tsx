'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ValidationPage() {
  const [validationResults, setValidationResults] = useState<any>(null);

  const validators = [
    { name: 'Email Format', endpoint: '/api/validate/email', status: 'ready' },
    { name: 'Phone Number', endpoint: '/api/validate/phone', status: 'ready' },
    { name: 'SKU Format', endpoint: '/api/validate/sku', status: 'ready' },
    { name: 'Tax ID', endpoint: '/api/validate/tax-id', status: 'ready' },
    { name: 'Credit Card', endpoint: '/api/validate/card', status: 'ready' },
    { name: 'Address', endpoint: '/api/validate/address', status: 'ready' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Validation Tools</h1>
        <p className="text-muted-foreground">Validate and verify data integrity</p>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2" />
            Validation Summary
          </CardTitle>
          <CardDescription>Current validation rules and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">98.7%</div>
              <div className="text-sm text-muted-foreground mt-1">Valid Data</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">1.2%</div>
              <div className="text-sm text-muted-foreground mt-1">Warnings</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-red-600">0.1%</div>
              <div className="text-sm text-muted-foreground mt-1">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {validators.map(validator => (
          <Card key={validator.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{validator.name}</CardTitle>
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {validator.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">{validator.endpoint}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input placeholder={`Enter ${validator.name.toLowerCase()} to validate`} />
                <Button size="sm" className="w-full">Validate</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Validation Rules</CardTitle>
          <CardDescription>Current data validation policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'Email addresses must be valid format',
              'Phone numbers must be E.164 format',
              'SKUs must be unique across organization',
              'Prices must be non-negative',
              'Stock levels must be integers',
              'Customer names are required',
            ].map((rule, i) => (
              <div key={i} className="flex items-center space-x-2 p-2 border rounded">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">{rule}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
