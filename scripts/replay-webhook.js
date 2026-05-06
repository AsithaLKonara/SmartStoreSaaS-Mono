const http = require('http');

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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

async function runReplay() {
  console.log('===================================================');
  console.log('📖 SRE RUNBOOK MANUAL REPLAY RECOVERY VALIDATOR...');
  console.log('===================================================\n');

  // Step 1: Simulate extracting a dead-lettered webhook payload from logs
  console.log('👉 [STEP 1] Simulating retrieval of dead-lettered event payload...');
  const deadLetterPayload = {
    id: 'evt_manual_replay_test_999',
    type: 'charge.succeeded',
    data: {
      object: {
        id: 'ch_replay_mock_999',
        amount: 8500,
        metadata: {
          // This must correspond to an actual order or checkout flow to process
          orderId: 'mock_order_for_manual_replay_recovery'
        }
      }
    }
  };
  console.log('✅ Extracted payload successfully.\n');

  // Step 2: Trigger the SRE manual replay request using the local API webhook handler
  console.log('👉 [STEP 2] Dispatching manual event replay to endpoint...');
  try {
    const res = await post('http://localhost:3000/api/webhooks/stripe', deadLetterPayload);

    if (res.status === 200) {
      console.log('🎉 SUCCESS: Event successfully reprocessed by SRE runbook procedure!');
      console.log('===================================================');
      process.exit(0);
    } else {
      console.log(`❌ FAIL: Event replay returned status ${res.status}`);
      console.log('===================================================');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ FAIL: Connection crashed during replay recovery:', err.message);
    process.exit(1);
  }
}

runReplay();
