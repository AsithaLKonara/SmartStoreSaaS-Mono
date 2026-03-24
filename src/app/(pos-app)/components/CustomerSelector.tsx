'use client';

import React, { useState } from 'react';
import { usePOS } from '../hooks/usePOS';
import { User, Search, PlusCircle, UserX } from 'lucide-react';

export function CustomerSelector() {
  const { currentCustomer, setCurrentCustomer } = usePOS();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      // Simulate API call to search customer
      setCurrentCustomer({
        id: 'cust_' + Math.floor(Math.random() * 1000),
        name: search,
        email: `${search.toLowerCase().replace(' ', '.')}@example.com`,
        loyaltyPoints: 1250,
      });
      setSearch('');
    }
  };

  if (currentCustomer) {
    return (
      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
            {currentCustomer.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{currentCustomer.name}</h4>
            <div className="text-xs text-indigo-600 flex space-x-2">
              <span>{currentCustomer.email}</span>
              <span>•</span>
              <span className="font-bold">{currentCustomer.loyaltyPoints} pts</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setCurrentCustomer(null)}
          className="text-slate-400 hover:text-red-500 hover:bg-slate-100 p-2 rounded-full transition-colors"
        >
          <UserX className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search Customer / Walk in..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
        />
        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors">
          <PlusCircle className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
