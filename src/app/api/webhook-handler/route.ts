/**
 * Generic Webhook Handler API Route
 * 
 * Authorization:
 * - POST: Public (external webhook callbacks)
 * 
 * Generic handler for various webhook sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
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
  }
);
