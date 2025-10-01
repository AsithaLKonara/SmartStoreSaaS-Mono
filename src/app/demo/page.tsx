"use client";

import { useState } from 'react';

export default function DemoPage() {
  const [log, setLog] = useState<string>("");

  async function call(endpoint: string, body?: unknown) {
    setLog("Calling " + endpoint + "...");
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const json = await res.json();
      setLog(JSON.stringify(json, null, 2));
    } catch (e) {
      setLog(String(e));
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">SmartStore Demo Integrations</h1>

      <div className="space-x-2">
        <button className="px-3 py-2 bg-black text-white rounded" onClick={() => call('/api/demo/email')}>Send Demo Email</button>
        <button className="px-3 py-2 bg-black text-white rounded" onClick={() => call('/api/demo/sms')}>Send Demo SMS</button>
        <button className="px-3 py-2 bg-black text-white rounded" onClick={() => call('/api/demo/stripe', { amount: 10 })}>Create Stripe Intent</button>
        <button className="px-3 py-2 bg-black text-white rounded" onClick={() => call('/api/demo/paypal', { amount: 10 })}>Create PayPal Order</button>
      </div>

      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto min-h-[180px]">{log}</pre>
    </div>
  );
}



