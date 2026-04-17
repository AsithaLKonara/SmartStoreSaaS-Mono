/**
 * Stripe Webhook Handler API Route
 * 
 * Authorization:
 * - POST: Public (Stripe webhook callback)
 * 
 * Handles Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (!webhookSecret || !sig) {
        // If no secret configured, parse body directly (dev mode)
        event = JSON.parse(rawBody) as Stripe.Event;
      } else {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' });
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      }
    } catch (err: any) {
      logger.error({ message: 'Stripe webhook signature invalid', error: err });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const { type, data } = event;

    logger.info({ message: 'Stripe webhook received', context: { eventType: type } });

    try {
      switch (type) {
        case 'payment_intent.succeeded': {
          const pi = data.object as Stripe.PaymentIntent;
          const organizationId = pi.metadata?.organizationId;
          const orderId = pi.metadata?.orderId;

          if (organizationId && orderId) {
            await prisma.order.update({
              where: { id: orderId, organizationId },
              data: { status: 'PROCESSING' },
            });
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = data.object as Stripe.PaymentIntent;
          await prisma.paymentIntent.updateMany({
            where: { stripeId: pi.id },
            data: { status: 'FAILED' },
          });
          break;
        }
        case 'invoice.paid': {
          const inv = data.object as Stripe.Invoice;
          if (inv.id) {
            await prisma.invoice.updateMany({
              where: { stripeInvoiceId: inv.id },
              data: { status: 'PAID', paidAt: new Date() },
            });
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          logger.info({ message: `Subscription event: ${type}`, stripeEvent: data.object });
          break;
        }
        default:
          logger.info({ message: `Stripe event unhandled: ${type}` });
      }
    } catch (processingError: any) {
      logger.error({ message: 'Stripe webhook processing failed', error: processingError, eventType: type });
    }

    return NextResponse.json(successResponse({ received: true, eventType: type }));
  }
);
