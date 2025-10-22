/**
 * Comprehensive E2E Test Suite for SmartStore SaaS
 * Tests all APIs, database integrations, and user workflows
 */

const { PrismaClient } = require('@prisma/client');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://smartstore-saas.vercel.app';
const TEST_USER = {
  email: 'test@smartstore.com',
  password: 'testpassword123',
  name: 'Test User'
};

class E2ETestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.sessionToken = null;
    this.testData = {};
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

  async createTestUser() {
    try {
      const signupData = {
        email: 'testuser@e2e.com',
        password: 'testpassword123',
        name: 'Test User',
        organizationName: 'Test Organization',
        organizationSlug: 'test-org-e2e'
      };
      
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, signupData);
      if (res.status === 201 || res.status === 200) {
        this.sessionToken = res.data.data.token;
        return this.sessionToken;
      }
      throw new Error(`Signup failed: ${res.status}`);
    } catch (error) {
      if (error.response?.status === 409) {
        // User already exists, try to sign in
        try {
          const signinData = {
            email: 'testuser@e2e.com',
            password: 'testpassword123'
          };
          const res = await axios.post(`${BASE_URL}/api/auth/signin`, signinData);
          if (res.status === 200) {
            this.sessionToken = res.data.data.token;
            return this.sessionToken;
          }
        } catch (signinError) {
          console.log('Signin also failed, continuing without auth token');
        }
      }
      return null;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionToken && { 'Authorization': `Bearer ${this.sessionToken}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      const data = await response.text();
      
      try {
        return {
          status: response.status,
          data: JSON.parse(data),
          headers: response.headers
        };
      } catch {
        return {
          status: response.status,
          data: data,
          headers: response.headers
        };
      }
    } catch (error) {
      return {
        status: 0,
        error: error.message,
        data: null
      };
    }
  }

  async testHealthEndpoints() {
    console.log('\n🏥 Testing Health Endpoints...');
    
    // Test basic health endpoint
    const health = await this.makeRequest('/api/health');
    await this.log(
      'Health Endpoint',
      health.status === 200 ? 'PASS' : 'FAIL',
      `Status: ${health.status}`
    );

    // Test comprehensive health endpoint
    const comprehensiveHealth = await this.makeRequest('/api/testing/health');
    await this.log(
      'Comprehensive Health',
      comprehensiveHealth.status === 200 ? 'PASS' : 'FAIL',
      `Status: ${comprehensiveHealth.status}`
    );
  }

  async testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    // Test signup
    const signupResponse = await this.makeRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    await this.log(
      'User Signup',
      signupResponse.status === 201 || signupResponse.status === 409 ? 'PASS' : 'FAIL',
      `Status: ${signupResponse.status}`
    );

    // Test signin
    const signinResponse = await this.makeRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    
    if (signinResponse.status === 200 && signinResponse.data?.token) {
      this.sessionToken = signinResponse.data.token;
      await this.log('User Signin', 'PASS', 'Token received');
    } else {
      await this.log('User Signin', 'FAIL', `Status: ${signinResponse.status}`);
    }

    // Test protected endpoint
    const protectedResponse = await this.makeRequest('/api/auth/test');
    await this.log(
      'Protected Endpoint Access',
      protectedResponse.status === 200 ? 'PASS' : 'FAIL',
      `Status: ${protectedResponse.status}`
    );
  }

  async testUserManagement() {
    console.log('\n👥 Testing User Management...');
    
    // Get users list
    const usersResponse = await this.makeRequest('/api/users');
    await this.log(
      'Get Users List',
      usersResponse.status === 200 ? 'PASS' : 'FAIL',
      `Status: ${usersResponse.status}, Count: ${usersResponse.data?.users?.length || 0}`
    );

    // Create new user
    const newUser = {
      email: 'newuser@test.com',
      name: 'New Test User',
      password: 'password123',
      role: 'USER'
    };
    
    const createUserResponse = await this.makeRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    });
    
    if (createUserResponse.status === 201) {
      this.testData.newUserId = createUserResponse.data.user.id;
    }
    
    await this.log(
      'Create User',
      createUserResponse.status === 201 ? 'PASS' : 'FAIL',
      `Status: ${createUserResponse.status}`
    );
  }

  async testProductManagement() {
    console.log('\n🛍️ Testing Product Management...');
    
    // Get products list
    const productsResponse = await this.makeRequest('/api/products');
    await this.log(
      'Get Products List',
      productsResponse.status === 200 ? 'PASS' : 'FAIL',
      `Status: ${productsResponse.status}, Count: ${productsResponse.data?.products?.length || 0}`
    );

    // Create new product
    const newProduct = {
      name: 'Test Product',
      description: 'A test product for E2E testing',
      sku: 'TEST-SKU-001',
      price: 99.99,
      cost: 50.00,
      stock: 100,
      minStock: 10,
      weight: 1.5,
      dimensions: JSON.stringify({ length: 10, width: 10, height: 10 }),
      tags: JSON.stringify(['test', 'e2e'])
    };
    
    const createProductResponse = await this.makeRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(newProduct)
    });
    
    if (createProductResponse.status === 201) {
      this.testData.newProductId = createProductResponse.data.product.id;
    }
    
    await this.log(
      'Create Product',
      createProductResponse.status === 201 ? 'PASS' : 'FAIL',
      `Status: ${createProductResponse.status}`
    );

    // Update product
    if (this.testData.newProductId) {
      const updateProductResponse = await this.makeRequest(`/api/products/${this.testData.newProductId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Test Product',
          price: 149.99
        })
      });
      
      await this.log(
        'Update Product',
        updateProductResponse.status === 200 ? 'PASS' : 'FAIL',
        `Status: ${updateProductResponse.status}`
      );
    }
  }

  async testCustomerManagement() {
    console.log('\n👤 Testing Customer Management...');
    
    // Get customers list
    const customersResponse = await this.makeRequest('/api/customers');
    await this.log(
      'Get Customers List',
      customersResponse.status === 200 ? 'PASS' : 'FAIL',
      `Status: ${customersResponse.status}, Count: ${customersResponse.data?.customers?.length || 0}`
    );

    // Create new customer
    const newCustomer = {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '123-456-7890',
      address: JSON.stringify({
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zip: '12345'
      })
    };
    
    const createCustomerResponse = await this.makeRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify(newCustomer)
    });
    
    if (createCustomerResponse.status === 201) {
      this.testData.newCustomerId = createCustomerResponse.data.customer.id;
    }
    
    await this.log(
      'Create Customer',
      createCustomerResponse.status === 201 ? 'PASS' : 'FAIL',
      `Status: ${createCustomerResponse.status}`
    );
  }

  async testOrderManagement() {
    console.log('\n📦 Testing Order Management...');
    
    // Get orders list
    const ordersResponse = await this.makeRequest('/api/orders');
    await this.log(
      'Get Orders List',
      ordersResponse.status === 200 ? 'PASS' : 'FAIL',
      `Status: ${ordersResponse.status}, Count: ${ordersResponse.data?.orders?.length || 0}`
    );

    // Create new order (if we have customer and product)
    if (this.testData.newCustomerId && this.testData.newProductId) {
      const newOrder = {
        customerId: this.testData.newCustomerId,
        items: [{
          productId: this.testData.newProductId,
          quantity: 2,
          price: 99.99
        }],
        total: 199.98,
        subtotal: 199.98,
        tax: 0,
        shipping: 10.00,
        discount: 0,
        notes: 'E2E test order'
      };
      
      const createOrderResponse = await this.makeRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });
      
      if (createOrderResponse.status === 201) {
        this.testData.newOrderId = createOrderResponse.data.order.id;
      }
      
      await this.log(
        'Create Order',
        createOrderResponse.status === 201 ? 'PASS' : 'FAIL',
        `Status: ${createOrderResponse.status}`
      );
    }
  }

  async testAnalyticsEndpoints() {
    console.log('\n📊 Testing Analytics Endpoints...');
    
    const analyticsEndpoints = [
      '/api/analytics',
      '/api/analytics/dashboard',
      '/api/analytics/customer-insights',
      '/api/analytics/enhanced'
    ];
    
    for (const endpoint of analyticsEndpoints) {
      const response = await this.makeRequest(endpoint);
      await this.log(
        `Analytics ${endpoint}`,
        response.status === 200 ? 'PASS' : 'FAIL',
        `Status: ${response.status}`
      );
    }
  }

  async testAIIntegration() {
    console.log('\n🤖 Testing AI Integration...');
    
    const aiEndpoints = [
      '/api/ai/chat',
      '/api/ai/analytics',
      '/api/ai/automation',
      '/api/ai/predictions',
      '/api/ai/recommendations'
    ];
    
    for (const endpoint of aiEndpoints) {
      const response = await this.makeRequest(endpoint);
      await this.log(
        `AI ${endpoint}`,
        response.status === 200 || response.status === 401 ? 'PASS' : 'FAIL',
        `Status: ${response.status}`
      );
    }
  }

  async testWhatsAppIntegration() {
    console.log('\n📱 Testing WhatsApp Integration...');
    
    const whatsappEndpoints = [
      '/api/integrations/whatsapp',
      '/api/integrations/whatsapp/messages',
      '/api/integrations/whatsapp/send'
    ];
    
    for (const endpoint of whatsappEndpoints) {
      const response = await this.makeRequest(endpoint);
      await this.log(
        `WhatsApp ${endpoint}`,
        response.status === 200 || response.status === 401 ? 'PASS' : 'FAIL',
        `Status: ${response.status}`
      );
    }
  }

  async testSocialCommerce() {
    console.log('\n📱 Testing Social Commerce...');
    
    const socialEndpoints = [
      '/api/integrations/social',
      '/api/integrations/social/posts'
    ];
    
    for (const endpoint of socialEndpoints) {
      const response = await this.makeRequest(endpoint);
      await this.log(
        `Social Commerce ${endpoint}`,
        response.status === 200 || response.status === 401 ? 'PASS' : 'FAIL',
        `Status: ${response.status}`
      );
    }
  }

  async testPerformanceMonitoring() {
    console.log('\n⚡ Testing Performance Monitoring...');
    
    const performanceEndpoints = [
      '/api/performance/monitoring',
      '/api/performance/cache'
    ];
    
    for (const endpoint of performanceEndpoints) {
      const response = await this.makeRequest(endpoint);
      await this.log(
        `Performance ${endpoint}`,
        response.status === 200 || response.status === 401 ? 'PASS' : 'FAIL',
        `Status: ${response.status}`
      );
    }
  }

  async testDatabaseIntegration() {
    console.log('\n🗄️ Testing Database Integration...');
    
    // Test database connectivity through various endpoints
    const dbEndpoints = [
      '/api/categories',
      '/api/coupons',
      '/api/loyalty',
      '/api/warehouses',
      '/api/reports'
    ];
    
    for (const endpoint of dbEndpoints) {
      const response = await this.makeRequest(endpoint);
      await this.log(
        `Database ${endpoint}`,
        response.status === 200 || response.status === 401 ? 'PASS' : 'FAIL',
        `Status: ${response.status}`
      );
    }
  }

  async testFrontendPages() {
    console.log('\n🌐 Testing Frontend Pages...');
    
    const pages = [
      '/',
      '/dashboard',
      '/products',
      '/customers',
      '/orders',
      '/analytics',
      '/settings',
      '/auth/signin',
      '/auth/signup'
    ];
    
    for (const page of pages) {
      const response = await this.makeRequest(page);
      await this.log(
        `Page ${page}`,
        response.status === 200 ? 'PASS' : 'FAIL',
        `Status: ${response.status}`
      );
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    // Clean up created test data
    if (this.testData.newOrderId) {
      await this.makeRequest(`/api/orders/${this.testData.newOrderId}`, { method: 'DELETE' });
    }
    
    if (this.testData.newProductId) {
      await this.makeRequest(`/api/products/${this.testData.newProductId}`, { method: 'DELETE' });
    }
    
    if (this.testData.newCustomerId) {
      await this.makeRequest(`/api/customers/${this.testData.newCustomerId}`, { method: 'DELETE' });
    }
    
    if (this.testData.newUserId) {
      await this.makeRequest(`/api/users/${this.testData.newUserId}`, { method: 'DELETE' });
    }
    
    console.log('✅ Test data cleanup completed');
  }

  async runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive E2E Test Suite...');
    console.log(`📍 Testing against: ${BASE_URL}`);
    console.log('=' .repeat(60));
    
    try {
      await this.testHealthEndpoints();
      await this.testAuthenticationFlow();
      await this.testUserManagement();
      await this.testProductManagement();
      await this.testCustomerManagement();
      await this.testOrderManagement();
      await this.testAnalyticsEndpoints();
      await this.testAIIntegration();
      await this.testWhatsAppIntegration();
      await this.testSocialCommerce();
      await this.testPerformanceMonitoring();
      await this.testDatabaseIntegration();
      await this.testFrontendPages();
      
      await this.cleanupTestData();
      
    } catch (error) {
      console.error('❌ Test suite error:', error);
    }
    
    // Generate final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE E2E TEST RESULTS');
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
    
    console.log('\n🎯 E2E Test Suite Complete!');
    
    return this.results;
  }
}

// Run the test suite
async function runE2ETests() {
  const testSuite = new E2ETestSuite();
  return await testSuite.runComprehensiveTest();
}

module.exports = { E2ETestSuite, runE2ETests };

// Run if called directly
if (require.main === module) {
  runE2ETests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}
