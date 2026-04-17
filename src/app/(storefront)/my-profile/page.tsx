'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, ArrowRight, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customer-portal/account');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customer-portal/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          postalCode: profile.postalCode
        })
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
    <div className="max-w-4xl mx-auto space-y-12 py-10 px-4 md:px-0">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-xl">
            <User className="w-8 h-8 text-primary" />
          </div>
          My <span className="text-gradient">Profile</span>
        </h1>
        <p className="text-white/40 mt-2 ml-16">Manage your premium account identity and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-dark rounded-3xl border border-white/5 p-8 space-y-8">
            <h2 className="text-xl font-bold text-white">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Display Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                <div className="relative group text-white/40">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-40" />
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-white/2 border border-white/5 rounded-xl pl-12 pr-4 py-3 cursor-not-allowed italic"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono tracking-tighter">Verified</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Permanent Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-4 text-white/20 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <textarea
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={profile.postalCode}
                  onChange={(e) => setProfile({...profile, postalCode: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all glow active:scale-95 flex items-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <div className="loading-spinner w-4 h-4 !border-white" />
                ) : (
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
                {loading ? 'Processing...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="glass-dark rounded-3xl border border-white/10 p-8 space-y-6 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
             <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent p-1">
                <div className="w-full h-full rounded-full bg-[#0e0918] flex items-center justify-center text-3xl font-black">
                   {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
             </div>
             <div>
                <h3 className="text-xl font-bold">{profile.name}</h3>
                <p className="text-[10px] font-mono tracking-widest text-white/30 uppercase mt-1">Premium Member since 2025</p>
             </div>
          </div>

          <div className="glass-dark rounded-3xl border border-white/5 p-8 space-y-6">
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-5 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-sm font-medium transition-all hover:bg-white/10 flex items-center justify-between group">
                Change Password
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
              </button>
              <button className="w-full text-left px-5 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-sm font-medium transition-all hover:bg-white/10 flex items-center justify-between group">
                2FA Security
                <Shield className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
              </button>
              <button className="w-full text-left px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:border-red-500 text-sm font-medium text-red-500 transition-all hover:bg-red-500/20 flex items-center justify-between group">
                Terminate Account
                <Trash2 className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

