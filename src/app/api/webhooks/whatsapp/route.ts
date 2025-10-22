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
import { withErrorHandlerApp, successResponse } from '@/lib/middleware/withErrorHandlerApp';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandlerApp(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      logger.info({ message: 'WhatsApp webhook verified' });
      return new NextResponse(challenge);
    }

    return new NextResponse('Verification failed', { status: 403 });
  }
);

export const POST = withErrorHandlerApp(
  async (req: NextRequest) => {
    const body = await req.json();

    logger.info({
      message: 'WhatsApp webhook received',
      context: { event: body }
    });

    // TODO: Process WhatsApp webhook
    return NextResponse.json(successResponse({ received: true }));
  }
);
