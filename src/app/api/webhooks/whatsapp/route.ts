/**
 * WhatsApp Webhook Handler API Route
 * 
 * Authorization:
 * - POST: Public (WhatsApp webhook callback)
 * - GET: Public (webhook verification)
 * 
 * Handles WhatsApp Business API webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const mode = searchParams.get('hub.mode');
      const token = searchParams.get('hub.verify_token');
      const challenge = searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        logger.info({ message: 'WhatsApp webhook verified' });
        return new NextResponse(challenge);
      }

      return new NextResponse('Verification failed', { status: 403 });
    } catch (error: any) {
      logger.error({
        message: 'WhatsApp webhook verification failed',
        error: error
      });
      throw error;
    }
  }
);

export const POST = withErrorHandler(
  async (req: NextRequest) => {
    try {
      const body = await req.json();

      logger.info({
        message: 'WhatsApp webhook received',
        context: { event: body }
      });

      // TODO: Process WhatsApp webhook
      return NextResponse.json(successResponse({ received: true }));
    } catch (error: any) {
      logger.error({
        message: 'WhatsApp webhook processing failed',
        error: error
      });
      throw error;
    }
  }
);
