'use client';

import { useState } from 'react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Organizations</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalOrganizations}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
          <p className="text-3xl font-bold text-orange-600">LKR {stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>
        <p className="text-gray-600">
          Welcome to the SmartStore SaaS Admin Dashboard. This is where you can manage 
          the entire platform, monitor system health, and oversee all organizations.
        </p>
      </div>
    </div>
  );
}

