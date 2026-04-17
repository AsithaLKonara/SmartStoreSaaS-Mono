'use client';

import React from 'react';

export function TableSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-white/5 rounded-lg"></div>
          <div className="h-4 w-64 bg-white/5 rounded-lg"></div>
        </div>
        <div className="h-10 w-32 bg-white/5 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5"></div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="h-16 bg-white/5 border-b border-white/5"></div>
        <div className="p-8 space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/5 rounded"></div>
                  <div className="h-3 w-20 bg-white/5 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-24 bg-white/5 rounded"></div>
              <div className="h-4 w-12 bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-6">
      <div className="h-6 w-32 bg-white/5 rounded mb-4"></div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-white/5 rounded-xl"></div>
        <div className="h-10 w-64 bg-white/5 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-[2.5rem] border border-white/5"></div>
        <div className="space-y-6">
          <div className="h-[250px] bg-white/5 rounded-[2.5rem] border border-white/5"></div>
          <div className="h-[150px] bg-white/5 rounded-[2rem] border border-white/5"></div>
        </div>
      </div>
    </div>
  );
}
