'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);

  const generateReport = async (type: string) => {
    setLoading(true);
    setReportType(type);
    try {
      const response = await fetch(`/api/accounting/reports/${type.toLowerCase().replace(' ', '-')}`);
      if (response.ok) {
        const data = await response.json();
        toast.success(`${type} generated successfully`);
        // Handle report display
      } else {
        toast.error(`Failed to generate ${type}`);
      }
    } catch (error) {
      logger.error({
        message: 'Report generation error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { reportType: type }
      });
      toast.error('Error generating report');
    } finally {
      setLoading(false);
      setReportType(null);
    }
  };

  const reports = [
    { name: 'Balance Sheet', icon: BarChart3, color: 'blue', description: 'Assets, liabilities, and equity' },
    { name: 'Income Statement', icon: TrendingUp, color: 'green', description: 'Revenue and expenses' },
    { name: 'Cash Flow Statement', icon: DollarSign, color: 'purple', description: 'Cash inflows and outflows' },
    { name: 'Trial Balance', icon: FileText, color: 'orange', description: 'Account balances verification' },
    { name: 'Profit & Loss', icon: TrendingUp, color: 'red', description: 'Profitability analysis' },
    { name: 'General Ledger', icon: FileText, color: 'indigo', description: 'Complete transaction history' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and view financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 bg-${report.color}-100 rounded-lg`}>
                <report.icon className={`w-6 h-6 text-${report.color}-600`} />
              </div>
              <Button
                size="sm"
                onClick={() => generateReport(report.name)}
                disabled={loading && reportType === report.name}
              >
                {loading && reportType === report.name ? 'Generating...' : 'Generate'}
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{report.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Balance Sheet - October 2025</p>
                <p className="text-sm text-gray-600">Generated on Oct 9, 2025</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
