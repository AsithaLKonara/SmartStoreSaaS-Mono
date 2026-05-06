import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { OrderStateService } from '@/lib/services/order-state.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
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
        if (process.env.NODE_ENV === 'production') {
          logger.error({ message: 'Stripe webhook missing signature or secret in production' });
          return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
        }
        // Dev mode fallback
        event = JSON.parse(rawBody) as Stripe.Event;
      } else {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' as any });
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      }
    } catch (err: any) {
      logger.error({ message: 'Stripe webhook signature invalid', error: err });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const { type, data } = event;
    const eventId = event.id;

    logger.info({ message: 'Stripe webhook received', context: { eventId, eventType: type } });
    console.log(`[STRIPE WEBHOOK] Received event: ${type} (eventId: ${eventId})`);

    // 1. Pre-transaction Deduplication Check
    const alreadyProcessed = await prisma.processedWebhookEvent.findUnique({
      where: { eventId }
    });

    if (alreadyProcessed) {
      logger.info({ message: 'Stripe webhook already processed (deduplicated)', context: { eventId, eventType: type } });
      console.log(`[STRIPE WEBHOOK] Webhook already processed (eventId: ${eventId}). Deduplicating...`);
      return successResponse({ received: true, eventId, duplicated: true });
    }

    try {
      switch (type) {
        case 'payment_intent.succeeded': {
          const pi = data.object as Stripe.PaymentIntent;
          const organizationId = pi.metadata?.organizationId;
          const orderId = pi.metadata?.orderId;
          console.log(`[STRIPE WEBHOOK] Succeeded metadata - orderId: ${orderId}, organizationId: ${organizationId}`);

          if (!orderId || !organizationId) {
            console.log(`[STRIPE WEBHOOK] ERROR: Missing metadata!`);
            logger.error({ message: 'Stripe succeeded metadata missing orderId or organizationId', context: { piId: pi.id } });
            return NextResponse.json({ error: 'Missing order details in metadata' }, { status: 400 });
          }

          // Use atomic transaction to update order, payment and insert ProcessedWebhookEvent
          await prisma.$transaction(async (tx) => {
            // Guard: Double-check event processing inside transaction
            const existsInTx = await tx.processedWebhookEvent.findUnique({
              where: { eventId }
            });
            if (existsInTx) {
              return;
            }

            const order = await tx.order.findUnique({
              where: { id: orderId, organizationId }
            });

            console.log(`[STRIPE WEBHOOK] Order found in DB:`, order ? `Yes (status: ${order.status})` : 'No');
            if (!order) {
              throw new Error(`Order ${orderId} not found`);
            }

            // Financial Drift Audit: alert on payment amount deviations
            const expectedAmount = Number(order.total);
            const actualAmount = pi.amount / 100;
            if (Math.abs(expectedAmount - actualAmount) > 0.01) {
              logger.error({
                message: '[ALERT_CRITICAL] Financial drift detected! Webhook payment amount does not match Order total.',
                context: {
                  orderId,
                  orderTotal: expectedAmount,
                  paymentAmount: actualAmount,
                  piId: pi.id
                }
              });
              console.error(`[ALERT_CRITICAL] Webhook payment amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
            }

            // Insert ProcessedWebhookEvent atomically
            await tx.processedWebhookEvent.create({
              data: {
                eventId,
                gateway: 'stripe'
              }
            });

            // Check if order is already processed or paid (idempotency check)
            if (order.status === OrderStatus.PROCESSING) {
              logger.info({ message: 'Order already processed/paid', context: { orderId } });
              return;
            }

            // Validate status transition to PROCESSING (PAID state)
            OrderStateService.validateTransition(order.status, OrderStatus.PROCESSING);

            // 1. Update Order status
            await tx.order.update({
              where: { id: orderId },
              data: { status: OrderStatus.PROCESSING }
            });

            // 2. Log in OrderStatusHistory
            await tx.orderStatusHistory.create({
              data: {
                orderId,
                status: OrderStatus.PROCESSING,
                notes: `Paid via Stripe (Payment Intent: ${pi.id})`
              }
            });

            // 3. Upsert Payment record for financial integrity
            const existingPayment = await tx.payment.findFirst({
              where: { transactionId: pi.id }
            });

            if (!existingPayment) {
              await tx.payment.create({
                data: {
                  orderId,
                  organizationId,
                  amount: actualAmount,
                  currency: pi.currency ? pi.currency.toUpperCase() : 'LKR',
                  method: 'CARD',
                  status: PaymentStatus.PAID,
                  transactionId: pi.id,
                  gateway: 'stripe',
                  metadata: JSON.parse(JSON.stringify(pi.metadata || {}))
                }
              });
            }
          });

          logger.info({ message: 'Payment successfully processed and order updated to PAID/PROCESSING', context: { orderId } });
          break;
        }

        case 'payment_intent.payment_failed': {
          const pi = data.object as Stripe.PaymentIntent;
          const organizationId = pi.metadata?.organizationId;
          const orderId = pi.metadata?.orderId;
          console.log(`[STRIPE WEBHOOK] Failed metadata - orderId: ${orderId}, organizationId: ${organizationId}`);

          if (!orderId || !organizationId) {
            console.log(`[STRIPE WEBHOOK] ERROR: Missing metadata in failed intent!`);
            logger.error({ message: 'Stripe failed metadata missing orderId or organizationId', context: { piId: pi.id } });
            return NextResponse.json({ error: 'Missing order details in metadata' }, { status: 400 });
          }

          await prisma.$transaction(async (tx) => {
            // Guard: Double-check event processing inside transaction
            const existsInTx = await tx.processedWebhookEvent.findUnique({
              where: { eventId }
            });
            if (existsInTx) {
              return;
            }

            const order = await tx.order.findUnique({
              where: { id: orderId, organizationId }
            });

            console.log(`[STRIPE WEBHOOK] Order found in DB for failed intent:`, order ? 'Yes' : 'No');
            if (!order) {
              throw new Error(`Order ${orderId} not found`);
            }

            // Insert ProcessedWebhookEvent atomically
            await tx.processedWebhookEvent.create({
              data: {
                eventId,
                gateway: 'stripe'
              }
            });

            // Upsert Payment record with status FAILED
            const existingPayment = await tx.payment.findFirst({
              where: { transactionId: pi.id }
            });

            if (!existingPayment) {
              await tx.payment.create({
                data: {
                  orderId,
                  organizationId,
                  amount: pi.amount / 100,
                  currency: pi.currency ? pi.currency.toUpperCase() : 'LKR',
                  method: 'CARD',
                  status: PaymentStatus.FAILED,
                  transactionId: pi.id,
                  gateway: 'stripe',
                  metadata: JSON.parse(JSON.stringify(pi.metadata || {}))
                }
              });
            } else {
              await tx.payment.update({
                where: { id: existingPayment.id },
                data: { status: PaymentStatus.FAILED }
              });
            }
          });

          logger.warn({ message: 'Payment failed for Order', context: { orderId, piId: pi.id } });
          break;
        }

        default:
          logger.info({ message: `Unhandled webhook event type: ${type}` });
      }
    } catch (processingError: any) {
      console.error(`[STRIPE WEBHOOK] Processing error for type ${type}:`, processingError.message);
      logger.error({
        message: '[DEVOPS_DEAD_LETTER] Stripe webhook processing failure. Transaction has been aborted and logged for manual replay.',
        error: processingError,
        context: {
          eventId,
          eventType: type,
          rawEventData: event
        }
      });
      return NextResponse.json({ error: processingError.message || 'Processing failed' }, { status: 400 });
    }

    return successResponse({ received: true, eventId, eventType: type });
  }
);
