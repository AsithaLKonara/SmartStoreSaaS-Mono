'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  timestamp: string;
  ipAddress: string;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
  });

  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session, filters]);

  const fetchLogs = async () => {
    try {
      let url = '/api/compliance/audit-logs?';
      if (filters.action) url += `action=${filters.action}&`;
      if (filters.entity) url += `entity=${filters.entity}&`;
      if (filters.userId) url += `userId=${filters.userId}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      VIEW: 'bg-gray-100 text-gray-800',
      EXPORT: 'bg-purple-100 text-purple-800',
      LOGIN: 'bg-yellow-100 text-yellow-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Comprehensive activity trail</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Action</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="VIEW">View</option>
                <option value="EXPORT">Export</option>
                <option value="LOGIN">Login</option>
              </select>
            </div>
            <div>
              <Label>Entity</Label>
              <Input
                placeholder="User, Product, Order..."
                value={filters.entity}
                onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
              />
            </div>
            <div>
              <Label>User ID</Label>
              <Input
                placeholder="Filter by user"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.entity}
                        {log.entityId && <span className="text-gray-500 text-xs ml-1">({log.entityId.slice(0, 8)})</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.userId?.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

