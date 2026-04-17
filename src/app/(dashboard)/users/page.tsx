'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Shield, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleTag?: string;
  isActive: boolean;
}
export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'STAFF', roleTag: ''
  });

  const currentUserRole = session?.user?.role || 'STAFF';
  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'TENANT_ADMIN';

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data.data || []);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching users',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users';
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(editingId ? 'User updated' : 'User created');
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', email: '', password: '', role: 'STAFF', roleTag: '' });
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Operation failed');
      }
    } catch (error) { toast.error('Failed'); }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't show password
      role: user.role,
      roleTag: user.roleTag || ''
    });
    setShowForm(true);
  };

  const toggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.ok) {
        toast.success('Status updated');
        fetchUsers();
      }
    } catch (error) { toast.error('Update failed'); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deactivated');
        fetchUsers();
      }
    } catch (error) { toast.error('Operation failed'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="w-8 h-8" />User Management</h1>
        {isAdmin && (
          <Button onClick={() => {
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', role: 'STAFF', roleTag: '' });
            setShowForm(!showForm);
          }}>
            <Plus className="w-4 h-4 mr-2" />Add User
          </Button>
        )}
      </div>

      {showForm && (
        <div className="glass-dark p-6 rounded-lg shadow border border-white/10 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit User' : 'Create User'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="px-4 py-2 border rounded" />
            <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="px-4 py-2 border rounded" />
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="px-4 py-2 border rounded">
              {currentUserRole === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="STAFF">Staff</option>
              <option value="CUSTOMER">Customer</option>
            </select>
            {formData.role === 'STAFF' && (
              <select value={formData.roleTag} onChange={e => setFormData({...formData, roleTag: e.target.value})} className="px-4 py-2 border rounded col-span-2">
                <option value="">Select Staff Role</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="sales_executive">Sales Executive</option>
                <option value="finance_officer">Finance Officer</option>
                <option value="marketing_manager">Marketing Manager</option>
                <option value="support_agent">Support Agent</option>
                <option value="hr_manager">HR Manager</option>
              </select>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSubmit}>{editingId ? 'Update User' : 'Create User'}</Button>
            <Button variant="outline" onClick={() => {
              setShowForm(false);
              setEditingId(null);
            }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="glass-dark rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">{user.roleTag || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {isAdmin && (
                   <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startEdit(user)}
                      className="text-primary hover:text-white hover:bg-primary/20 border-white/10"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleStatus(user)}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className={`w-4 h-4 ${user.isActive ? 'text-orange-500' : 'text-green-500'}`} />
                    </Button>
                    {currentUserRole === 'SUPER_ADMIN' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteUser(user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

