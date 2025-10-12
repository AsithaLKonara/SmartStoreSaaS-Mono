'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleTag?: string;
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'TENANT_ADMIN', roleTag: ''
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data.data || []);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('User created');
        setShowForm(false);
        fetchUsers();
      }
    } catch (error) { toast.error('Failed'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="w-8 h-8" />User Management</h1>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add User</Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Create User</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="px-4 py-2 border rounded" />
            <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="px-4 py-2 border rounded" />
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="px-4 py-2 border rounded">
              <option value="SUPER_ADMIN">Super Admin</option>
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
            <Button onClick={handleSubmit}>Create User</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{user.role}</span></td>
                <td className="px-6 py-4">{user.roleTag || '-'}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

