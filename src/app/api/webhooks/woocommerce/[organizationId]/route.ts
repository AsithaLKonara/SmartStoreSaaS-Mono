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
import { wooCommerceService } from '@/lib/woocommerce/woocommerceService';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    // Dynamic segments are not directly accessible if middleware blocks them, but we can parse URL
    // or rely on the extraction logic.
    // Ensure organizationId is treated as string.
    const pathSegments = url.pathname.split('/');
    const organizationId = pathSegments[pathSegments.length - 2] || 'unknown';
    if (organizationId === 'unknown') {
      // Should fail?
    }
    const body = await req.json();

    logger.info({
      message: 'WooCommerce webhook received',
      context: {
        organizationId,
        event: body.topic || body.event
      }
    });

    // Process WooCommerce webhook
    try {
      await wooCommerceService.handleWebhook(
        organizationId,
        body.type || 'product', // Default to product if missing, but PHP sends it
        body.action || 'update',
        body.data || body
      );
    } catch (error) {
      logger.error({
        message: 'Failed to process WooCommerce webhook',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { organizationId }
      });
      // Don't fail the request, acknowledge receipt
    }
    return NextResponse.json(successResponse({
      received: true,
      organizationId
    }));
  }
);
