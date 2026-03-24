'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormErrorMessage } from '@/components/ui/ErrorBoundary';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import TurnstileWidget from '@/components/auth/TurnstileWidget';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('superadmin@smartstore.com');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      router.push(callbackUrl);
    }
  }, [status, session, router, searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      toast.error('Please complete the security check');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        setMessage('❌ Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      logger.error({
        message: 'Login error',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { email }
      });
      setMessage('❌ Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" data-testid="login-page">
      <Card className="w-full max-w-lg glass-dark border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">
            <span className="text-gradient">SmartStore SaaS</span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="email-input"
                className={`w-full bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary/50 ${errors.email ? 'border-red-500/50' : ''}`}
              />
              <FormErrorMessage message={errors.email} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                data-testid="password-input"
                className={`w-full bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary/50 ${errors.password ? 'border-red-500/50' : ''}`}
              />
              <FormErrorMessage message={errors.password} />
            </div>

            <TurnstileWidget onVerify={setTurnstileToken} />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl font-bold text-lg glow"
              disabled={isLoading}
              data-testid="submit-button"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('❌') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {message}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-bold text-primary hover:text-primary/80 transition-colors"
                data-testid="register-link"
              >
                Register here
              </button>
            </p>
          </div>

          <div className="mt-6 border-t pt-4">
            <details className="group">
              <summary className="flex items-center justify-center cursor-pointer list-none text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                <span>🔐 View Test Credentials</span>
                <span className="ml-2 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('superadmin@smartstore.com');
                    setPassword('SuperAdmin123!');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                          SUPER ADMIN
                        </span>
                        <span className="text-xs text-red-700 dark:text-red-400">
                          Full System Access
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        superadmin@smartstore.com / SuperAdmin123!
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@demo.com');
                    setPassword('Admin123!');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                          TENANT ADMIN
                        </span>
                        <span className="text-xs text-blue-700 dark:text-blue-400">
                          Full Organization Access
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        admin@demo.com / Admin123!
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
