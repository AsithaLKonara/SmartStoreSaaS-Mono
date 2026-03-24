'use client';

import React, { useState } from 'react';
import { Search, ScanLine } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function BarcodeScanner() {
  const [query, setQuery] = useState('');

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Simulate API call or local search for product by barcode
      console.log('Scanned barcode:', query);
      setQuery(''); // reset after scan
    }
  };

  return (
    <form onSubmit={handleScan} className="flex items-center space-x-2 relative">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Scan barcode or search products..."
          className="pl-10 h-12 text-lg rounded-xl bg-slate-100 border-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 rounded-xl shrink-0 cursor-pointer text-indigo-600 hover:bg-indigo-100 transition-colors">
        <ScanLine className="w-6 h-6" />
      </div>
    </form>
  );
}
