'use client';

import React from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingScreen({ 
  message = 'Loading...', 
  fullScreen = true,
  size = 'md'
}: LoadingScreenProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="relative mb-4">
          <ShoppingBag className={`${sizeClasses[size]} text-blue-600 mx-auto animate-pulse`} />
          <Loader2 className={`${sizeClasses[size]} text-blue-600 mx-auto animate-spin absolute inset-0`} />
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page transition loading component
export function PageLoadingScreen() {
  return (
    <LoadingScreen 
      message="Loading page..." 
      fullScreen={true}
      size="lg"
    />
  );
}

// Data loading component
export function DataLoadingScreen({ message = 'Loading data...' }: { message?: string }) {
  return (
    <LoadingScreen 
      message={message} 
      fullScreen={false}
      size="md"
    />
  );
}

// Form submission loading component
export function FormLoadingScreen({ message = 'Processing...' }: { message?: string }) {
  return (
    <LoadingScreen 
      message={message} 
      fullScreen={false}
      size="sm"
    />
  );
}

// Inline loading spinner
export function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
  );
}

// Loading skeleton components
export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <LoadingSkeleton className="h-6 w-3/4 mb-4" />
      <LoadingSkeleton className="h-4 w-full mb-2" />
      <LoadingSkeleton className="h-4 w-2/3 mb-4" />
      <LoadingSkeleton className="h-8 w-1/3" />
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <LoadingSkeleton className="h-4 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/4" />
          <LoadingSkeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
