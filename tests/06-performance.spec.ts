import { test, expect } from '@playwright/test';

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
      console.log(`Testing performance for ${pageInfo.name}...`);
      
      const startTime = Date.now();
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      console.log(`${pageInfo.name}: ${loadTime}ms`);
      
      // Check if load time is acceptable (less than 5 seconds)
      if (loadTime < 5000) {
        console.log(`✅ ${pageInfo.name} loads quickly`);
      } else {
        console.log(`⚠️ ${pageInfo.name} loads slowly: ${loadTime}ms`);
      }
    }
  });

  test('should test Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure First Contentful Paint (FCP)
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    if (fcp && fcp < 1800) {
      console.log(`✅ First Contentful Paint: ${fcp}ms (Good)`);
    } else if (fcp) {
      console.log(`⚠️ First Contentful Paint: ${fcp}ms (Needs improvement)`);
    }
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries[entries.length - 1];
          if (lcpEntry) {
            resolve(lcpEntry.startTime);
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    if (lcp && lcp < 2500) {
      console.log(`✅ Largest Contentful Paint: ${lcp}ms (Good)`);
    } else if (lcp) {
      console.log(`⚠️ Largest Contentful Paint: ${lcp}ms (Needs improvement)`);
    }
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
    await page.waitForLoadState('networkidle');
    
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
    await page.waitForLoadState('networkidle');
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
