'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { LoadingScreen } from './ui/LoadingScreen';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

export function PerformanceOptimizer({ 
  children, 
  fallback = <LoadingScreen message="Loading..." />,
  delay = 0 
}: PerformanceOptimizerProps) {
  const [isLoading, setIsLoading] = useState(delay > 0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setIsVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [delay]);

  // Preload critical resources
  useEffect(() => {
    // Preload fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/inter.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);

    // Preload critical images
    const criticalImages = [
      '/images/logo.svg',
      '/images/hero-bg.jpg',
    ];

    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  if (isLoading) {
    return <>{fallback}</>;
  }

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}

// Lazy loading wrapper
export function LazyLoad({ 
  children, 
  threshold = 0.1,
  fallback = <LoadingScreen message="Loading content..." />
}: {
  children: React.ReactNode;
  threshold?: number;
  fallback?: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, hasLoaded]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Image optimization component
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  [key: string]: any;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Image failed to load</div>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          {...props}
        />
      )}
    </div>
  );
}

// Virtual scrolling for large lists
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Debounced search component
export function DebouncedSearch({
  onSearch,
  placeholder = 'Search...',
  delay = 300,
  className = '',
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setIsSearching(true);
        onSearch(query.trim());
        setTimeout(() => setIsSearching(false), 500);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

