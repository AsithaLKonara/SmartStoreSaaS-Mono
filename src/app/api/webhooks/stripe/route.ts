/**
 * Stripe Webhook Handler API Route
 * 
 * Authorization:
 * - POST: Public (Stripe webhook callback)
 * 
 * Handles Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(
  async (req: NextRequest) => {
    try {
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
    } catch (error: any) {
      logger.error({
        message: 'Stripe webhook processing failed',
        error: error
      });
      throw error;
    }
  }
);
