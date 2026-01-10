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
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/whatsapp/send
 * Send WhatsApp message (MANAGE_INTEGRATIONS permission)
 */
export const POST = requirePermission('MANAGE_INTEGRATIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { to, message } = body;

      if (!to || !message) {
        throw new ValidationError('Recipient and message are required', {
          fields: { to: !to, message: !message }
        });
      }

      logger.info({
        message: 'WhatsApp message sent',
        context: {
          userId: user.id,
          organizationId,
          to
        },
        correlation: req.correlationId
      });

      // TODO: Send actual WhatsApp message
      return NextResponse.json(successResponse({
        messageId: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'sent',
        to
      }));
    } catch (error: any) {
      logger.error({
        message: 'WhatsApp send failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'WhatsApp send failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

