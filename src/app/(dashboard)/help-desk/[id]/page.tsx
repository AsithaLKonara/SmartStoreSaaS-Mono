'use client';

import React, { useState, useEffect } from 'react';
import { HeadphonesIcon, Send, ArrowLeft, Clock, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SupportTicketDetail() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setTicket(data.data);
      } else {
        toast.error('Ticket not found');
        router.push('/support');
      }
    } catch (err) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async () => {
    if (!replyMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      });
      if (res.ok) {
        setReplyMessage('');
        fetchTicket(); // Refresh chat
        toast.success('Reply sent successfully');
      }
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeTicket = async () => {
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      if (res.ok) {
        toast.success('Ticket marked as resolved');
        fetchTicket();
      }
    } catch (err) {
      toast.error('Failed to close ticket');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading secure chat...</div>;
  if (!ticket) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 mb-8">
        <Link href="/support" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-500" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{ticket.title}</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
              ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {ticket.status}
            </span>
          </div>
          <p className="text-sm font-mono text-slate-500 mt-1">ID: {ticket.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chat / Thread */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* Original Post */}
              <div className="flex bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-bold uppercase mr-4">
                  {ticket.email ? ticket.email.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-slate-900">{ticket.email || 'Anonymous Customer'}</span>
                    <span className="text-xs text-slate-400">{format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">{ticket.description}</p>
                </div>
              </div>

              {/* Replies */}
              {ticket.replies?.map((reply: any) => {
                const isStaff = !reply.isInternal; // Assuming merchant replies are external facing but from staff auth
                return (
                  <div key={reply.id} className={`flex ${isStaff ? 'flex-row-reverse' : ''} gap-4`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold uppercase text-xs ${
                      isStaff ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {reply.authorName ? reply.authorName.charAt(0) : 'S'}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      isStaff ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'
                    }`}>
                      <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                        <span className="font-bold">{reply.authorName || 'Staff'}</span>
                        <span>{format(new Date(reply.createdAt), 'h:mm a')}</span>
                      </div>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isStaff ? 'text-white' : 'text-slate-700'}`}>
                        {reply.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2 relative">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 min-h-[50px] max-h-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm font-medium"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitReply();
                      }
                    }}
                  />
                  <div className="absolute right-2 bottom-2">
                    <Button 
                      onClick={submitReply}
                      disabled={isSubmitting || !replyMessage.trim()}
                      className="rounded-xl w-10 h-10 p-0 shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium text-right mt-2 uppercase tracking-widest">Shift + Enter for new line</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Ticket Metadata
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Priority</span>
                <span className={`font-bold uppercase tracking-widest text-[10px] px-2 py-1 rounded ${
                  ticket.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-xs flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">{ticket.email}</span>
              </div>
              <div className="flex justify-between items-center pb-4">
                <span className="text-slate-500 font-medium text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Created
                </span>
                <span className="font-bold text-slate-900">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
               <Button 
                onClick={closeTicket}
                variant="outline"
                className="w-full mt-6 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-bold flex items-center justify-center gap-2 transition-all"
               >
                 <CheckCircle2 className="w-4 h-4" />
                 Mark as Resolved
               </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
