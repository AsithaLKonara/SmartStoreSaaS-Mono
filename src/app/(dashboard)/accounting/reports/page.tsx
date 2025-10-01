'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FinancialReportsPage() {
  const { data: session } = useSession();
  const [reportType, setReportType] = useState<'pl' | 'bs'>('pl');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [plData, setPlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      if (reportType === 'pl') {
        fetchProfitLoss();
      } else if (reportType === 'bs') {
        fetchBalanceSheet();
      }
    }
  }, [session, reportType, startDate, endDate]);

  const fetchProfitLoss = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setPlData(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/reports/balance-sheet?asOfDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setBsData(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Generating report...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-gray-600 mt-2">Generate and view financial statements</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={reportType === 'pl' ? 'default' : 'outline'}
          onClick={() => setReportType('pl')}
        >
          Profit & Loss
        </Button>
        <Button
          variant={reportType === 'bs' ? 'default' : 'outline'}
          onClick={() => setReportType('bs')}
        >
          Balance Sheet
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {reportType === 'pl' && plData && (
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="font-semibold text-lg">Revenue: ${plData.revenue?.total || 0}</div>
              <div className="font-semibold text-lg">Expenses: ${plData.expenses?.total || 0}</div>
              <div className="font-bold text-xl border-t pt-2">
                Net Income: ${plData.netIncome || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'bs' && bsData && (
        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="font-semibold text-lg">Assets: ${bsData.assets?.total || 0}</div>
              <div className="font-semibold text-lg">Liabilities: ${bsData.liabilities?.total || 0}</div>
              <div className="font-semibold text-lg">Equity: ${bsData.equity?.total || 0}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
