'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  replies?: Array<{
    id: string;
    message: string;
    author: string;
    createdAt: string;
  }>;
}

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function CustomerSupportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM' as const,
  });
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer-portal/support');
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || data.data || []);
      }
    } catch (error) {
      logger.error({
        message: 'Error fetching tickets',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { component: 'CustomerSupportPage' }
      });
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/customer-portal/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });

      if (!response.ok) throw new Error('Failed to create ticket');

      const data = await response.json();
      toast.success('Support ticket created successfully');
      setTickets([data.ticket || data.data, ...tickets]);
      setNewTicket({ subject: '', description: '', priority: 'MEDIUM' });
      setShowCreateForm(false);
    } catch (error) {
      logger.error({
        message: 'Error creating ticket',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { component: 'CustomerSupportPage' }
      });
      toast.error('Failed to create support ticket');
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const response = await fetch(`/api/customer-portal/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!response.ok) throw new Error('Failed to send reply');

      toast.success('Reply sent successfully');
      setReplyMessage('');
      await fetchTickets();
    } catch (error) {
      logger.error({
        message: 'Error sending reply',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { component: 'CustomerSupportPage', ticketId }
      });
      toast.error('Failed to send reply');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get help with your orders and account
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'Create Ticket'}
        </Button>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Support Ticket
          </h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Brief description of your issue"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Provide detailed information about your issue..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No support tickets yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first support ticket to get help
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ticket.subject}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    #{ticket.ticketNumber}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Created {formatDate(ticket.createdAt)}
                  </p>
                </div>
                <MessageSquare className="w-6 h-6 text-gray-400" />
              </div>

              {/* Expanded View */}
              {selectedTicket?.id === ticket.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Replies */}
                  {ticket.replies && ticket.replies.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Conversation ({ticket.replies.length})
                      </h4>
                      <div className="space-y-3">
                        {ticket.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {reply.author}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reply.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Form */}
                  {ticket.status !== 'CLOSED' && (
                    <div className="flex gap-2">
                      <Input
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(ticket.id);
                          }
                        }}
                      />
                      <Button onClick={() => handleReply(ticket.id)}>
                        <Send className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

