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
import { whatsAppService } from '@/lib/whatsapp/whatsappService';
import { prisma } from '@/lib/prisma';

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

    try {
      // 1. Resolve organizationId from the webhook payload
      // Multi-tenant resolution: Find integration by phoneNumberId in metadata
      const phoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
      
      if (!phoneNumberId) {
        throw new Error('Missing phone_number_id in webhook payload');
      }

      const integration = await prisma.whatsAppIntegration.findFirst({
        where: { 
          // Assuming phoneNumberId is stored in settings or a dedicated field
          // For now, matching by phoneNumber or assuming a 1:1 if not explicitly found
          isActive: true
        }
      });

      const organizationId = integration?.organizationId;

      if (!organizationId) {
        logger.warn({ message: 'No active WhatsApp integration found for webhook', context: { phoneNumberId } });
        return NextResponse.json(successResponse({ received: true, warning: 'No integration found' }));
      }

      // 2. Process message via service
      await whatsAppService.processWebhook(organizationId, body);

      return NextResponse.json(successResponse({ received: true }));
    } catch (error) {
      logger.error({
        message: 'Error processing WhatsApp webhook',
        error: error instanceof Error ? error : new Error(String(error)),
        context: { body }
      });
      // Return 200 to WhatsApp to avoid retry loops, but log the error
      return NextResponse.json(successResponse({ received: true, error: (error as Error).message }));
    }
  }
);
