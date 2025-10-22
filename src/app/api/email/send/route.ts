/**
 * Email Send API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_COMMUNICATIONS permission)
 * - Prevents abuse by requiring admin privileges
 * 
 * Organization Scoping: Uses user's organization for tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/emailService';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { to, subject, htmlContent, textContent, replyTo } = body;

      if (!to || !subject) {
        throw new ValidationError('Recipient and subject are required');
      }

      if (!htmlContent && !textContent) {
        throw new ValidationError('Either HTML or text content is required');
      }

      const result = await emailService.sendEmail({
        to,
        subject,
        htmlContent,
        textContent: textContent || htmlContent?.replace(/<[^>]*>/g, ''),
        replyTo
      });

      logger.info({
        message: 'Email sent',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          to,
          subject,
          success: result.success
        }
      });

      if (result.success) {
        return NextResponse.json(successResponse({
          messageId: result.messageId,
          message: 'Email sent successfully'
        }));
      } else {
        logger.error({
          message: 'Email sending failed',
          error: new Error(result.error || 'Unknown error'),
          context: { userId: user.id, to }
        });
        
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to send email'
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      logger.error({
        message: 'Email API error',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
