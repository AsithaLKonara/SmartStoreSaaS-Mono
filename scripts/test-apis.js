#!/usr/bin/env node

/**
 * SmartStoreSaaS - Comprehensive API Testing Suite
 * Tests all implemented API endpoints with realistic data
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_CREDENTIALS = {
  email: 'admin@demo.com',
  password: 'password123'
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`✅ ${timestamp} ${message}`.green);
      break;
    case 'error':
      console.log(`❌ ${timestamp} ${message}`.red);
      break;
    case 'warning':
      console.log(`⚠️  ${timestamp} ${message}`.yellow);
      break;
    default:
      console.log(`ℹ️  ${timestamp} ${message}`);
  }
}

function logTestResult(testName, success, error = null) {
  testResults.total++;
  if (success) {
    testResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || 'Unknown error' });
    log(`FAIL: ${testName}`, 'error');
    if (error) log(`  Error: ${error.message}`, 'error');
  }
}

// Authentication helper
let authToken = null;

async function authenticate() {
  try {
    log('🔐 Authenticating...');
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      log('Authentication successful', 'success');
      return true;
    } else {
      throw new Error('Authentication failed - no token received');
    }
  } catch (error) {
    log(`Authentication failed: ${error.message}`, 'error');
    return false;
  }
}

// API request helper
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testAuthentication() {
  log('\n🔐 Testing Authentication APIs...');
  
  // Test signin
  try {
    const response = await makeRequest('POST', '/auth/signin', TEST_CREDENTIALS);
    logTestResult('POST /auth/signin', response.success);
  } catch (error) {
    logTestResult('POST /auth/signin', false, error);
  }

  // Test signup
  try {
    const signupData = {
      email: 'testuser@example.com',
      password: 'testpassword123',
      name: 'Test User',
      organizationName: 'Test Organization',
      organizationSlug: 'test-org'
    };
    const response = await makeRequest('POST', '/auth/signup', signupData);
    logTestResult('POST /auth/signup', response.success);
  } catch (error) {
    logTestResult('POST /auth/signup', false, error);
  }
}

async function testProductManagement() {
  log('\n📦 Testing Product Management APIs...');
  
  // Test products list
  try {
    const response = await makeRequest('GET', '/products');
    logTestResult('GET /products', response.success);
  } catch (error) {
    logTestResult('GET /products', false, error);
  }

  // Test product creation
  try {
    const productData = {
      name: 'Test Product',
      slug: 'test-product',
      sku: 'TEST-001',
      description: 'A test product for API testing',
      price: 29.99,
      stockQuantity: 100,
      isActive: true
    };
    const response = await makeRequest('POST', '/products', productData);
    logTestResult('POST /products', response.success);
    
    if (response.success && response.data.data?.product?.id) {
      const productId = response.data.data.product.id;
      
      // Test get product by ID
      const getResponse = await makeRequest('GET', `/products/${productId}`);
      logTestResult('GET /products/[id]', getResponse.success);
      
      // Test product update
      const updateData = { price: 39.99, stockQuantity: 150 };
      const updateResponse = await makeRequest('PUT', `/products/${productId}`, updateData);
      logTestResult('PUT /products/[id]', updateResponse.success);
    }
  } catch (error) {
    logTestResult('Product CRUD operations', false, error);
  }
}

async function testOrderManagement() {
  log('\n🛒 Testing Order Management APIs...');
  
  // Test orders list
  try {
    const response = await makeRequest('GET', '/orders');
    logTestResult('GET /orders', response.success);
  } catch (error) {
    logTestResult('GET /orders', false, error);
  }

  // Test order creation (requires customer and product)
  try {
    // First create a customer
    const customerData = {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+1-555-0123'
    };
    const customerResponse = await makeRequest('POST', '/customers', customerData);
    
    if (customerResponse.success && customerResponse.data.data?.customer?.id) {
      const customerId = customerResponse.data.data.customer.id;
      
      // Create a product for the order
      const productData = {
        name: 'Order Test Product',
        slug: 'order-test-product',
        sku: 'ORDER-001',
        description: 'Product for order testing',
        price: 19.99,
        stockQuantity: 50,
        isActive: true
      };
      const productResponse = await makeRequest('POST', '/products', productData);
      
      if (productResponse.success && productResponse.data.data?.product?.id) {
        const productId = productResponse.data.data.product.id;
        
        // Create order
        const orderData = {
          customerId,
          items: [{
            productId,
            quantity: 2,
            price: 19.99
          }],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA'
          },
          shippingMethod: 'standard',
          paymentMethod: 'stripe',
          taxRate: 8.5,
          shippingCost: 5.99
        };
        
        const orderResponse = await makeRequest('POST', '/orders', orderData);
        logTestResult('POST /orders', orderResponse.success);
        
        if (orderResponse.success && orderResponse.data.data?.order?.id) {
          const orderId = orderResponse.data.data.order.id;
          
          // Test get order by ID
          const getResponse = await makeRequest('GET', `/orders/${orderId}`);
          logTestResult('GET /orders/[id]', getResponse.success);
          
          // Test order status update
          const statusData = { status: 'CONFIRMED', notes: 'Order confirmed via API test' };
          const statusResponse = await makeRequest('PATCH', `/orders/${orderId}`, statusData);
          logTestResult('PATCH /orders/[id]', statusResponse.success);
        }
      }
    }
  } catch (error) {
    logTestResult('Order CRUD operations', false, error);
  }
}

async function testCustomerManagement() {
  log('\n👥 Testing Customer Management APIs...');
  
  // Test customers list
  try {
    const response = await makeRequest('GET', '/customers');
    logTestResult('GET /customers', response.success);
  } catch (error) {
    logTestResult('GET /customers', false, error);
  }

  // Test customer creation
  try {
    const customerData = {
      name: 'API Test Customer',
      email: 'apitest@customer.com',
      phone: '+1-555-0124',
      address: {
        street: '456 API Test Ave',
        city: 'API City',
        state: 'AC',
        zipCode: '67890',
        country: 'USA'
      },
      tags: ['api-test', 'new'],
      source: 'api-testing'
    };
    
    const response = await makeRequest('POST', '/customers', customerData);
    logTestResult('POST /customers', response.success);
    
    if (response.success && response.data.data?.customer?.id) {
      const customerId = response.data.data.customer.id;
      
      // Test get customer by ID
      const getResponse = await makeRequest('GET', `/customers/${customerId}`);
      logTestResult('GET /customers/[id]', getResponse.success);
      
      // Test customer update
      const updateData = { name: 'Updated API Test Customer', tags: ['api-test', 'updated'] };
      const updateResponse = await makeRequest('PUT', `/customers/${customerId}`, updateData);
      logTestResult('PUT /customers/[id]', updateResponse.success);
    }
  } catch (error) {
    logTestResult('Customer CRUD operations', false, error);
  }
}

async function testAnalytics() {
  log('\n📊 Testing Analytics APIs...');
  
  try {
    const response = await makeRequest('GET', '/analytics?period=30d');
    logTestResult('GET /analytics', response.success);
  } catch (error) {
    logTestResult('GET /analytics', false, error);
  }
}

async function testPaymentProcessing() {
  log('\n💳 Testing Payment Processing APIs...');
  
  // Test payments list
  try {
    const response = await makeRequest('GET', '/payments');
    logTestResult('GET /payments', response.success);
  } catch (error) {
    logTestResult('GET /payments', false, error);
  }

  // Test payment creation (requires order)
  try {
    // Create a test order first
    const customerData = {
      name: 'Payment Test Customer',
      email: 'payment@test.com',
      phone: '+1-555-0125'
    };
    const customerResponse = await makeRequest('POST', '/customers', customerData);
    
    if (customerResponse.success && customerResponse.data.data?.customer?.id) {
      const customerId = customerResponse.data.data.customer.id;
      
      const productData = {
        name: 'Payment Test Product',
        slug: 'payment-test-product',
        sku: 'PAY-001',
        description: 'Product for payment testing',
        price: 49.99,
        stockQuantity: 25,
        isActive: true
      };
      const productResponse = await makeRequest('POST', '/products', productData);
      
      if (productResponse.success && productResponse.data.data?.product?.id) {
        const productId = productResponse.data.data.product.id;
        
        const orderData = {
          customerId,
          items: [{
            productId,
            quantity: 1,
            price: 49.99
          }],
          shippingAddress: {
            street: '789 Payment St',
            city: 'Payment City',
            state: 'PC',
            zipCode: '11111',
            country: 'USA'
          },
          shippingMethod: 'express',
          paymentMethod: 'stripe',
          taxRate: 8.5,
          shippingCost: 9.99
        };
        
        const orderResponse = await makeRequest('POST', '/orders', orderData);
        
        if (orderResponse.success && orderResponse.data.data?.order?.id) {
          const orderId = orderResponse.data.data.order.id;
          
          // Create payment
          const paymentData = {
            orderId,
            amount: 49.99,
            currency: 'USD',
            method: 'STRIPE',
            gateway: 'stripe',
            metadata: {
              paymentMethod: 'card',
              last4: '4242'
            }
          };
          
          const paymentResponse = await makeRequest('POST', '/payments', paymentData);
          logTestResult('POST /payments', paymentResponse.success);
        }
      }
    }
  } catch (error) {
    logTestResult('Payment creation', false, error);
  }
}

async function testWarehouseManagement() {
  log('\n🏭 Testing Warehouse Management APIs...');
  
  // Test warehouses list
  try {
    const response = await makeRequest('GET', '/warehouses');
    logTestResult('GET /warehouses', response.success);
  } catch (error) {
    logTestResult('GET /warehouses', false, error);
  }

  // Test warehouse creation
  try {
    const warehouseData = {
      name: 'Test Warehouse',
      code: 'TEST-WH',
      address: {
        street: '123 Warehouse St',
        city: 'Warehouse City',
        state: 'WC',
        zipCode: '22222',
        country: 'USA'
      },
      contactPerson: 'Test Manager',
      contactEmail: 'manager@testwarehouse.com',
      contactPhone: '+1-555-0126',
      capacity: 10000
    };
    
    const response = await makeRequest('POST', '/warehouses', warehouseData);
    logTestResult('POST /warehouses', response.success);
  } catch (error) {
    logTestResult('POST /warehouses', false, error);
  }
}

async function testCampaignManagement() {
  log('\n📢 Testing Campaign Management APIs...');
  
  // Test campaigns list
  try {
    const response = await makeRequest('GET', '/campaigns');
    logTestResult('GET /campaigns', response.success);
  } catch (error) {
    logTestResult('GET /campaigns', false, error);
  }

  // Test campaign creation
  try {
    const campaignData = {
      name: 'API Test Campaign',
      description: 'A test campaign created via API testing',
      type: 'EMAIL',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      channels: ['email'],
      targetAudience: {
        customerSegments: ['new', 'returning'],
        ageRange: { min: 18, max: 65 }
      }
    };
    
    const response = await makeRequest('POST', '/campaigns', campaignData);
    logTestResult('POST /campaigns', response.success);
  } catch (error) {
    logTestResult('POST /campaigns', false, error);
  }
}

async function testBulkOperations() {
  log('\n⚡ Testing Bulk Operations APIs...');
  
  // Test bulk operations list
  try {
    const response = await makeRequest('GET', '/bulk-operations');
    logTestResult('GET /bulk-operations', response.success);
  } catch (error) {
    logTestResult('GET /bulk-operations', false, error);
  }

  // Test bulk operation creation
  try {
    const bulkData = {
      type: 'PRODUCT_UPDATE',
      items: [
        { id: 'test-product-1', updates: { price: 29.99 } },
        { id: 'test-product-2', updates: { price: 39.99 } }
      ],
      settings: {
        dryRun: true,
        batchSize: 10
      }
    };
    
    const response = await makeRequest('POST', '/bulk-operations', bulkData);
    logTestResult('POST /bulk-operations', response.success);
  } catch (error) {
    logTestResult('POST /bulk-operations', false, error);
  }
}

async function testReports() {
  log('\n📈 Testing Reports APIs...');
  
  // Test reports list
  try {
    const response = await makeRequest('GET', '/reports');
    logTestResult('GET /reports', response.success);
  } catch (error) {
    logTestResult('GET /reports', false, error);
  }

  // Test report generation
  try {
    const reportData = {
      type: 'SALES',
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      format: 'JSON',
      includeCharts: true
    };
    
    const response = await makeRequest('POST', '/reports', reportData);
    logTestResult('POST /reports', response.success);
  } catch (error) {
    logTestResult('POST /reports', false, error);
  }
}

async function testIntegrations() {
  log('\n🔗 Testing Integrations APIs...');
  
  // Test integrations list
  try {
    const response = await makeRequest('GET', '/integrations');
    logTestResult('GET /integrations', response.success);
  } catch (error) {
    logTestResult('GET /integrations', false, error);
  }

  // Test integration creation
  try {
    const integrationData = {
      name: 'Test Stripe Integration',
      type: 'PAYMENT',
      provider: 'STRIPE',
      credentials: {
        secretKey: 'sk_test_1234567890',
        publishableKey: 'pk_test_1234567890'
      },
      settings: {
        webhookSecret: 'whsec_test_1234567890'
      }
    };
    
    const response = await makeRequest('POST', '/integrations', integrationData);
    logTestResult('POST /integrations', response.success);
  } catch (error) {
    logTestResult('POST /integrations', false, error);
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting SmartStoreSaaS API Testing Suite...', 'success');
  log('==================================================');
  
  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    log('❌ Authentication failed. Cannot proceed with tests.', 'error');
    process.exit(1);
  }
  
  // Run all test suites
  await testAuthentication();
  await testProductManagement();
  await testOrderManagement();
  await testCustomerManagement();
  await testAnalytics();
  await testPaymentProcessing();
  await testWarehouseManagement();
  await testCampaignManagement();
  await testBulkOperations();
  await testReports();
  await testIntegrations();
  
  // Print results
  log('\n==================================================');
  log('📊 TEST RESULTS SUMMARY', 'success');
  log('==================================================');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`.green);
  log(`Failed: ${testResults.failed}`.red);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`, 'error');
    });
  }
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! APIs are working correctly.', 'success');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'warning');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`❌ Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};
