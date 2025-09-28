import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
    const body = await request.json().catch(() => ({}));
    const amount = Math.round(Number(body.amount ?? 10) * 100);
    const currency = (process.env.STRIPE_DEFAULT_CURRENCY || 'usd').toLowerCase();

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { demo: 'true' },
    });

    return NextResponse.json({ clientSecret: intent.client_secret, id: intent.id, status: intent.status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


