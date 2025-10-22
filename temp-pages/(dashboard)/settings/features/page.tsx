'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Settings, Lock, Unlock, Eye, EyeOff, Save, RefreshCw, AlertTriangle,
  CheckCircle, Package, Truck, BarChart3, Users, ShoppingCart, Brain,
  CreditCard, MessageSquare, Globe, Shield, Zap, Target, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  required: boolean;
  icon: string;
  dependencies: string[];
  impact: 'low' | 'medium' | 'high';
}

interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: Feature[];
}

const featureCategories: FeatureCategory[] = [
  {
    id: 'core',
    name: 'Core Features',
    description: 'Essential business functionality',
    icon: 'Settings',
    features: [
      {
        id: 'orders',
        name: 'Order Management',
        description: 'Create, track, and manage customer orders',
        category: 'core',
        enabled: true,
        required: true,
        icon: 'ShoppingCart',
        dependencies: [],
        impact: 'high'
      },
      {
        id: 'products',
        name: 'Product Catalog',
        description: 'Manage product inventory and catalog',
        category: 'core',
        enabled: true,
        required: true,
        icon: 'Package',
        dependencies: [],
        impact: 'high'
      },
      {
        id: 'customers',
        name: 'Customer Management',
        description: 'Manage customer information and relationships',
        category: 'core',
        enabled: true,
        required: true,
        icon: 'Users',
        dependencies: [],
        impact: 'high'
      }
    ]
  },
  {
    id: 'courier',
    name: 'Courier & Delivery',
    description: 'Delivery management and tracking',
    icon: 'Truck',
    features: [
      {
        id: 'courier_tracking',
        name: 'Courier Tracking',
        description: 'Real-time courier location and delivery tracking',
        category: 'courier',
        enabled: true,
        required: false,
        icon: 'Truck',
        dependencies: ['orders'],
        impact: 'high'
      },
      {
        id: 'label_printing',
        name: 'Label Printing',
        description: 'Print delivery labels and shipping documents',
        category: 'courier',
        enabled: true,
        required: false,
        icon: 'Package',
        dependencies: ['courier_tracking'],
        impact: 'medium'
      },
      {
        id: 'delivery_status',
        name: 'Delivery Status Updates',
        description: 'Automated delivery status notifications',
        category: 'courier',
        enabled: true,
        required: false,
        icon: 'CheckCircle',
        dependencies: ['courier_tracking'],
        impact: 'medium'
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Business intelligence and reporting',
    icon: 'BarChart3',
    features: [
      {
        id: 'basic_analytics',
        name: 'Basic Analytics',
        description: 'Sales and performance metrics',
        category: 'analytics',
        enabled: true,
        required: false,
        icon: 'BarChart3',
        dependencies: ['orders'],
        impact: 'medium'
      },
      {
        id: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'AI-powered insights and predictions',
        category: 'analytics',
        enabled: true,
        required: false,
        icon: 'Brain',
        dependencies: ['basic_analytics'],
        impact: 'high'
      },
      {
        id: 'custom_reports',
        name: 'Custom Reports',
        description: 'Create and schedule custom reports',
        category: 'analytics',
        enabled: false,
        required: false,
        icon: 'TrendingUp',
        dependencies: ['advanced_analytics'],
        impact: 'low'
      }
    ]
  },
  {
    id: 'payments',
    name: 'Payments & Billing',
    description: 'Payment processing and billing',
    icon: 'CreditCard',
    features: [
      {
        id: 'stripe_payments',
        name: 'Stripe Payments',
        description: 'Process payments via Stripe',
        category: 'payments',
        enabled: true,
        required: false,
        icon: 'CreditCard',
        dependencies: ['orders'],
        impact: 'high'
      },
      {
        id: 'paypal_payments',
        name: 'PayPal Payments',
        description: 'Process payments via PayPal',
        category: 'payments',
        enabled: true,
        required: false,
        icon: 'CreditCard',
        dependencies: ['orders'],
        impact: 'medium'
      },
      {
        id: 'cod_payments',
        name: 'Cash on Delivery',
        description: 'Accept cash payments on delivery',
        category: 'payments',
        enabled: true,
        required: false,
        icon: 'CreditCard',
        dependencies: ['courier_tracking'],
        impact: 'medium'
      }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Customer communication tools',
    icon: 'MessageSquare',
    features: [
      {
        id: 'email_notifications',
        name: 'Email Notifications',
        description: 'Send email notifications to customers',
        category: 'communication',
        enabled: true,
        required: false,
        icon: 'MessageSquare',
        dependencies: ['orders'],
        impact: 'medium'
      },
      {
        id: 'sms_notifications',
        name: 'SMS Notifications',
        description: 'Send SMS notifications to customers',
        category: 'communication',
        enabled: false,
        required: false,
        icon: 'MessageSquare',
        dependencies: ['email_notifications'],
        impact: 'low'
      },
      {
        id: 'whatsapp_integration',
        name: 'WhatsApp Integration',
        description: 'Send notifications via WhatsApp',
        category: 'communication',
        enabled: false,
        required: false,
        icon: 'MessageSquare',
        dependencies: ['sms_notifications'],
        impact: 'low'
      }
    ]
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Third-party service integrations',
    icon: 'Globe',
    features: [
      {
        id: 'woocommerce',
        name: 'WooCommerce Integration',
        description: 'Sync with WooCommerce stores',
        category: 'integrations',
        enabled: false,
        required: false,
        icon: 'Globe',
        dependencies: ['products'],
        impact: 'medium'
      },
      {
        id: 'facebook_shop',
        name: 'Facebook Shop',
        description: 'Sync products with Facebook Shop',
        category: 'integrations',
        enabled: false,
        required: false,
        icon: 'Globe',
        dependencies: ['products'],
        impact: 'low'
      },
      {
        id: 'google_analytics',
        name: 'Google Analytics',
        description: 'Track website analytics',
        category: 'integrations',
        enabled: false,
        required: false,
        icon: 'BarChart3',
        dependencies: [],
        impact: 'low'
      }
    ]
  }
];

const iconMap = {
  Settings, Lock, Unlock, Eye, EyeOff, Save, RefreshCw, AlertTriangle,
  CheckCircle, Package, Truck, BarChart3, Users, ShoppingCart, Brain,
  CreditCard, MessageSquare, Globe, Shield, Zap, Target, TrendingUp
};

export default function FeaturesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<FeatureCategory[]>(featureCategories);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showDependencies, setShowDependencies] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchFeatureSettings();
  }, [session, status]);

  const fetchFeatureSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/features');
      if (response.ok) {
        const data = await response.json();
        // Update categories with server data
        setCategories(data.categories || featureCategories);
      }
    } catch (error) {
      console.error('Error fetching feature settings:', error);
      toast.error('Failed to load feature settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (categoryId: string, featureId: string) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      const feature = category?.features.find(f => f.id === featureId);
      
      if (!feature || feature.required) return;

      // Check dependencies
      if (feature.enabled) {
        // Disabling feature - check if other features depend on it
        const dependentFeatures = categories
          .flatMap(c => c.features)
          .filter(f => f.dependencies.includes(featureId) && f.enabled);
        
        if (dependentFeatures.length > 0) {
          toast.error(`Cannot disable ${feature.name}. Other features depend on it.`);
          return;
        }
      } else {
        // Enabling feature - check if dependencies are met
        const unmetDependencies = feature.dependencies.filter(depId => {
          const depFeature = categories
            .flatMap(c => c.features)
            .find(f => f.id === depId);
          return !depFeature?.enabled;
        });
        
        if (unmetDependencies.length > 0) {
          toast.error(`Cannot enable ${feature.name}. Dependencies not met.`);
          return;
        }
      }

      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? {
              ...cat,
              features: cat.features.map(f => 
                f.id === featureId 
                  ? { ...f, enabled: !f.enabled }
                  : f
              )
            }
          : cat
      ));

      // Save to server
      await saveFeatureSettings(categoryId, featureId, !feature.enabled);
      
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error('Failed to update feature');
    }
  };

  const saveFeatureSettings = async (categoryId: string, featureId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          featureId,
          enabled
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save feature settings');
      }

      toast.success('Feature settings updated');
    } catch (error) {
      console.error('Error saving feature settings:', error);
      toast.error('Failed to save feature settings');
    }
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories })
      });

      if (response.ok) {
        toast.success('All feature settings saved');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving all settings:', error);
      toast.error('Failed to save all settings');
    } finally {
      setSaving(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.features.some(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory = filterCategory === 'all' || category.id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Control which features are available to your organization</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDependencies(!showDependencies)}
          >
            {showDependencies ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showDependencies ? 'Hide' : 'Show'} Dependencies
          </Button>
          <Button
            onClick={saveAllSettings}
            disabled={saving}
          >
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category) => {
          const CategoryIcon = iconMap[category.icon as keyof typeof iconMap] || Settings;
          return (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <CategoryIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {category.features.map((feature) => {
                    const FeatureIcon = iconMap[feature.icon as keyof typeof iconMap] || Package;
                    return (
                      <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            feature.enabled 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-600' 
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-400'
                          }`}>
                            <FeatureIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">{feature.name}</h3>
                              {feature.required && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full">
                                  Required
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(feature.impact)}`}>
                                {feature.impact} impact
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.description}</p>
                            
                            {showDependencies && feature.dependencies.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-500">Dependencies:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {feature.dependencies.map(depId => {
                                    const depFeature = categories
                                      .flatMap(c => c.features)
                                      .find(f => f.id === depId);
                                    return (
                                      <span key={depId} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded">
                                        {depFeature?.name || depId}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {feature.required ? (
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <Lock className="w-4 h-4 mr-1" />
                              <span className="text-sm">Locked</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleFeature(category.id, feature.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                feature.enabled 
                                  ? 'bg-blue-600' 
                                  : 'bg-gray-200 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  feature.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}