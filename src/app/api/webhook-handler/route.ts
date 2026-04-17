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
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const body = await req.json();
    const { source, event, data, organizationId } = body;

    logger.info({
      message: 'Webhook received',
      context: { source, event }
    });

    // If an organization ID is provided, log it as an activity so it shows up in their events route
    if (organizationId) {
        await prisma.activityLog.create({
            data: {
                organizationId,
                type: `WEBHOOK_${(source || 'EXTERNAL').toUpperCase()}`,
                description: `Received ${event || 'event'} from ${source || 'external source'}`,
                metadata: data || {},
            }
        });
    }

    return NextResponse.json(successResponse({
      received: true,
      source,
      event
    }));
  }
);
