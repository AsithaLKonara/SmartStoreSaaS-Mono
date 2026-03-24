'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';

const mfaSchema = z.object({
  code: z.string().min(6, 'Code must be at least 6 characters').max(10),
});

type MfaFormData = z.infer<typeof mfaSchema>;

export default function MfaForm() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const { register, handleSubmit, formState: { errors } } = useForm<MfaFormData>({
    resolver: zodResolver(mfaSchema),
  });

  const onSubmit = async (data: MfaFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: data.code }),
      });

      const result = await response.json();

      if (result.success) {
        // Update session to reflect MFA verification
        await update({ mfaVerified: true });
        toast.success('MFA Verified');
        router.push(callbackUrl);
      } else {
        toast.error(result.error || 'Invalid MFA code');
      }
    } catch (error) {
      toast.error('Failed to verify MFA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 glass-dark border border-white/10 rounded-3xl shadow-soft">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Security Verification</h2>
        <p className="text-slate-400 text-center">
          Enter the 6-digit code from your authenticator app or a backup code.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-2">
            Verification Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('code')}
              type="text"
              id="code"
              className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-center text-xl tracking-widest font-mono"
              placeholder="000000"
              autoFocus
            />
          </div>
          {errors.code && (
            <p className="mt-2 text-sm text-red-400 font-medium">{errors.code.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Verify & Continue</span>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          onClick={() => router.push('/login')}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
