
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

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('superadmin@smartstore.com');
  const [password, setPassword] = useState('SuperAdmin123!');
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

    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      // Get callback URL from query params or default to dashboard
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: callbackUrl,
      });

      // If redirect is true, NextAuth handles the redirect automatically
      // This code won't execute if redirect succeeds, but we keep it for error handling
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" data-testid="login-page">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">SmartStore SaaS</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="email-input"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
              />
              <FormErrorMessage message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                data-testid="password-input"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
              />
              <FormErrorMessage message={errors.password} />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="submit-button"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                data-testid="register-link"
              >
                Register here
              </button>
            </p>
          </div>

          {/* Test Credentials Toggle */}
          <div className="mt-6 border-t pt-4">
            <details className="group">
              <summary className="flex items-center justify-center cursor-pointer list-none text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                <span>🔐 View Test Credentials</span>
                <span className="ml-2 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-center text-gray-500 mb-3">
                  Click on any credential to auto-fill the form
                </p>

                {/* SUPER ADMIN */}
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

                {/* TENANT ADMIN */}
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

                {/* STAFF */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('sales@demo.com');
                    setPassword('Sales123!');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-600 text-white">
                          STAFF
                        </span>
                        <span className="text-xs text-green-700 dark:text-green-400">
                          Limited Operations
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        sales@demo.com / Sales123!
                      </p>
                    </div>
                  </div>
                </button>

                {/* CUSTOMER */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@demo.com');
                    setPassword('Customer123!');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-600 text-white">
                          CUSTOMER
                        </span>
                        <span className="text-xs text-purple-700 dark:text-purple-400">
                          Customer Portal
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        customer@demo.com / Customer123!
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
