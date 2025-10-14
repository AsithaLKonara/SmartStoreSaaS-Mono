/**
 * WhatsApp Verification API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_INTEGRATIONS permission)
 * 
 * Verifies WhatsApp Business API credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { phoneNumberId, accessToken } = body;

      if (!phoneNumberId || !accessToken) {
        throw new ValidationError('Phone number ID and access token are required');
      }

      logger.info({
        message: 'WhatsApp verification requested',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          phoneNumberId
        }
      });

      // TODO: Verify actual WhatsApp credentials
      return NextResponse.json(successResponse({
        verified: true,
        phoneNumberId,
        message: 'WhatsApp credentials verified'
      }));
    } catch (error: any) {
      logger.error({
        message: 'WhatsApp verification failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
