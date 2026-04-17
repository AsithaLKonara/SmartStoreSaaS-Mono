'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Lock, Globe, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Role {
  id: string;
  level: 'platform' | 'tenant' | 'portal';
  description?: string;
  permissions: string[];
}

export default function RolesPage() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'TENANT_ADMIN';

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Roles & Permissions
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Manage administrative and staff roles. Control granular access levels for each resource in your organization.
          </p>
        </div>
        
        {session?.user?.role === 'SUPER_ADMIN' && (
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 glass-dark rounded-xl animate-pulse" />
          ))
        ) : (
          roles.map((role) => (
            <div 
              key={role.id}
              className="group glass-dark rounded-xl p-6 border border-white/10 hover:border-primary/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                {role.level === 'platform' ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    <Globe className="w-3 h-3" /> System
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    <Shield className="w-3 h-3" /> Organization
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{role.id.replace('_', ' ')}</h3>
              <p className="text-sm text-slate-400 mb-6 line-clamp-2 min-h-[40px]">
                {role.description || "No description provided for this role level."}
              </p>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-3 h-3" />
                  <span>{role.permissions.length} Permissions</span>
                </div>
                
                <Link href={`/roles/${role.id}`}>
                  <Button variant="outline" size="sm" className="bg-white/5 hover:bg-white/10 border-white/10 text-white">
                    Edit Permissions
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 flex items-start gap-4">
        <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="font-semibold text-blue-200">System Security Notice</h4>
          <p className="text-sm text-blue-300/80 leading-relaxed">
            Roles designated as <strong>System</strong> level are globally defined and can only be modified by Super Admins. 
            <strong> Organization</strong> level roles can be customized per tenant by their respective administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
