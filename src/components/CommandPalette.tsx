'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Terminal, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  LayoutDashboard,
  Bell,
  Key as KeyIcon,
  HelpCircle,
  Plus
} from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const commands = [
    { id: 'dash', title: 'Dashboard', icon: LayoutDashboard, category: 'Navigation', route: '/dashboard' },
    { id: 'orders', title: 'View Orders', icon: ShoppingCart, category: 'Commerce', route: '/orders' },
    { id: 'prod-new', title: 'Create New Product', icon: Plus, category: 'Actions', route: '/products/new' },
    { id: 'cust', title: 'Manage Customers', icon: Users, category: 'CRM', route: '/customers' },
    { id: 'inv', title: 'Inventory Levels', icon: Package, category: 'Operations', route: '/inventory' },
    { id: 'api', title: 'Developer API Keys', icon: KeyIcon, category: 'Security', route: '/api-keys' },
    { id: 'notif', title: 'Notifications', icon: Bell, category: 'System', route: '/notifications' },
    { id: 'settings', title: 'Settings', icon: Settings, category: 'Global', route: '/settings' },
    { id: 'help', title: 'Documentation', icon: HelpCircle, category: 'Support', route: '/docs' },
  ];

  const filteredCommands = query === '' 
    ? commands 
    : commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) || 
        cmd.category.toLowerCase().includes(query.toLowerCase())
      );

  const togglePalette = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', togglePalette);
    return () => document.removeEventListener('keydown', togglePalette);
  }, [togglePalette]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl glass-dark border border-white/10 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-white/5">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg"
            placeholder="Type a command or search platform..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400 uppercase font-bold">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            Object.entries(
              filteredCommands.reduce((acc, cmd) => {
                const category = cmd.category || 'General';
                if (!acc[category]) acc[category] = [];
                acc[category].push(cmd);
                return acc;
              }, {} as Record<string, typeof commands>)
            ).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-3 py-2 text-[10px] uppercase font-black tracking-widest text-slate-500">{category}</div>
                <div className="space-y-1">
                  {items.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        router.push(cmd.route);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        <cmd.icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{cmd.title}</span>
                      <Terminal className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-20" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-500">No commands found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-wider">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><Terminal className="w-3 h-3 mr-1" /> Navigation</span>
            <span className="flex items-center"><Search className="w-3 h-3 mr-1" /> Search</span>
          </div>
          <span>SmartStore Spotlight 3.5.0</span>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
}
