/**
 * WooCommerce Webhook Handler API Route
 * 
 * Authorization:
 * - POST: Public (WooCommerce webhook callback)
 * 
 * Handles WooCommerce webhooks for specific organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const organizationId = url.pathname.split('/').slice(-2)[0]; // Extract from URL path
    const body = await req.json();

    logger.info({
      message: 'WooCommerce webhook received',
      context: {
        organizationId,
        event: body.topic || body.event
      }
    });

    // TODO: Process WooCommerce webhook
    return NextResponse.json(successResponse({
      received: true,
      organizationId
    }));
  }
);
