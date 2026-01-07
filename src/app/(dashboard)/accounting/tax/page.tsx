'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface TaxRate {
  id: string;
  name: string;
  code: string;
  rate: number;
  jurisdiction: string;
  taxType: string;
  isActive: boolean;
  isCompound: boolean;
}

export default function TaxManagementPage() {
  const { data: session } = useSession();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchTaxRates();
    }
  }, [session]);

  const fetchTaxRates = async () => {
    try {
      const res = await fetch('/api/accounting/tax/rates');
      if (res.ok) {
        const data = await res.json();
        setTaxRates(data.data || []);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching tax rates',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Management</h1>
          <p className="text-gray-600 mt-2">Configure tax rates and jurisdictions</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Tax Rate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taxRates.map((tax) => (
          <Card key={tax.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{tax.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{tax.jurisdiction}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${tax.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {tax.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Code:</span>
                  <span className="font-mono font-semibold">{tax.code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rate:</span>
                  <span className="font-mono font-semibold text-lg">{tax.rate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm">{tax.taxType}</span>
                </div>
                {tax.isCompound && (
                  <div className="text-xs text-orange-600">⚠️ Compound Tax</div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {taxRates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <p>No tax rates configured yet.</p>
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Tax Rate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

