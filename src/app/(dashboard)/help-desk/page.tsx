'use client';

import React, { useState, useEffect } from 'react';
import { HeadphonesIcon, Search, Filter, MoreVertical, Ticket as TicketIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import Link from 'next/link';

interface SupportTicket {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  email: string;
  createdAt: string;
  assignedTo?: string;
}

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    OPEN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
    RESOLVED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    CLOSED: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const priorityColors = {
    LOW: 'text-slate-500',
    MEDIUM: 'text-sky-500',
    HIGH: 'text-amber-500',
    URGENT: 'text-rose-600 font-bold'
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <HeadphonesIcon className="w-8 h-8 text-indigo-600" />
            Support Helpdesk
          </h1>
          <p className="text-slate-500 mt-1">Manage and resolve customer inquiries and portal tickets.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects, emails, or IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto rounded-xl border-slate-200">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <EmptyState 
            icon={TicketIcon}
            title="No Support Tickets Found"
            description={searchTerm ? "No tickets match your search criteria." : "You have no active support tickets in your queue."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Ticket Info</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Priority</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Customer</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link href={`/support/${ticket.id}`} className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors max-w-sm truncate">
                          {ticket.title}
                        </Link>
                        <span className="text-xs text-slate-400 font-mono mt-1 w-32 truncate">{ticket.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold text-xs uppercase tracking-wider ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{ticket.email || 'Anonymous'}</span>
                        <span className="text-xs text-slate-400">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/support/${ticket.id}`}>
                        <Button variant="outline" size="sm" className="rounded-lg shadow-sm border-slate-200 hover:border-indigo-300">
                          Resolve
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
