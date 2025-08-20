const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const tests = [
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Readiness Check',
    path: '/api/readyz',
    method: 'GET',
    expectedStatus: 503 // Expected in dev without DB
  },
  {
    name: 'Products API (Protected)',
    path: '/api/products?limit=5',
    method: 'GET',
    expectedStatus: 401 // Expected without auth
  },
  {
    name: 'Customers API (Protected)',
    path: '/api/customers?limit=5',
    method: 'GET',
    expectedStatus: 401 // Expected without auth
  },
  {
    name: 'Orders API (Protected)',
    path: '/api/orders?limit=5',
    method: 'GET',
    expectedStatus: 401 // Expected without auth
  },
  {
    name: 'Search API (Protected)',
    path: '/api/search?q=test&type=products',
    method: 'GET',
    expectedStatus: 401 // Expected without auth
  },
  {
    name: 'Chat API (Protected)',
    path: '/api/chat/conversations?limit=5',
    method: 'GET',
    expectedStatus: 401 // Expected without auth
  }
];

function makeRequest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: test.method,
      headers: {
        'User-Agent': 'SmartStore-Test/1.0'
      }
    };

    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let result = '✅ PASS';
        if (res.statusCode !== test.expectedStatus) {
          result = '❌ FAIL';
        }
        
        console.log(`${result} ${test.name}`);
        console.log(`   Status: ${res.statusCode} (expected: ${test.expectedStatus})`);
        console.log(`   Response Time: ${responseTime}ms`);
        console.log(`   Headers: ${JSON.stringify({
          'content-type': res.headers['content-type'],
          'x-frame-options': res.headers['x-frame-options'],
          'access-control-allow-origin': res.headers['access-control-allow-origin']
        }, null, 2)}`);
        
        if (data) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`   Response: ${JSON.stringify(jsonData, null, 2)}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 200)}...`);
          }
        }
        console.log('');
        
        resolve({
          test: test.name,
          status: res.statusCode,
          expectedStatus: test.expectedStatus,
          responseTime,
          passed: res.statusCode === test.expectedStatus,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ERROR ${test.name}: ${error.message}`);
      console.log('');
      resolve({
        test: test.name,
        error: error.message,
        passed: false
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 SmartStore SaaS API Test Suite');
  console.log('=====================================\n');
  
  const results = [];
  
  for (const test of tests) {
    const result = await makeRequest(test);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('📊 Test Summary');
  console.log('================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const failed = total - passed;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.error || `Status ${r.status} (expected ${r.expectedStatus})`}`);
    });
  }
  
  console.log('\n🎯 Expected Results:');
  console.log('- Health Check: 200 (always working)');
  console.log('- Readiness Check: 503 (expected in dev without DB)');
  console.log('- Protected APIs: 401 (expected without authentication)');
  console.log('- All APIs should have security headers');
}

// Run tests
runTests().catch(console.error);
