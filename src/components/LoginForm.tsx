
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginForm() {
  const [email, setEmail] = useState('admin@techhub.lk');
  const [password, setPassword] = useState('demo123');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

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
      <Card className="w-full max-w-md">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            <div className="mt-4 p-3 rounded-md bg-gray-100 text-sm">
              {message}
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p><strong>Demo Credentials:</strong></p>
            <p>Email: admin@techhub.lk</p>
            <p>Password: demo123</p>
            <p className="mt-2 text-xs text-gray-500">
              Alternative: manager@colombofashion.lk / admin@freshmart.lk
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
