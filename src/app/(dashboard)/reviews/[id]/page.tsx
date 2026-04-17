'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  MessageSquare, 
  Star,
  User,
  Clock,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    id: string;
  };
  moderationNote?: string;
}

export default function ReviewModerationPage({ params }: { params: { id: string } }) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [moderationNote, setModerationNote] = useState('');

  useEffect(() => {
    // Bridging API: api/reviews/[id]
    const fetchReview = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReview({
          id: params.id,
          rating: 1,
          comment: "This product is a total scam. It broke after two days and the seller is not responding. AVOID AT ALL COSTS!!!",
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          customer: { name: 'Gihan Perera', email: 'gihan@example.com' },
          product: { name: 'SmartHub Controller Pro', id: 'prod-99' }
        });
      } catch (error) {
        toast.error('Failed to retrieve moderation unit');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [params.id]);

  const handleModeration = async (status: 'APPROVED' | 'REJECTED') => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Content ${status.toLowerCase()} and removed from queue`);
      setReview(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      toast.error('Moderation gateway error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Initializing moderation sandbox...</div>;
  if (!review) return <div className="p-12 text-center text-slate-500">Review manifest not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/reviews" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4" /> Operations Backlog
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
             <ShieldAlert className="w-8 h-8 text-rose-500" />
             Content Moderation: #{review.id.slice(0, 6)}
          </h1>
          <p className="text-slate-400 mt-1">Vet user-generated sentiment to ensure platform compliance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 p-8 shadow-2xl space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                     <User className="w-6 h-6 text-slate-500" />
                   </div>
                   <div>
                      <p className="text-sm font-black text-white">{review.customer.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{review.customer.email}</p>
                   </div>
                </div>
                <div className="flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                   ))}
                </div>
              </div>

              <div className="bg-white/2 rounded-3xl p-8 border border-white/5 relative">
                 <MessageSquare className="absolute -top-3 -left-3 w-8 h-8 text-indigo-500/20" />
                 <p className="text-lg font-medium text-slate-200 leading-relaxed italic">
                    "{review.comment}"
                 </p>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Moderator Response / Internal Note</h3>
                 <Textarea 
                    placeholder="Document the rationale for approval or rejection..." 
                    className="bg-white/5 border-white/5 text-white min-h-[120px] rounded-2xl focus:ring-indigo-500/50 p-6"
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                 />
              </div>

              <div className="pt-8 border-t border-white/5 flex gap-4">
                 <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-emerald-600/20"
                    onClick={() => handleModeration('APPROVED')}
                    disabled={isProcessing || review.status !== 'PENDING'}
                 >
                    {isProcessing ? <RefreshCw className="mr-2 animate-spin w-4 h-4" /> : <CheckCircle2 className="mr-2 w-4 h-4" />}
                    Approve Content
                 </Button>
                 <Button 
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-rose-600/20"
                    onClick={() => handleModeration('REJECTED')}
                    disabled={isProcessing || review.status !== 'PENDING'}
                 >
                    {isProcessing ? <RefreshCw className="mr-2 animate-spin w-4 h-4" /> : <XCircle className="mr-2 w-4 h-4" />}
                    Reject & Archive
                 </Button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-xl space-y-8">
              <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Metadata</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase">Received</p>
                       <p className="text-xs font-black text-white">{formatDate(review.createdAt)}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Flag className="w-5 h-5 text-slate-500" />
                    <div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase">Target Entity</p>
                       <p className="text-xs font-black text-white">{review.product.name}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase">Sentiment Score</p>
                       <p className="text-xs font-black text-rose-400">0.12 (Very Negative)</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-rose-600 rounded-[2rem] p-8 text-white space-y-4 shadow-2xl relative overflow-hidden group hover:bg-rose-700 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">Nuclear Option</h3>
                 <Trash2 className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-black leading-snug">Permanently blacklist customer from submitting future reviews.</p>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                 Execute Ban <AlertTriangle className="w-3 h-3 text-amber-300" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
