'use client';

import { useState } from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+94 77 123 4567',
    address: '123 Main Street, Colombo',
    city: 'Colombo',
    postalCode: '10100'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customer-portal/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (response.ok) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8" />
          My Profile
        </h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="w-full pl-12 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="w-full pl-12 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full pl-12 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({...profile, city: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="w-full pl-12 pr-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Postal Code</label>
            <input
              type="text"
              value={profile.postalCode}
              onChange={(e) => setProfile({...profile, postalCode: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Notification Preferences
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

