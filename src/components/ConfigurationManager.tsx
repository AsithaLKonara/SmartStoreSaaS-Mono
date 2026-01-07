'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface Configuration {
  id: string;
  key: string;
  value: string;
  description: string;
  category: 'GENERAL' | 'PAYMENT' | 'EMAIL' | 'SMS' | 'INTEGRATION';
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  isRequired: boolean;
  isEncrypted: boolean;
}

export function ConfigurationManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (session) {
      fetchConfigurations();
    }
  }, [session]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuration');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setConfigurations(data.data || []);
    } catch (error) {
      logger.error({
        message: 'Failed to fetch configurations',
        error: error instanceof Error ? error : new Error(String(error))
      });
      toast.error('Failed to load configurations');
      // Fallback to basic configurations
      setConfigurations([
        {
          id: '1',
          key: 'APP_NAME',
          value: 'SmartStore SaaS',
          description: 'Application name',
          category: 'GENERAL',
          type: 'STRING',
          isRequired: true,
          isEncrypted: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = (id: string, value: string) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.id === id ? { ...config, value } : config
      )
    );
  };

  const saveConfigurations = async () => {
    try {
      setSaving(true);
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurations saved successfully');
    } catch (error) {
      logger.error({
        message: 'Failed to save configurations',
        error: error instanceof Error ? error : new Error(String(error))
      });
      toast.error('Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  const filteredConfigurations = configurations.filter(config => {
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || config.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'GENERAL', 'PAYMENT', 'EMAIL', 'SMS', 'INTEGRATION'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration Manager</h1>
          <p className="text-gray-600">Manage application settings and configurations</p>
        </div>
        <Button onClick={saveConfigurations} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Search configurations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">
            {configurations.filter(c => c.isRequired && c.value).length} / {configurations.filter(c => c.isRequired).length} required
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Configuration Settings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredConfigurations.map((config) => (
            <div key={config.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{config.key}</h3>
                    {config.isRequired && (
                      <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                        Required
                      </span>
                    )}
                    {config.isEncrypted && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                        Encrypted
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                      {config.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                  <input
                    type={config.isEncrypted ? 'password' : 'text'}
                    value={config.value}
                    onChange={(e) => updateConfiguration(config.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter ${config.key.toLowerCase()}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

