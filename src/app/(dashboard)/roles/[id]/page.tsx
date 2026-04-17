'use client';

import { useState, useEffect } from 'react';
import { Shield, ChevronLeft, Save, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PermissionEntry {
  id: string;
  action: string;
  scope: string;
}

interface Role {
  id: string;
  level: string;
  description: string;
  permissions: string[];
}

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Record<string, PermissionEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/roles/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        setAllPermissions(data.allPermissions);
      } else {
        toast.error('Role not found');
      }
    } catch (error) {
      toast.error('Failed to load role details');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    if (!role) return;
    
    if (role.level === 'platform' && session?.user?.role !== 'SUPER_ADMIN') {
      toast.error('Only Super Admins can modify system roles');
      return;
    }

    const newPermissions = role.permissions.includes(permId)
      ? role.permissions.filter(p => p !== permId)
      : [...role.permissions, permId];
    
    setRole({ ...role, permissions: newPermissions });
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role)
      });
      if (res.ok) {
        toast.success('Permissions updated successfully');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Save failed');
      }
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><div className="h-64 glass-dark rounded-xl animate-pulse" /></div>;
  if (!role) return <div className="p-8 text-white">Role not found.</div>;

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/roles">
            <Button variant="outline" size="icon" className="glass-dark border-white/10 text-white hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              {role.id.replace('_', ' ')}
            </h1>
            <p className="text-slate-400">Configure access levels and granular permissions.</p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
        >
          {saving ? 'Saving...' : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-dark rounded-xl p-6 border border-white/10 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Role Identity
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:border-primary/50 outline-none transition-all resize-none h-24"
                value={role.description}
                onChange={(e) => setRole({...role, description: e.target.value})}
                placeholder="Describe role purpose..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Level</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300">
                {role.level === 'platform' ? <Lock className="w-4 h-4 text-red-400" /> : <Shield className="w-4 h-4 text-green-400" />}
                <span className="capitalize">{role.level} Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(allPermissions).map(([category, perms]) => (
            <div key={category} className="glass-dark rounded-xl border border-white/10 overflow-hidden">
              <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/5">
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">{category}</h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  {perms.filter(p => role.permissions.includes(p.id)).length} / {perms.length} Active
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {perms.map((p) => {
                  const isActive = role.permissions.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePermission(p.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 group
                        ${isActive 
                          ? 'bg-primary/10 border-primary/30 text-white' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
                        }
                      `}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-300'}`}>
                          {p.action.charAt(0).toUpperCase() + p.action.slice(1)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{p.id}</span>
                      </div>
                      
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all
                        ${isActive ? 'bg-primary text-white' : 'bg-white/10 text-slate-600 group-hover:bg-white/20'}
                      `}>
                        {isActive && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
