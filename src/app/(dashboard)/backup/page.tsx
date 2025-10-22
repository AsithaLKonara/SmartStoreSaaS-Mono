'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Database, Download, Upload, RefreshCw, Clock, HardDrive, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { SuperAdminOnly } from '@/components/auth/RoleProtectedPage';

interface Backup {
  id: string;
  filename: string;
  size: number;
  type: string;
  createdAt: string;
  status: string;
}

function BackupPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchBackups();
  }, [session, status, router]);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Backup created successfully');
        fetchBackups();
      } else {
        toast.error('Failed to create backup');
      }
    } catch (error) {
      toast.error('Error creating backup');
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/${backupId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}.json`;
        a.click();
        toast.success('Backup downloaded successfully');
      }
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will replace all current data.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/backup/${backupId}/restore`, {
        method: 'POST'
      });
      if (response.ok) {
        toast.success('Backup restored successfully. Please refresh the page.');
      } else {
        toast.error('Failed to restore backup');
      }
    } catch (error) {
      toast.error('Error restoring backup');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-8 h-8" />
            Backup & Recovery
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage database backups
          </p>
        </div>
        <Button onClick={createBackup} disabled={creating}>
          {creating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Create Backup
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Backups</p>
              <p className="text-2xl font-bold">{backups.length}</p>
            </div>
            <HardDrive className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-2xl font-bold">
                {formatSize(backups.reduce((sum, b) => sum + b.size, 0))}
              </p>
            </div>
            <Database className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Latest Backup</p>
              <p className="text-sm font-semibold">
                {backups.length > 0 && backups[0] ? formatDate(backups[0].createdAt) : 'None'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-sm font-semibold text-green-600">All Systems OK</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Backup Information</p>
          <p>Backups are created automatically and include all database data. You can download or restore backups at any time. Restoring a backup will replace all current data.</p>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Available Backups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {backup.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {backup.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(backup.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {backups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No backups found</p>
            <p className="text-sm mt-2">Create your first backup to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BackupPage() {
  return (
    <SuperAdminOnly showUnauthorized={true}>
      <BackupPageContent />
    </SuperAdminOnly>
  );
}
