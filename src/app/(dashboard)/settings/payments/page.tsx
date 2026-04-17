'use client';

import { useState } from 'react';
import { CreditCard, Shield, Landmark, Wallet, Check, Settings2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function PaymentSettingsPage() {
  const [activeGateway, setActiveGateway] = useState('stripe');

  const gateways = [
    { id: 'stripe', name: 'Stripe', icon: CreditCard, status: 'Active', description: 'Credit/Debit cards, Apple Pay, Google Pay' },
    { id: 'paypal', name: 'PayPal', icon: Wallet, status: 'Inactive', description: 'Express Checkout and Venmo' },
    { id: 'bank', name: 'Bank Transfer', icon: Landmark, status: 'Active', description: 'Manual wire transfer with invoice verification' }
  ];

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <CreditCard className="w-10 h-10 text-primary" />
          Payment Configuration
        </h1>
        <p className="text-slate-400">
          Configure how your customers pay. Securely manage gateways and currency settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gateway List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">Available Gateways</h3>
          {gateways.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGateway(g.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group
                ${activeGateway === g.id 
                  ? 'glass-dark border-primary bg-primary/5' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all
                  ${activeGateway === g.id ? 'bg-primary text-white' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'}
                `}>
                  <g.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{g.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                      ${g.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}
                    `}>
                      {g.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-dark rounded-xl border border-white/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Settings2 className="w-6 h-6" />
               </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Lock className="w-4 h-4" />
                <span className="uppercase text-xs tracking-[0.2em]">{activeGateway} Settings (Encrypted)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Environment</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none">
                    <option>Production</option>
                    <option>Sandbox / Testing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Default Currency</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                    <option>LKR (Rs.)</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400">Public API Key</label>
                  <input type="password" value="pk_live_************************" readOnly className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/50 cursor-not-allowed" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400">Webhook Secret</label>
                  <input type="password" value="whsec_************************" readOnly className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/50 cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                <Button variant="outline" className="glass-dark border-white/10 text-white">Reset Credentials</Button>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">Save Configuration</Button>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6 flex items-start gap-4">
            <Shield className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
            <div className="space-y-1">
              <h4 className="font-semibold text-orange-200 uppercase text-xs tracking-wider">PCI Compliance Policy</h4>
              <p className="text-sm text-orange-300/70 leading-relaxed">
                Tokens and secrets are never stored in plaintext within the SmartStore database. All PCI-sensitive data is processed directly via the gateway provider's secure vaulting systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
