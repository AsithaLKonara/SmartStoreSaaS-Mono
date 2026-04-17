'use client';

import React, { useState, useEffect } from 'react';
import { Users, Filter, Plus, UserPlus, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  isActive: boolean;
  createdAt: string;
}

export default function CustomerSegments() {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const res = await fetch('/api/customers/segments');
      
      // Handle the fact that this API might not be fully wired up yet based on the gap report
      if (res.status === 404) {
        setApiError(true);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setSegments(data.data);
      }
    } catch (err) {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Filter className="w-8 h-8 text-indigo-600" />
            Audience Segments
          </h1>
          <p className="text-slate-500 mt-1">Group and organize your customers for targeted marketing campaigns.</p>
        </div>
        <Button className="rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 font-bold px-6">
          <Plus className="w-4 h-4 mr-2" /> Create Segment
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 text-center text-slate-500 animate-pulse font-medium">Loading segments...</div>
        ) : apiError ? (
          <EmptyState 
            icon={ServerCrash}
            title="Backend Integration Missing"
            description="The Audiences API is currently unlinked or undergoing expansion. Segments cannot be fetched at this time."
            actionLabel="View Raw Customers"
            actionHref="/customers"
          />
        ) : segments.length === 0 ? (
          <EmptyState 
            icon={Users}
            title="No Segments Configured"
            description="You haven't created any customer segments yet. Group customers by spending habits, demographics, or activity."
            actionLabel="Create First Segment"
            onAction={() => {}} // Hooked up to modal later
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {segments.map((segment) => (
              <div key={segment.id} className="border border-slate-200 rounded-2xl p-6 relative group hover:border-indigo-300 transition-colors shadow-sm hover:shadow-md cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-3 h-3 rounded-full mt-1 ${segment.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-xs font-mono text-slate-400">ID: {segment.id.slice(0, 8)}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
                  {segment.name}
                </h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  {segment.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Dynamic
                  </span>
                  <span className="text-xs text-slate-400">{format(new Date(segment.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
