
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormErrorMessage } from '@/components/ui/ErrorBoundary';

export default function LoginForm() {
  const [email, setEmail] = useState('superadmin@smartstore.com');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage('❌ Invalid credentials. Please try again.');
      } else if (result?.ok) {
        setMessage('✅ Login successful! Redirecting...');
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ Login failed. Please try again.');
    } finally {
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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
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
          
          {message && (
            <div className="mt-4 p-3 rounded-md bg-gray-100 text-sm" data-testid="error-message">
              {message}
            </div>
          )}
          
          {/* Comprehensive Role-Based Test Credentials */}
          <div className="mt-6 border-t pt-4">
            <div className="text-center mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                🔐 Test Credentials by Role
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click on any credential to auto-fill the form
              </p>
            </div>
            
            <div className="space-y-2">
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
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ✓ All 72 pages • System admin • Multi-tenant management
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
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ✓ 63 pages • All business ops • User management • Integrations
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
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ✓ 15-30 pages • Role-based access • Orders & Products
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
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ✓ 6 pages • My orders • Profile • Shop • Support
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Quick Info */}
            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> Each role has different page access and permissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
