/**
 * WhatsApp Webhook API Route
 * 
 * Authorization:
 * - POST: Public (WhatsApp webhook callbacks)
 * - GET: Public (WhatsApp webhook verification)
 * 
 * Handles WhatsApp webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandlerApp(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const mode = searchParams.get('hub.mode');
      const token = searchParams.get('hub.verify_token');
      const challenge = searchParams.get('hub.challenge');

      // TODO: Verify webhook token
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        logger.info({
          message: 'WhatsApp webhook verified'
        });
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

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    try {
      const body = await req.json();

      logger.info({
        message: 'WhatsApp webhook received',
        context: { event: body.entry?.[0]?.changes?.[0]?.value }
      });

      // TODO: Process WhatsApp webhook event
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
