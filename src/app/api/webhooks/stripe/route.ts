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

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const body = await req.json();
    const { type, data } = body;

    logger.info({
      message: 'Stripe webhook received',
      context: { eventType: type }
    });

    // TODO: Process Stripe webhook event
    return NextResponse.json(successResponse({
      received: true,
      eventType: type
    }));
  }
);
