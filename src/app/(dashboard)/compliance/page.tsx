'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, FileText, Download, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SuperAdminOnly } from '@/components/auth/RoleProtectedPage';

function CompliancePageContent() {
  const { data: session } = useSession();
  const [customerEmail, setCustomerEmail] = useState('');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleDataExport = async () => {
    if (!customerEmail) {
      setMessage('Please enter customer email');
      return;
    }

    setExporting(true);
    setMessage('');

    try {
      const res = await fetch('/api/compliance/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail }),
      });

      const data = await res.json();

      if (data.success) {
        // Download as JSON
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-data-${customerEmail}-${Date.now()}.json`;
        a.click();
        setMessage('✅ Data exported successfully');
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <p className="text-gray-600 mt-2">GDPR, Data Protection & Audit Trail</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GDPR Data Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              <CardTitle>Data Export</CardTitle>
            </div>
            <CardDescription>Export customer data (GDPR)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Customer Email</Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleDataExport} disabled={exporting} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>
            {message && (
              <div className={`text-sm p-2 rounded ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <CardTitle>Right to be Forgotten</CardTitle>
            </div>
            <CardDescription>Delete customer data (GDPR)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete customer data per GDPR requirements
            </p>
            <Button variant="destructive" className="w-full" disabled>
              Request Data Deletion
            </Button>
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <CardTitle>Audit Trail</CardTitle>
            </div>
            <CardDescription>View all system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Comprehensive logging of all actions
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/compliance/audit-logs">
                <Search className="w-4 h-4 mr-2" />
                View Audit Logs
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-medium">GDPR Compliance</span>
              </div>
              <span className="text-green-600 font-semibold">✓ Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium">Audit Logging</span>
              </div>
              <span className="text-green-600 font-semibold">✓ Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-medium">Data Retention Policies</span>
              </div>
              <span className="text-green-600 font-semibold">✓ Configured</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <SuperAdminOnly showUnauthorized={true}>
      <CompliancePageContent />
    </SuperAdminOnly>
  );
}

