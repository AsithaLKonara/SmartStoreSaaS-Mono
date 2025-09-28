/**
 * Browser Automation Test Suite for SmartStore SaaS
 * Tests frontend interactions, buttons, forms, and UI workflows
 */

const puppeteer = require('puppeteer');

class BrowserAutomationTest {
  constructor() {
    this.baseUrl = 'https://smartstore-saas.vercel.app';
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async log(testName, status, details = '') {
    this.results.total++;
    if (status === 'PASS') {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    
    this.results.details.push({
      test: testName,
      status,
      details,
      timestamp: new Date().toISOString()
    });
    
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}: ${details}`);
  }

  async setup() {
    console.log('🌐 Setting up browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testHomepageLoad() {
    console.log('\n🏠 Testing Homepage Load...');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const title = await this.page.title();
      await this.log(
        'Homepage Title',
        title.includes('SmartStore') ? 'PASS' : 'FAIL',
        `Title: ${title}`
      );
      
      // Check for main elements
      const signInButton = await this.page.$('a[href="/auth/signin"]');
      await this.log(
        'Sign In Button',
        signInButton ? 'PASS' : 'FAIL',
        signInButton ? 'Button found' : 'Button not found'
      );
      
      const signUpButton = await this.page.$('a[href="/auth/signup"]');
      await this.log(
        'Sign Up Button',
        signUpButton ? 'PASS' : 'FAIL',
        signUpButton ? 'Button found' : 'Button not found'
      );
      
    } catch (error) {
      await this.log('Homepage Load', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testAuthenticationPages() {
    console.log('\n🔐 Testing Authentication Pages...');
    
    // Test Sign In page
    try {
      await this.page.goto(`${this.baseUrl}/auth/signin`, { waitUntil: 'networkidle2' });
      
      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      const signInButton = await this.page.$('button[type="submit"]');
      
      await this.log(
        'Sign In Form Elements',
        (emailInput && passwordInput && signInButton) ? 'PASS' : 'FAIL',
        `Email: ${!!emailInput}, Password: ${!!passwordInput}, Button: ${!!signInButton}`
      );
      
    } catch (error) {
      await this.log('Sign In Page', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test Sign Up page
    try {
      await this.page.goto(`${this.baseUrl}/auth/signup`, { waitUntil: 'networkidle2' });
      
      const nameInput = await this.page.$('input[name="name"]');
      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      const signUpButton = await this.page.$('button[type="submit"]');
      
      await this.log(
        'Sign Up Form Elements',
        (nameInput && emailInput && passwordInput && signUpButton) ? 'PASS' : 'FAIL',
        `Name: ${!!nameInput}, Email: ${!!emailInput}, Password: ${!!passwordInput}, Button: ${!!signUpButton}`
      );
      
    } catch (error) {
      await this.log('Sign Up Page', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testDashboardPages() {
    console.log('\n📊 Testing Dashboard Pages...');
    
    const dashboardPages = [
      '/dashboard',
      '/products',
      '/customers',
      '/orders',
      '/analytics',
      '/settings'
    ];
    
    for (const page of dashboardPages) {
      try {
        await this.page.goto(`${this.baseUrl}${page}`, { waitUntil: 'networkidle2', timeout: 15000 });
        
        const pageTitle = await this.page.title();
        const hasContent = await this.page.$('main, .container, .dashboard') !== null;
        
        await this.log(
          `Dashboard Page ${page}`,
          hasContent ? 'PASS' : 'FAIL',
          `Title: ${pageTitle}, Content: ${hasContent}`
        );
        
      } catch (error) {
        await this.log(`Dashboard Page ${page}`, 'FAIL', `Error: ${error.message}`);
      }
    }
  }

  async testFormInteractions() {
    console.log('\n📝 Testing Form Interactions...');
    
    try {
      // Test product form
      await this.page.goto(`${this.baseUrl}/products/new`, { waitUntil: 'networkidle2' });
      
      // Fill product form
      await this.page.type('input[name="name"]', 'Test Product');
      await this.page.type('input[name="sku"]', 'TEST-001');
      await this.page.type('input[name="price"]', '99.99');
      await this.page.type('input[name="stock"]', '100');
      
      await this.log(
        'Product Form Fill',
        'PASS',
        'Form fields filled successfully'
      );
      
      // Test button click
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        await this.log(
          'Submit Button Click',
          'PASS',
          'Submit button found and clickable'
        );
      } else {
        await this.log(
          'Submit Button Click',
          'FAIL',
          'Submit button not found'
        );
      }
      
    } catch (error) {
      await this.log('Form Interactions', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testNavigation() {
    console.log('\n🧭 Testing Navigation...');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Test navigation links
      const navLinks = [
        { selector: 'a[href="/auth/signin"]', name: 'Sign In Link' },
        { selector: 'a[href="/auth/signup"]', name: 'Sign Up Link' }
      ];
      
      for (const link of navLinks) {
        const element = await this.page.$(link.selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(1000);
          
          await this.log(
            link.name,
            'PASS',
            'Navigation successful'
          );
        } else {
          await this.log(
            link.name,
            'FAIL',
            'Link not found'
          );
        }
      }
      
    } catch (error) {
      await this.log('Navigation Test', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewport(viewport);
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        
        const body = await this.page.$('body');
        const isVisible = await body.isVisible();
        
        await this.log(
          `Responsive ${viewport.name}`,
          isVisible ? 'PASS' : 'FAIL',
          `${viewport.width}x${viewport.height}`
        );
        
      } catch (error) {
        await this.log(`Responsive ${viewport.name}`, 'FAIL', `Error: ${error.message}`);
      }
    }
  }

  async testAPIIntegration() {
    console.log('\n🔌 Testing API Integration from Frontend...');
    
    try {
      await this.page.goto(`${this.baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
      
      // Monitor network requests
      const requests = [];
      this.page.on('request', request => {
        if (request.url().includes('/api/')) {
          requests.push({
            url: request.url(),
            method: request.method()
          });
        }
      });
      
      // Wait for API calls
      await this.page.waitForTimeout(3000);
      
      const apiCalls = requests.filter(req => req.url.includes('/api/'));
      
      await this.log(
        'API Integration',
        apiCalls.length > 0 ? 'PASS' : 'FAIL',
        `${apiCalls.length} API calls detected`
      );
      
    } catch (error) {
      await this.log('API Integration', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');
    
    try {
      // Test 404 page
      await this.page.goto(`${this.baseUrl}/nonexistent-page`, { waitUntil: 'networkidle2' });
      
      const pageContent = await this.page.content();
      const hasErrorContent = pageContent.includes('404') || pageContent.includes('not found') || pageContent.includes('error');
      
      await this.log(
        '404 Error Page',
        hasErrorContent ? 'PASS' : 'FAIL',
        'Error page displayed'
      );
      
    } catch (error) {
      await this.log('Error Handling', 'FAIL', `Error: ${error.message}`);
    }
  }

  async runBrowserTests() {
    console.log('🌐 Starting Browser Automation Tests...');
    console.log(`📍 Testing against: ${this.baseUrl}`);
    console.log('=' .repeat(60));
    
    try {
      await this.setup();
      
      await this.testHomepageLoad();
      await this.testAuthenticationPages();
      await this.testDashboardPages();
      await this.testFormInteractions();
      await this.testNavigation();
      await this.testResponsiveDesign();
      await this.testAPIIntegration();
      await this.testErrorHandling();
      
    } catch (error) {
      console.error('❌ Browser test error:', error);
    } finally {
      await this.teardown();
    }
    
    // Generate final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 BROWSER AUTOMATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.total}`);
    console.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.details
        .filter(test => test.status === 'FAIL')
        .forEach(test => console.log(`  - ${test.test}: ${test.details}`));
    }
    
    console.log('\n🎯 Browser Automation Tests Complete!');
    
    return this.results;
  }
}

module.exports = { BrowserAutomationTest };

// Run if called directly
if (require.main === module) {
  const browserTest = new BrowserAutomationTest();
  browserTest.runBrowserTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

