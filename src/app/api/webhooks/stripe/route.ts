import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-10-28.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;
        await handleRefund(refund);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (orderId) {
      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId,
          organizationId: paymentIntent.metadata.organizationId || '',
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency.toUpperCase(),
          method: 'CARD',
          status: 'COMPLETED',
          transactionId: paymentIntent.id,
          gateway: 'Stripe',
          metadata: JSON.stringify(paymentIntent),
        },
      });

      console.log(`Payment successful for order ${orderId}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (orderId) {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAYMENT_FAILED' },
      });

      // Log failed payment
      await prisma.payment.create({
        data: {
          orderId,
          organizationId: paymentIntent.metadata.organizationId || '',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          method: 'CARD',
          status: 'FAILED',
          transactionId: paymentIntent.id,
          gateway: 'Stripe',
          metadata: JSON.stringify({
            error: paymentIntent.last_payment_error,
          }),
        },
      });

      console.log(`Payment failed for order ${orderId}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  try {
    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: { transactionId: charge.id },
    });

    if (payment) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });

      // Update order status
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'REFUNDED' },
      });

      console.log(`Refund processed for payment ${payment.id}`);
    }
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}

