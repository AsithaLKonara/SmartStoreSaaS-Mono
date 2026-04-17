import React from 'react';

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-indigo-950 text-white">
      <h1 className="text-4xl font-bold mb-4">Superadmin Platform</h1>
      <p className="text-indigo-200 text-lg">System-wide management and marketplace operations.</p>
      <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
        <p className="text-sm font-mono opacity-50 text-indigo-300">Admin subdomain detected correctly.</p>
      </div>
    </div>
  );
}
