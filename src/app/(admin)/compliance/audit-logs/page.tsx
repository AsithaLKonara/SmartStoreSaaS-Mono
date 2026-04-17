"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search,
  Filter,
  Download,
  Shield,
  Zap,
  RefreshCw,
  Clock,
  User,
  Globe,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: any;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/compliance/audit-logs?';
      if (filters.action) url += `action=${filters.action}&`;
      if (filters.entity) url += `entity=${filters.entity}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Audit log fetch error', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session, fetchLogs]);

  const getActionStyles = (action: string) => {
    const styles: Record<string, { bg: string; text: string; icon?: any }> = {
      CREATE: { bg: 'bg-green-100', text: 'text-green-800' },
      UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800' },
      DELETE: { bg: 'bg-red-100', text: 'text-red-800' },
      LOGIN: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      AI_OPTIMIZATION: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Zap },
      AUTO_PROCUREMENT: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Zap },
      WEBHOOK_SENT: { bg: 'bg-purple-100', text: 'text-purple-800', icon: ExternalLink },
    };
    return styles[action] || { bg: 'bg-slate-100', text: 'text-slate-800' };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            Audit Trail
          </h1>
          <p className="text-slate-500 mt-1">Immutable record of all system and AI activities</p>
        </div>
        <Button variant="outline" className="rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          Export XML/CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 space-y-4">
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Refine Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Operation Type</Label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                >
                  <option value="">All Operations</option>
                  <option value="AI_OPTIMIZATION">AI Optimization</option>
                  <option value="AUTO_PROCUREMENT">Auto Procurement</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Auth/Login</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Resource Entity</Label>
                <Input
                  placeholder="Product, User..."
                  className="bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                  value={filters.entity}
                  onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                />
              </div>
              <Button
                onClick={fetchLogs}
                className="w-full bg-slate-900 rounded-xl"
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Refresh Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <div className="glass-dark rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loading && logs.length === 0 ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-4" />
                <p className="text-slate-500">Decrypting audit history...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No activity records match your criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const style = getActionStyles(log.action);
                  const ActionIcon = style.icon;
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-lg ${style.bg} ${style.text}`}>
                        {ActionIcon ? <ActionIcon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900 flex items-center gap-2">
                            {log.action.replace(/_/g, ' ')}
                            <span className="text-xs font-normal text-slate-400">•</span>
                            <span className="text-xs font-medium text-indigo-600 uppercase tracking-tight">{log.entity}</span>
                          </p>
                          <time className="text-xs text-slate-400">
                            {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                          </time>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 truncate">
                          Action performed on resource <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">{log.entityId || 'SYS'}</span>
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <User className="w-3 h-3" />
                            {log.userId?.slice(-6) || 'SYSTEM'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Globe className="w-3 h-3" />
                            {log.ipAddress || '127.0.0.1'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

