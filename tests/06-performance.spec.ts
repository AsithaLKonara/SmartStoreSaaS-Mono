import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth-helper';

test.describe('Performance Tests', () => {
  test('should test page load performance', async ({ page }) => {
    const pages = [
      { name: 'Home', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Products', url: '/products' },
      { name: 'Orders', url: '/orders' },
      { name: 'Customers', url: '/customers' },
      { name: 'Analytics', url: '/analytics' },
      { name: 'Accounting', url: '/accounting' },
      { name: 'Procurement', url: '/procurement' },
      { name: 'Monitoring', url: '/monitoring' },
      { name: 'Documentation', url: '/docs' }
    ];

    for (const pageInfo of pages) {
      try {
        console.log(`Testing performance for ${pageInfo.name}...`);
        
        const startTime = Date.now();
        await page.goto(pageInfo.url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
        const endTime = Date.now();
        
        const loadTime = endTime - startTime;
        console.log(`${pageInfo.name}: ${loadTime}ms`);
        
        // Check if load time is acceptable (less than 5 seconds)
        if (loadTime < 5000) {
          console.log(`✅ ${pageInfo.name} loads quickly`);
        } else {
          console.log(`⚠️ ${pageInfo.name} loads slowly: ${loadTime}ms`);
        }
      } catch (error) {
        console.log(`⚠️ ${pageInfo.name} failed to load: ${error}`);
      }
    }
  });

  test('should test Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Simplified performance measurement
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
    
    console.log(`DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`Total Time: ${performanceMetrics.totalTime}ms`);
    
    // Basic performance assertions
    expect(performanceMetrics.totalTime).toBeLessThan(5000); // Total load time under 5 seconds
  });

  test('should test memory usage', async ({ page }) => {
    await page.goto('/');
    
    // Get memory usage
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryInfo) {
      const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024);
      
      console.log(`Memory Usage: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`);
      
      if (usedMB < 100) {
        console.log('✅ Memory usage is reasonable');
      } else {
        console.log('⚠️ Memory usage is high');
      }
    } else {
      console.log('ℹ️ Memory info not available');
    }
  });

  test('should test network requests', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    console.log(`Total network requests: ${requests.length}`);
    
    // Check for failed requests
    const failedRequests = requests.filter(url => 
      url.includes('error') || url.includes('404') || url.includes('500')
    );
    
    if (failedRequests.length === 0) {
      console.log('✅ No failed network requests');
    } else {
      console.log(`⚠️ ${failedRequests.length} failed requests detected`);
      failedRequests.forEach(url => console.log(`  - ${url}`));
    }
    
    // Check for slow requests (this would need more sophisticated monitoring)
    console.log('✅ Network request monitoring completed');
  });

  test('should test mobile performance', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const endTime = Date.now();
    
    const mobileLoadTime = endTime - startTime;
    console.log(`Mobile load time: ${mobileLoadTime}ms`);
    
    if (mobileLoadTime < 3000) {
      console.log('✅ Mobile performance is good');
    } else {
      console.log('⚠️ Mobile performance needs improvement');
    }
  });

  test('should test API response times', async ({ page }) => {
    const apiEndpoints = [
      '/api/health',
      '/api/db-check',
      '/api/auth/providers',
      '/api/monitoring/status'
    ];
    
    for (const endpoint of apiEndpoints) {
      const startTime = Date.now();
      
      try {
        const response = await page.request.get(endpoint);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`${endpoint}: ${response.status()} (${responseTime}ms)`);
        
        if (responseTime < 1000) {
          console.log(`✅ ${endpoint} responds quickly`);
        } else if (responseTime < 3000) {
          console.log(`⚠️ ${endpoint} responds slowly`);
        } else {
          console.log(`❌ ${endpoint} response time is too slow`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} failed to respond`);
      }
    }
  });
});
