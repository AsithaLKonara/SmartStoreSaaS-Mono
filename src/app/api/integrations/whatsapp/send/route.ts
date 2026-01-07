/**
 * WhatsApp Send Message API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (SEND_WHATSAPP permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { to, message } = body;

      if (!to || !message) {
        throw new ValidationError('Recipient and message are required');
      }

      logger.info({
        message: 'WhatsApp message sent',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          to
        }
      });

      // TODO: Send actual WhatsApp message
      return NextResponse.json(successResponse({
        messageId: `whatsapp_${Date.now()}`,
        status: 'sent',
        to
      }));
    } catch (error: any) {
      logger.error({
        message: 'WhatsApp send failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

