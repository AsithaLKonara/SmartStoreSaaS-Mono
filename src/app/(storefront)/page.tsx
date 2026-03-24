import React from 'react';

export default function StorefrontPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
      <h1 className="text-4xl font-bold mb-4 text-gradient">Welcome to the Storefront</h1>
      <p className="text-slate-400 text-lg">Powered by SmartStore Commerce OS</p>
      <div className="mt-8 p-6 glass-dark border-white/10 rounded-2xl">
        <p className="text-sm font-mono opacity-50">Subdomain detected correctly.</p>
      </div>
    </div>
  );
}
