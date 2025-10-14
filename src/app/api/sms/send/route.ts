/**
 * SMS Send API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_COMMUNICATIONS permission)
 * - Prevents SMS abuse by requiring admin privileges
 * 
 * Organization Scoping: Uses user's organization for billing/tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendBulkSMS } from '@/lib/integrations/sms';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { to, message, bulk, messages } = body;

      // Bulk SMS sending
      if (bulk && messages && Array.isArray(messages)) {
        const result = await sendBulkSMS(messages);
        
        logger.info({
          message: 'Bulk SMS sent',
          context: {
            userId: user.id,
            organizationId: user.organizationId,
            sent: result.sent,
            failed: result.failed
          }
        });
        
        return NextResponse.json(successResponse({
          sent: result.sent,
          failed: result.failed,
          message: `Sent ${result.sent} messages, ${result.failed} failed`
        }));
      }

      // Single SMS sending
      if (!to || !message) {
        throw new ValidationError('Phone number and message are required');
      }

      const result = await sendSMS({ to, message });

      logger.info({
        message: 'SMS sent',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          to,
          success: result.success
        }
      });

      if (result.success) {
        return NextResponse.json(successResponse({
          messageId: result.messageId,
          message: 'SMS sent successfully'
        }));
      } else {
        logger.error({
          message: 'SMS sending failed',
          error: new Error(result.error || 'Unknown error'),
          context: { userId: user.id, to }
        });
        
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to send SMS'
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      logger.error({
        message: 'SMS API error',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
