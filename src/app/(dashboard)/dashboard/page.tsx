'use client';

export const dynamic = 'force-dynamic';
import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">SmartStore SaaS Dashboard</p>
      </div>
    </div>
  );
}
