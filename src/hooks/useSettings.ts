import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface OrganizationSettings {
  id: string;
  name: string;
  domain: string | null;
  plan: string;
  status: string;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AISettings {
  recommendationEngine: {
    limit: number;
    threshold: number;
    collaborativeFiltering: boolean;
    contentBasedFiltering: boolean;
  };
  predictiveAnalytics: {
    forecastPeriod: number;
    confidenceLevel: number;
    demandForecast: boolean;
    churnPrediction: boolean;
  };
  marketingAutomation: {
    abandonedCart: boolean;
    birthdayCampaigns: boolean;
    reEngagement: boolean;
  };
}

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    expiryDays: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  mfa: {
    enabled: boolean;
    requiredForAdmin: boolean;
  };
  session: {
    timeout: number;
    maxConcurrent: number;
  };
}

interface NotificationSettings {
  email: {
    orderUpdates: boolean;
    inventoryAlerts: boolean;
    analyticsReports: boolean;
    marketingCampaigns: boolean;
  };
  sms: {
    orderConfirmations: boolean;
    deliveryUpdates: boolean;
  };
  push: {
    realTimeAlerts: boolean;
    aiInsights: boolean;
  };
}

interface BillingData {
  currentPlan: {
    name: string;
    price: string;
    features: string[];
    status: string;
    nextBilling: string;
  };
  usage: {
    users: number;
    maxUsers: number;
    products: string;
    aiFeatures: string;
    support: string;
  };
  paymentMethods: any[];
  billingHistory: any[];
  settings: {
    autoRenew: boolean;
    invoiceEmail: string;
  };
}

interface Integrations {
  wooCommerce: any[];
  whatsApp: any[];
  couriers: any[];
}

export function useSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [integrations, setIntegrations] = useState<Integrations | null>(null);

  // Fetch organization settings
  const fetchOrganizationSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/organization');
      if (!response.ok) throw new Error('Failed to fetch organization settings');
      const data = await response.json();
      setOrganization(data);
    } catch (err) {
      console.error('Error fetching organization settings:', err);
      setError('Failed to fetch organization settings');
    }
  }, []);

  // Update organization settings
  const updateOrganizationSettings = useCallback(async (data: Partial<OrganizationSettings>) => {
    try {
      const response = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update organization settings');
      
      const updatedData = await response.json();
      setOrganization(updatedData);
      toast.success('Organization settings updated successfully');
      return updatedData;
    } catch (err) {
      console.error('Error updating organization settings:', err);
      toast.error('Failed to update organization settings');
      throw err;
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  }, []);

  // Create user
  const createUser = useCallback(async (userData: { name: string; email: string; password: string; role: string }) => {
    try {
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      
      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev]);
      toast.success('User created successfully');
      return newUser;
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error('Failed to create user');
      throw err;
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    try {
      const response = await fetch('/api/settings/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...userData })
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      
      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      toast.success('User updated successfully');
      return updatedUser;
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('Failed to update user');
      throw err;
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/settings/users?id=${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deactivated successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
      throw err;
    }
  }, []);

  // Fetch AI settings
  const fetchAISettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/ai');
      if (!response.ok) throw new Error('Failed to fetch AI settings');
      const data = await response.json();
      setAiSettings(data);
    } catch (err) {
      console.error('Error fetching AI settings:', err);
      setError('Failed to fetch AI settings');
    }
  }, []);

  // Update AI settings
  const updateAISettings = useCallback(async (data: AISettings) => {
    try {
      const response = await fetch('/api/settings/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update AI settings');
      
      setAiSettings(data);
      toast.success('AI settings updated successfully');
    } catch (err) {
      console.error('Error updating AI settings:', err);
      toast.error('Failed to update AI settings');
      throw err;
    }
  }, []);

  // Fetch security settings
  const fetchSecuritySettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/security');
      if (!response.ok) throw new Error('Failed to fetch security settings');
      const data = await response.json();
      setSecuritySettings(data);
    } catch (err) {
      console.error('Error fetching security settings:', err);
      setError('Failed to fetch security settings');
    }
  }, []);

  // Update security settings
  const updateSecuritySettings = useCallback(async (data: SecuritySettings) => {
    try {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update security settings');
      
      setSecuritySettings(data);
      toast.success('Security settings updated successfully');
    } catch (err) {
      console.error('Error updating security settings:', err);
      toast.error('Failed to update security settings');
      throw err;
    }
  }, []);

  // Fetch notification settings
  const fetchNotificationSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) throw new Error('Failed to fetch notification settings');
      const data = await response.json();
      setNotificationSettings(data);
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setError('Failed to fetch notification settings');
    }
  }, []);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (data: NotificationSettings) => {
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update notification settings');
      
      setNotificationSettings(data);
      toast.success('Notification settings updated successfully');
    } catch (err) {
      console.error('Error updating notification settings:', err);
      toast.error('Failed to update notification settings');
      throw err;
    }
  }, []);

  // Fetch billing data
  const fetchBillingData = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/billing');
      if (!response.ok) throw new Error('Failed to fetch billing data');
      const data = await response.json();
      setBillingData(data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to fetch billing data');
    }
  }, []);

  // Update billing settings
  const updateBillingSettings = useCallback(async (data: { autoRenew: boolean; invoiceEmail: string }) => {
    try {
      const response = await fetch('/api/settings/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update billing settings');
      
      setBillingData(prev => prev ? { ...prev, settings: { ...prev.settings, ...data } } : null);
      toast.success('Billing settings updated successfully');
    } catch (err) {
      console.error('Error updating billing settings:', err);
      toast.error('Failed to update billing settings');
      throw err;
    }
  }, []);

  // Fetch integrations
  const fetchIntegrations = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Failed to fetch integrations');
    }
  }, []);

  // Update integration
  const updateIntegration = useCallback(async (integrationType: string, integrationId: string, action: string, data?: any) => {
    try {
      const response = await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationType, integrationId, action, data })
      });
      
      if (!response.ok) throw new Error('Failed to update integration');
      
      const result = await response.json();
      toast.success(result.message);
      
      // Refresh integrations data
      await fetchIntegrations();
      
      return result;
    } catch (err) {
      console.error('Error updating integration:', err);
      toast.error('Failed to update integration');
      throw err;
    }
  }, [fetchIntegrations]);

  // Load all settings on mount
  useEffect(() => {
    if (session?.user?.organizationId) {
      const loadAllSettings = async () => {
        setLoading(true);
        setError(null);
        
        try {
          await Promise.all([
            fetchOrganizationSettings(),
            fetchUsers(),
            fetchAISettings(),
            fetchSecuritySettings(),
            fetchNotificationSettings(),
            fetchBillingData(),
            fetchIntegrations()
          ]);
        } catch (err) {
          console.error('Error loading settings:', err);
        } finally {
          setLoading(false);
        }
      };

      loadAllSettings();
    }
  }, [
    session?.user?.organizationId,
    fetchOrganizationSettings,
    fetchUsers,
    fetchAISettings,
    fetchSecuritySettings,
    fetchNotificationSettings,
    fetchBillingData,
    fetchIntegrations
  ]);

  return {
    // State
    loading,
    error,
    organization,
    users,
    aiSettings,
    securitySettings,
    notificationSettings,
    billingData,
    integrations,

    // Actions
    updateOrganizationSettings,
    createUser,
    updateUser,
    deleteUser,
    updateAISettings,
    updateSecuritySettings,
    updateNotificationSettings,
    updateBillingSettings,
    updateIntegration,

    // Refresh functions
    refreshOrganization: fetchOrganizationSettings,
    refreshUsers: fetchUsers,
    refreshAISettings: fetchAISettings,
    refreshSecuritySettings: fetchSecuritySettings,
    refreshNotificationSettings: fetchNotificationSettings,
    refreshBillingData: fetchBillingData,
    refreshIntegrations: fetchIntegrations
  };
}
