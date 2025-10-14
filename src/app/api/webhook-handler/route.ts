/**
 * Generic Webhook Handler API Route
 * 
 * Authorization:
 * - POST: Public (external webhook callbacks)
 * 
 * Generic handler for various webhook sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandler(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { source, event, data } = body;

      logger.info({
        message: 'Webhook received',
        context: {
          source,
          event
        }
      });

      // TODO: Process webhook based on source
      return NextResponse.json(successResponse({
        received: true,
        source,
        event
      }));
    } catch (error: any) {
      logger.error({
        message: 'Webhook processing failed',
        error: error
      });
      throw error;
    }
  }
);
