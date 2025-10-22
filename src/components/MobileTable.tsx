'use client';
import React from 'react';
import { Card } from '@/components/ui/card';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactElement | string;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  actions: (item: any) => React.ReactElement;
  emptyMessage: string;
  'data-testid'?: string;
}

export function ResponsiveTable({ data, columns, actions, emptyMessage, 'data-testid': testId }: ResponsiveTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" data-testid={testId}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid={testId}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-sm">
                  {actions(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{col.label}:</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                {actions(item)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
