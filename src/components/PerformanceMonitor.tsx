'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  bundleSize: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITOR) {
      return;
    }

    const measurePerformance = () => {
      if (typeof window === 'undefined' || !('performance' in window)) {
        return;
      }

      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

      // Get Web Vitals
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        const newMetrics: Partial<PerformanceMetrics> = {
          loadTime: Math.round(loadTime),
        };

        entries.forEach((entry) => {
          switch (entry.name) {
            case 'first-contentful-paint':
              newMetrics.firstContentfulPaint = Math.round(entry.startTime);
              break;
            case 'largest-contentful-paint':
              newMetrics.largestContentfulPaint = Math.round(entry.startTime);
              break;
            case 'first-input-delay':
              newMetrics.firstInputDelay = Math.round((entry as any).processingStart - entry.startTime);
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                newMetrics.cumulativeLayoutShift = (newMetrics.cumulativeLayoutShift || 0) + (entry as any).value;
              }
              break;
          }
        });

        // Estimate bundle size from resource timing
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const bundleSize = resources
          .filter(resource => resource.name.includes('/_next/static/'))
          .reduce((total, resource) => total + resource.transferSize, 0);

        newMetrics.bundleSize = Math.round(bundleSize / 1024); // Convert to KB

        setMetrics(prev => ({ ...prev, ...newMetrics } as PerformanceMetrics));
      });

      // Observe different performance entry types
      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }

      // Set up keyboard shortcut to toggle visibility
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
          setIsVisible(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      return () => {
        observer.disconnect();
        window.removeEventListener('keydown', handleKeyPress);
      };
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }
  }, []);

  if (!isVisible || !metrics) {
    return null;
  }

  const getPerformanceScore = (metric: number, thresholds: { good: number; needsImprovement: number }) => {
    if (metric <= thresholds.good) return { score: 'good', color: 'green' };
    if (metric <= thresholds.needsImprovement) return { score: 'needs improvement', color: 'yellow' };
    return { score: 'poor', color: 'red' };
  };

  const lcpScore = getPerformanceScore(metrics.largestContentfulPaint, { good: 2500, needsImprovement: 4000 });
  const fidScore = getPerformanceScore(metrics.firstInputDelay, { good: 100, needsImprovement: 300 });
  const clsScore = getPerformanceScore(metrics.cumulativeLayoutShift, { good: 0.1, needsImprovement: 0.25 });

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className="font-mono">{metrics.loadTime}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={`font-mono text-${lcpScore.color}-600`}>
            {metrics.largestContentfulPaint}ms ({lcpScore.score})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={`font-mono text-${fidScore.color}-600`}>
            {metrics.firstInputDelay}ms ({fidScore.score})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={`font-mono text-${clsScore.color}-600`}>
            {metrics.cumulativeLayoutShift.toFixed(3)} ({clsScore.score})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Bundle Size:</span>
          <span className="font-mono">{metrics.bundleSize}KB</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Press Ctrl+Shift+P to toggle
        </p>
      </div>
    </div>
  );
};

export default PerformanceMonitor;




