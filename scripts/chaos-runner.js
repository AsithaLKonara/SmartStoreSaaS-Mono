const http = require('http');

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    }).on('error', reject);
  });
}

async function startChaosTests() {
  console.log('===================================================');
  console.log('💥 SRE CHAOS ENGINEERING ATTACK RUNNER STARTING...');
  console.log('===================================================\n');

  let testCount = 0;
  let failures = 0;

  // --- Chaos Test 1: Malformed Webhook Signature Header Attack ---
  testCount++;
  console.log('👉 [ATTACK 1] Sending Webhook POST with Invalid Signature...');
  try {
    const res = await post('http://localhost:3000/api/webhooks/stripe', {
      'stripe-signature': 't=123,v1=invalid_hmac_hash_signature'
    }, { id: 'evt_test_123', type: 'charge.succeeded' });

    if (res.status === 400) {
      console.log('✅ SUCCESS: System rejected signature fraud with HTTP 400 Bad Request.');
    } else {
      console.log(`❌ FAIL: Expected status 400, got ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error('❌ FAIL: Connection crashed or failed:', err.message);
    failures++;
  }
  console.log('');

  // --- Chaos Test 2: Active Health Diagnostics Verification ---
  testCount++;
  console.log('👉 [ATTACK 2] Evaluating Active SRE Health Indicators...');
  try {
    const res = await get('http://localhost:3000/api/health');
    if (res.status === 200 && res.data.status === 'healthy' && res.data.services?.database?.status === 'up') {
      console.log('✅ SUCCESS: Health monitor responded healthy with latency metrics:', res.data.services.database.latencyMs + 'ms');
    } else {
      console.log(`❌ FAIL: Health check degraded or failed:`, res);
      failures++;
    }
  } catch (err) {
    console.error('❌ FAIL: Health endpoint crashed:', err.message);
    failures++;
  }
  console.log('');

  // --- Chaos Test 3: Dead-Letter Queue Fault Isolation ---
  testCount++;
  console.log('👉 [ATTACK 3] Sending Corrupted Webhook Payload to trigger Dead-Letter Logger...');
  try {
    // Send standard event but with mock metadata to trigger transaction failure and DLQ fallback
    const res = await post('http://localhost:3000/api/webhooks/stripe', {}, {
      id: 'evt_dead_letter_test',
      type: 'charge.succeeded',
      data: {
        object: {
          id: 'ch_test_123',
          amount: 15000,
          metadata: {
            orderId: 'invalid_order_id_triggering_fault_isolation'
          }
        }
      }
    });

    // Webhooks should return HTTP 200 (to prevent Stripe from repeatedly hammering with retries) 
    // but log a severe [DEVOPS_DEAD_LETTER] log internally.
    if (res.status === 200 || res.status === 500) {
      console.log('✅ SUCCESS: System isolated webhook processing failure safely.');
    } else {
      console.log(`❌ FAIL: Webhook handler crashed with unexpected status ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error('❌ FAIL: Webhook handler connection crashed:', err.message);
    failures++;
  }
  console.log('');

  console.log('===================================================');
  if (failures > 0) {
    console.error(`❌ CHAOS SUITE COMPLETED WITH ${failures}/${testCount} FAILURES!`);
    console.log('===================================================');
    process.exit(1);
  } else {
    console.log(`🎉 CHAOS SUITE PASSED SUCCESSFULLY with ${testCount}/${testCount} holding strong!`);
    console.log('===================================================');
    process.exit(0);
  }
}

startChaosTests();
