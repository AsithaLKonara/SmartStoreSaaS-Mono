import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const environment = (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'PayPal not configured' }, { status: 400 });
    }

    const baseURL = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json({ error: tokenJson?.error_description || 'Failed to get PayPal token' }, { status: 500 });
    }

    const amount = Number((await request.json().catch(() => ({}))).amount ?? 10).toFixed(2);
    const orderRes = await fetch(`${baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: amount },
            description: 'SmartStore Demo Order',
          },
        ],
        application_context: {
          return_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        },
      }),
    });

    const orderJson = await orderRes.json();
    if (!orderRes.ok) {
      return NextResponse.json({ error: orderJson?.message || 'Failed to create PayPal order' }, { status: 500 });
    }

    return NextResponse.json({ id: orderJson.id, status: orderJson.status, links: orderJson.links });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


